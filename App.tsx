
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback, generateScoringConfig } from './services/geminiService';
import { 
  SparklesIcon, 
  FileTextIcon, 
  LayoutDashboardIcon, 
  DownloadIcon,
  CheckCircle2Icon,
  Wand2Icon,
  Loader2Icon,
  AlertTriangleIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [groups, setGroups] = useState<ParameterGroup[]>([
    { id: 'g1', name: 'Finanzen & Bonität', weight: 60 },
    { id: 'g2', name: 'Stammdaten', weight: 40 }
  ]);
  const [parameters, setParameters] = useState<ScoringParameter[]>([
    { 
      id: 'p1', groupId: 'g1', name: 'Umsatz (Mio. €)', type: 'numeric', weight: 100,
      ranges: [
        { id: 'r1', min: 0, max: 1, points: 20 }, 
        { id: 'r2', min: 1, max: 10, points: 60 }, 
        { id: 'r3', min: 10, max: 1000, points: 100 }
      ]
    },
    {
      id: 'p2', groupId: 'g2', name: 'Rechtsform', type: 'categorical', weight: 100,
      ranges: [
        { id: 'c1', label: 'Einzelunternehmen', points: 40 }, 
        { id: 'c2', label: 'GmbH', points: 80 }, 
        { id: 'c3', label: 'AG', points: 100 }
      ]
    }
  ]);
  const [koCriteria, setKOCriteria] = useState<KOCriterion[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [showExportToast, setShowExportToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const triggerAiFeedback = async () => {
    setLoadingAi(true);
    setError(null);
    try {
      const feedback = await getSparringFeedback(parameters, koCriteria, groups);
      setAiFeedback(feedback);
    } catch (err) {
      setError("KI-Feedback fehlgeschlagen. Prüfen Sie Ihren API-Key.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAiGeneration = async () => {
    if (!generationPrompt.trim()) return;
    setGeneratingConfig(true);
    setError(null);
    try {
      const config = await generateScoringConfig(generationPrompt);
      setGroups(config.groups);
      setParameters(config.parameters);
      setAiFeedback("✨ KI hat ein neues Modell generiert! Bitte prüfen Sie die Gewichtungen und Parameter.");
      setGenerationPrompt('');
    } catch (err) {
      console.error(err);
      setError("KI-Generierung fehlgeschlagen. Ist ein gültiger API_KEY hinterlegt?");
    } finally {
      setGeneratingConfig(false);
    }
  };

  const exportConfiguration = () => {
    const config = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      groups,
      parameters,
      koCriteria
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilendo-scoring-studio-${new Date().getTime()}.json`;
    a.click();
    
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Bilendo Logo Integration */}
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Bilendo Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Fallback falls logo.png nicht existiert
                    target.src = 'https://ui-avatars.com/api/?name=Bilendo&background=4F46E5&color=fff';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                  Bilendo <span className="text-indigo-600">ScoringStudio</span>
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-500 ${totalGroupWeight === 100 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                <LayoutDashboardIcon size={14} />
                Global: {totalGroupWeight}%
             </div>
             <button 
                onClick={exportConfiguration}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-md active:scale-95"
             >
               <DownloadIcon size={16} />
               Exportieren
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangleIcon size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {/* Magic AI Generator Field */}
        <div className="mb-12">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-indigo-50 p-3 rounded-2xl shrink-0">
                <Wand2Icon className="text-indigo-600" size={28} />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wider text-[10px]">KI-Konfigurator (Magic Create)</h3>
                <input 
                  type="text" 
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration()}
                  placeholder="Beschreibe dein Ziel (z.B. 'Scoring für Logistikunternehmen mit Fokus auf ESG und Liquidität')..."
                  className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-3 px-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleAiGeneration}
                disabled={generatingConfig || !generationPrompt.trim()}
                className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
              >
                {generatingConfig ? <Loader2Icon className="animate-spin" size={18} /> : <SparklesIcon size={18} />}
                Modell erstellen
              </button>
            </div>
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition duration-1000"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-12">
            <ParameterEditor 
              groups={groups} 
              parameters={parameters} 
              onGroupsUpdate={setGroups} 
              onParamsUpdate={setParameters} 
            />
            
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />

            <div className="space-y-6">
               {/* Strategisches Sparring - Jetzt direkt bei der Matrix */}
               <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[2.5rem] p-8 border border-indigo-500 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <SparklesIcon className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">KI-Strategie-Check</h3>
                        <p className="text-indigo-200 text-[10px] font-medium uppercase tracking-wider">Automatisierte Analyse der Matrix</p>
                      </div>
                    </div>
                    <button 
                      onClick={triggerAiFeedback}
                      disabled={loadingAi}
                      className="bg-white text-indigo-900 px-5 py-2 rounded-xl text-sm font-black hover:bg-indigo-50 disabled:opacity-50 transition shadow-lg active:scale-95"
                    >
                      {loadingAi ? 'Experte analysiert...' : 'Modell validieren'}
                    </button>
                  </div>
                  
                  {aiFeedback ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-indigo-50 text-sm leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-700 max-h-[350px] overflow-y-auto custom-scrollbar">
                      {aiFeedback}
                    </div>
                  ) : (
                    <p className="text-indigo-100/70 text-sm italic">
                      Klicken Sie auf "Modell validieren", um Feedback von der Bilendo KI zu Ihrer aktuellen Konfiguration zu erhalten.
                    </p>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition duration-1000"></div>
              </div>

              {/* Matrix Overview */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-8">
                  <FileTextIcon size={24} className="text-slate-400" />
                  Scorecard Matrix Übersicht
                </h2>
                <div className="space-y-6">
                  {groups.map(group => (
                    <div key={group.id} className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                      <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-slate-800">{group.name}</h4>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{group.weight}% Global</span>
                      </div>
                      <div className="space-y-4">
                        {parameters.filter(p => p.groupId === group.id).map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md">{p.weight}% Gruppe</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {p.ranges.map(r => (
                                <div key={r.id} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                  {p.type === 'numeric' ? `${r.min}-${r.max}` : r.label}: <span className="font-bold text-indigo-600">{r.points}P</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <LiveTester groups={groups} parameters={parameters} koCriteria={koCriteria} />
          </div>

        </div>
      </main>

      {/* Success Toast */}
      {showExportToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-10 duration-500 z-[100]">
          <div className="bg-green-500/20 p-1.5 rounded-full">
            <CheckCircle2Icon className="text-green-400" size={20} />
          </div>
          <span className="font-bold text-sm">Konfiguration erfolgreich exportiert!</span>
        </div>
      )}
    </div>
  );
};

export default App;
