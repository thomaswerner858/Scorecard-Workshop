
import { GoogleGenAI, Type } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

export const getSparringFeedback = async (
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);
  
  const configurationSummary = groups.map(g => {
    const groupParams = parameters.filter(p => p.groupId === g.id);
    return `GRUPPE: ${g.name} (${g.weight}%)
      ${groupParams.map(p => `- ${p.name} (${p.weight}%, Typ: ${p.type})`).join("\n")}`;
  }).join("\n\n");

  const prompt = `
    Du bist ein erfahrener B2B Risk Manager. Analysiere das Scoring-Modell:
    
    KONFIGURATION:
    Gesamtgewichtung der Gruppen: ${totalGroupWeight}%
    ${configurationSummary}

    K.O. KRITERIEN:
    ${koCriteria.length > 0 ? koCriteria.map(k => `- ${k.label}`).join("\n") : "Keine definiert"}

    AUFGABE:
    Gib kurzes, professionelles Feedback (max 150 Wörter) zur Logik und Vollständigkeit. 
    Achte besonders darauf, ob die Gewichtungen sinnvoll verteilt sind.
    Nutze Deutsch und Markdown.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Kein Feedback verfügbar.";
};

export const generateScoringConfig = async (userRequest: string): Promise<{ groups: ParameterGroup[], parameters: ScoringParameter[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Erstelle ein vollständiges B2B Scoring-Modell für folgende Anforderung: "${userRequest}".
    
    WICHTIGE REGELN:
    1. Erstelle 2-4 Gruppen. Die Summe der 'weight' Felder der Gruppen MUSS genau 100 sein.
    2. Jede Gruppe hat mehrere Parameter. Innerhalb jeder Gruppe MUSS die Summe der 'weight' Felder der Parameter genau 100 sein.
    3. Nutze 'numeric' für Zahlenwerte und 'categorical' für qualitative Optionen (Text).
    4. IDs müssen eindeutig sein (z.B. g1, g2 für Gruppen; p1, p2 für Parameter).
    5. Jede Range benötigt ein 'points' Feld (0-100).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          groups: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                weight: { type: Type.NUMBER }
              },
              required: ["id", "name", "weight"]
            }
          },
          parameters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                groupId: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["numeric", "categorical"] },
                weight: { type: Type.NUMBER },
                ranges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      min: { type: Type.NUMBER },
                      max: { type: Type.NUMBER },
                      label: { type: Type.STRING },
                      points: { type: Type.NUMBER }
                    },
                    required: ["id", "points"]
                  }
                }
              },
              required: ["id", "groupId", "name", "type", "weight", "ranges"]
            }
          }
        },
        required: ["groups", "parameters"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Leere Antwort von der KI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Parse Error:", e);
    throw new Error("Das Modell konnte nicht korrekt generiert werden.");
  }
};
