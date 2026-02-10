
# 🚀 ScoringStudio B2B - Onboarding Configurator

Ein interaktiver B2B-Scoring-Konfigurator, der Unternehmen dabei unterstützt, komplexe Risiko- und Bonitätslogiken visuell zu definieren, per KI zu validieren und als JSON zu exportieren.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%20Flash-orange.svg)

## ✨ Features

- **Hierarchisches Scoring**: Gruppierung von Parametern (z.B. Finanzen, Stammdaten) mit globaler Gewichtung.
- **Duales Parameter-System**: Unterstützung für numerische Werte (Ranges) und kategoriale Texte (Drop-Downs).
- **Dynamic Weight Redistribution**: Intelligente Logik, die den Score automatisch auf 100% skaliert, auch wenn Datenfelder im Test leer bleiben.
- **K.O. Kriterien**: Definition von harten Ausschlusskriterien (Hard-Rejects).
- **KI-Sparringspartner**: Integrierte Gemini-KI, die das Scoring-Modell auf logische Konsistenz und Branchenstandards prüft.
- **JSON Export**: Export der Konfiguration für die direkte Integration in Backend-Systeme.

## 🛠 Setup & Installation

Dieses Projekt basiert auf modernem React und Tailwind CSS. Es nutzt ESM-Imports direkt über esm.sh.

### Lokal ausführen
Da es sich um eine statische ESM-App handelt, reicht ein einfacher lokaler Webserver:

1. Repository klonen: `git clone https://github.com/DEIN-USER/scoring-studio-b2b.git`
2. In das Verzeichnis wechseln.
3. Einen Server starten (z.B. mit VS Code Live Server oder `npx serve .`).

### API Key Konfiguration
Die App benötigt einen Google Gemini API Key in der Umgebungsvariable `API_KEY`.

- **Lokal**: Stelle sicher, dass dein Entwicklungsserver die Variable `process.env.API_KEY` bereitstellt.
- **GitHub Actions / Deployment**: 
  1. Gehe in deinem GitHub Repo zu `Settings` > `Secrets and variables` > `Actions`.
  2. Erstelle ein neues Secret mit dem Namen `API_KEY` und füge deinen Schlüssel ein.

## 📂 Dateistruktur

- `App.tsx`: Hauptanwendung & State-Management.
- `components/ParameterEditor.tsx`: Visueller Editor für Gruppen und Parameter.
- `components/LiveTester.tsx`: Echtzeit-Validierungstool für die Scoring-Logik.
- `services/geminiService.ts`: Integration der Google GenAI SDK.
- `types.ts`: TypeScript Definitionen der Scoring-Engine.

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
