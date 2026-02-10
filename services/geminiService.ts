
import { GoogleGenAI, Type } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

export const getSparringFeedback = async (
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY=AIzaSyA3t0CU1egkd6Yu4cE6lPYN95vOigguJnA });
  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);
  
  const configurationSummary = groups.map(g => {
    const groupParams = parameters.filter(p => p.groupId === g.id);
    return `GRUPPE: ${g.name} (${g.weight}%)
      ${groupParams.map(p => `- ${p.name} (${p.weight}%, Typ: ${p.type})`).join("\n")}`;
  }).join("\n\n");

  const prompt = `
    Du bist ein erfahrener B2B Risk Manager und Credit Scoring Experte. 
    Analysiere das vorliegende Scoring-Modell eines Kunden im Onboarding kritisch und konstruktiv.
    
    KONFIGURATION:
    Gesamtgewichtung der Gruppen: ${totalGroupWeight}%
    
    STRUKTUR:
    ${configurationSummary}

    K.O. KRITERIEN:
    ${koCriteria.length > 0 ? koCriteria.map(k => `- ${k.label}: Wenn ${k.parameterName} ${k.operator} ${k.value}`).join("\n") : "Keine definiert"}

    AUFGABE:
    Bewerte die Logik, die Gewichtungen und die Vollständigkeit. 
    1. Sind die Gewichtungen zwischen Finanzen und Stammdaten ausgewogen?
    2. Fehlen branchenübliche Faktoren (z.B. Zahlungsverhalten, Marktdaten)?
    3. Sind die K.O.-Kriterien sinnvoll gewählt?
    
    Gib professionelles Feedback auf Deutsch in Markdown-Format (max. 180 Wörter).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Kein Feedback verfügbar.";
};

export const generateScoringConfig = async (userRequest: string): Promise<{ groups: ParameterGroup[], parameters: ScoringParameter[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY=AIzaSyA3t0CU1egkd6Yu4cE6lPYN95vOigguJnA });
  
  const prompt = `
    Du bist ein Senior B2B Risk Manager. Erstelle ein professionelles Scoring-Modell basierend auf: "${userRequest}".
    
    REGELN:
    1. Erstelle 2-3 logische Gruppen (z.B. Finanzielle Solidität, Operative Risiken). Summe der Gewichte = 100.
    2. Pro Gruppe 2-3 präzise Parameter. Summe der Gewichte pro Gruppe = 100.
    3. Nutze 'numeric' für messbare Daten und 'categorical' für qualitative Einschätzungen (Text-Labels).
    4. Antworte ausschließlich im validen JSON-Format.
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
    const text = response.text;
    if (!text) throw new Error("KI lieferte keine Daten.");
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Struktur konnte nicht generiert werden.");
  }
};
