
import { GoogleGenAI, Type } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

// Initialisierung streng nach Vorgabe
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "AIzaSyA3t0CU1egkd6Yu4cE6lPYN95vOigguJnA" });

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
    Du bist ein Senior B2B Risk Manager. 
    Analysiere das vorliegende Scoring-Modell kritisch.
    
    KONFIGURATION:
    Gesamtgewichtung der Gruppen: ${totalGroupWeight}%
    
    STRUKTUR:
    ${configurationSummary}

    K.O. KRITERIEN:
    ${koCriteria.length > 0 ? koCriteria.map(k => `- ${k.label}: Wenn ${k.parameterName} ${k.operator} ${k.value}`).join("\n") : "Keine definiert"}

    AUFGABE:
    Bewerte die Logik und Vollständigkeit. Gib Feedback auf Deutsch in Markdown (max. 180 Wörter).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Feedback derzeit nicht verfügbar.";
  } catch (error) {
    console.error("Sparring Error:", error);
    throw new Error("KI-Feedback konnte nicht geladen werden.");
  }
};

export const generateScoringConfig = async (userRequest: string): Promise<{ groups: ParameterGroup[], parameters: ScoringParameter[] }> => {
  const ai = getAIClient();
  
  const prompt = `
    EXTRAHIERE UND ANALYSIERE: "${userRequest}"
    
    AUFGABE:
    1. Identifiziere alle vom Nutzer genannten Kriterien (z.B. Umsatz, Branche, Land, etc.).
    2. Erstelle daraus ein mathematisch korrektes Scoring-Modell.
    3. Gruppiere die Kriterien sinnvoll in 2-3 Gruppen (Summe Gewichte = 100).
    4. Weise jedem Parameter ein Gewicht innerhalb der Gruppe zu (Summe = 100).
    5. Erstelle für jeden Parameter 3-4 Punkte-Skalen (Ranges).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Du bist ein Senior B2B Risk Manager. Erstelle ein präzises Scoring-Modell als JSON basierend auf der Nutzerbeschreibung. Nutze IDs wie g1, g2, p1, p2. Antworte NUR mit dem JSON-Objekt.",
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

    const text = response.text;
    if (!text) throw new Error("Keine Daten von KI erhalten.");
    
    const parsed = JSON.parse(text);
    if (!parsed.groups || !parsed.parameters) throw new Error("Ungültiges Modell-Format.");
    
    return parsed;
  } catch (e) {
    console.error("Generator Error:", e);
    throw new Error("Die KI konnte aus Ihrem Text kein gültiges Modell erstellen. Bitte beschreiben Sie die Kriterien genauer.");
  }
};
