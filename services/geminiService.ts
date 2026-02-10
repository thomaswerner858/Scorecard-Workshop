
import { GoogleGenAI } from "@google/genai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSparringFeedback = async (
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  try {
    const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);
    
    // Create a structured representation for the prompt
    const configurationSummary = groups.map(g => {
      const groupParams = parameters.filter(p => p.groupId === g.id);
      return `GRUPPE: ${g.name} (${g.weight}%)
        ${groupParams.map(p => `- ${p.name} (${p.weight}% innerhalb Gruppe, Typ: ${p.type})`).join("\n")}`;
    }).join("\n\n");

    const prompt = `
      Du bist ein erfahrener B2B Risk Manager und Scoring-Experte. 
      Analysiere die folgende Scoring-Konfiguration und gib kritisches, konstruktives Feedback (max 200 Wörter).
      
      KONFIGURATION:
      Gesamtgewichtung der Gruppen: ${totalGroupWeight}%
      
      DETAILLIERTER STRUKTUR:
      ${configurationSummary}

      K.O. KRITERIEN:
      ${koCriteria.length > 0 ? koCriteria.map(k => `- ${k.label} (Wenn ${k.parameterName} ${k.operator} ${k.value})`).join("\n") : "Keine definiert"}

      AUFGABE:
      1. Falls die Gesamtgewichtung der Gruppen nicht 100% ist, weise deutlich darauf hin.
      2. Prüfe die logische Gruppierung. Passen die Parameter zu ihren Gruppennamen?
      3. Bewerte die Mischung aus numerischen und kategorialen (Text) Parametern.
      4. Fehlt etwas Kritisches (z.B. ESG-Kriterien, Branchen-Benchmarks, Management-Erfahrung)?
      5. Sind die Gewichtungen realistisch? (z.B. ist eine Gruppe zu dominant?)
      6. Sei ein "kritischer Sparringspartner" und nutze einen professionellen B2B-Ton.
      
      Antworte auf Deutsch. Nutze Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Kein Feedback verfügbar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Feedback momentan nicht verfügbar. Bitte prüfen Sie Ihre Gewichtungen manuell.";
  }
};
