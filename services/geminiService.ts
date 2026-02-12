// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScoringParameter, KOCriterion, ParameterGroup } from "../types";

export const getSparringFeedback = async (
  apiKey: string,
  parameters: ScoringParameter[],
  koCriteria: KOCriterion[],
  groups: ParameterGroup[] = []
): Promise<string> => {
  
  if (!apiKey || apiKey.trim() === "") {
    return "Fehler: Kein API-Key hinterlegt. Bitte geben Sie oben einen gültigen Gemini API-Key ein.";
  }

  // Initialisierung mit dem vom User bereitgestellten Key
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Wir nutzen gemini-1.5-flash für schnelles, kosteneffizientes Feedback
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const configurationSummary = groups.map(g => {
    const groupParams = parameters.filter(p => p.groupId === g.id);
    return `GRUPPE: ${g.name} (${g.weight}%)
      ${groupParams.map(p => `- ${p.name} (${p.weight}%, Typ: ${p.type})`).join("\n")}`;
  }).join("\n\n");

  const prompt = `
    Du bist ein Senior B2B Risk Manager. 
    Analysiere dieses Scoring-Modell fachlich:
    
    KONFIGURATION:
    ${configurationSummary}
    
    K.O. KRITERIEN: 
    ${koCriteria.length > 0 ? koCriteria.map(k => k.label).join(", ") : "Keine definiert"}
    
    AUFGABE:
    Bewerte die Logik, die Gewichtung und identifiziere potenzielle Lücken im Risikomanagement.
    Antworte auf Deutsch (max. 150 Wörter). Gib konstruktives Feedback als sauberes Markdown zurück.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text || "Die KI hat keine Antwort generiert.";
  } catch (error: any) {
    console.error("Sparring Error:", error);
    // Spezifische Fehlermeldung für ungültige Keys
    if (error.message?.includes("API_KEY_INVALID")) {
      return "Fehler: Der eingegebene API-Key ist ungültig. Bitte prüfen Sie Ihre Eingabe.";
    }
    return `Fehler bei der KI-Analyse: ${error.message || "Unbekannter Fehler"}`;
  }
};