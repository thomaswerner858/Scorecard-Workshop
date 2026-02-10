
import { GoogleGenAI, Type } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

// Die GoogleGenAI Instanz wird erst beim Aufruf erstellt, um die aktuellste Umgebungsvariable zu nutzen.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyA3t0CU1egkd6Yu4cE6lPYN95vOigguJnA' });

export const getSparringFeedback = async (
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  const ai = getAIClient();
  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);
  
  const configurationSummary = groups.map(g => {
    const groupParams = parameters.filter(p => p.groupId === g.id);
    return `GRUPPE: ${g.name} (${g.weight}%)
      ${groupParams.map(p => `- ${p.name} (${p.weight}%, Typ: ${p.type})`).join("\n")}`;
  }).join("\n\n");

  const prompt = `
    Du bist ein Senior B2B Risk Manager und Credit Scoring Experte. 
    Analysiere das vorliegende Scoring-Modell kritisch und gib Verbesserungsvorschläge.
    
    KONFIGURATION:
    Gesamtgewichtung der Gruppen: ${totalGroupWeight}%
    
    STRUKTUR:
    ${configurationSummary}

    K.O. KRITERIEN:
    ${koCriteria.length > 0 ? koCriteria.map(k => `- ${k.label}: Wenn ${k.parameterName} ${k.operator} ${k.value}`).join("\n") : "Keine definiert"}

    AUFGABE:
    Bewerte die Logik und Vollständigkeit. Gib Feedback auf Deutsch in Markdown (max. 180 Wörter).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Feedback derzeit nicht verfügbar.";
};

export const generateScoringConfig = async (userRequest: string): Promise<{ groups: ParameterGroup[], parameters: ScoringParameter[] }> => {
  const ai = getAIClient();
  
  const prompt = `
    Erstelle als Senior B2B Risk Manager ein professionelles Scoring-Modell für: "${userRequest}".
    
    REGELN:
    1. 2-3 logische Gruppen, Summe Gewichte = 100.
    2. 2-3 Parameter pro Gruppe, Summe Gewichte pro Gruppe = 100.
    3. JSON-Format mit IDs (g1, g2... p1, p2...) und sinnvollen Score-Ranges.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Fehler beim Parsen der KI-Antwort.");
  }
};
