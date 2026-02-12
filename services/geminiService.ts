
import { GoogleGenAI } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || window.bilendoRuntimeConfig.phoneNumber });

export const getSparringFeedback = async (
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  const ai = getAIClient();
  const configurationSummary = groups.map(g => {
    const groupParams = parameters.filter(p => p.groupId === g.id);
    return `GRUPPE: ${g.name} (${g.weight}%)
      ${groupParams.map(p => `- ${p.name} (${p.weight}%, Typ: ${p.type})`).join("\n")}`;
  }).join("\n\n");

  const prompt = `
    Du bist ein Senior B2B Risk Manager. 
    Analysiere dieses Scoring-Modell:
    ${configurationSummary}
    K.O. KRITERIEN: ${koCriteria.map(k => k.label).join(", ")}
    Bewerte Logik und Lücken auf Deutsch (max. 150 Wörter). Gib konstruktives Feedback als Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Feedback derzeit nicht verfügbar.";
  } catch (error) {
    console.error("Sparring Error:", error);
    return "Fehler beim Laden des Feedbacks. Bitte prüfen Sie Ihre API-Konfiguration.";
  }
};
