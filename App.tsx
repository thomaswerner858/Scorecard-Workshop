
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
      setError("Verbindungsfehler zur KI. Bitte prüfen Sie den API_KEY in Ihrer Umgebung.");
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
      setAiFeedback("✨ KI-Modell wurde erfolgreich generiert. Sie können es jetzt unten anpassen.");
      setGenerationPrompt('');
    } catch (err) {
      setError("KI-Generierung fehlgeschlagen. Prüfen Sie Ihren API-Key.");
    } finally {
      setGeneratingConfig(false);
    }
  };

  const exportConfiguration = () => {
    const config = {
      version: "1.2",
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
    <div className="min-h-screen pb-20 bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl overflow-hidden shadow-lg shadow-indigo-200">
                <img 
                  src="/logo.png" 
                  alt="Bilendo"
                  className="w-8 h-8 object-contain brightness-0 invert"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<span class="text-white font-black text-xl">B</span>';
                  }}
                />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Bilendo <span className="text-indigo-600">ScoringStudio</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-500 ${totalGroupWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {totalGroupWeight === 100 ? <CheckCircle2Icon size={14} /> : <AlertTriangleIcon size={14} />}
                Status: {totalGroupWeight}%
             </div>
             <button 
                onClick={exportConfiguration}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-xl active:scale-95 flex items-center gap-2"
             >
               <DownloadIcon size={16} />
               Konfiguration Exportieren
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-r-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-100 p-2 rounded-full"><AlertTriangleIcon size={20} /></div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight">System-Fehler</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* AI Magic Creation */}
        <div className="mb-14">
          <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-100/40">
            <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col md:flex-row gap-5 items-center">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200">
                <Wand2Icon className="text-white" size={28} />
              </div>
              <div className="flex-1 w-full">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Automatisierte Erstellung</p>
                <input 
                  type="text" 
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration()}
                  placeholder="Beschreiben Sie Ihre Zielgruppe (z.B. 'Logistik-KMUs mit Fokus auf Liquiditätsreserven')..."
                  className="w-full bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-3.5 px-5 text-sm font-medium outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleAiGeneration}
                disabled={generatingConfig || !generationPrompt.trim()}
                className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                {generatingConfig ? <Loader2Icon className="animate-spin" size={18} /> : <SparklesIcon size={18} />}
                Modell Erstellen
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-16">
            <ParameterEditor 
              groups={groups} 
              parameters={parameters} 
              onGroupsUpdate={setGroups} 
              onParamsUpdate={setParameters} 
            />
            
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />

            {/* Strategic Analysis Section */}
            <div className="space-y-8">
               <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500 p-3 rounded-2xl">
                        <SparklesIcon className="text-white" size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-xl tracking-tight">Strategisches Sparring</h3>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">KI Risk Manager Analyse</p>
                      </div>
                    </div>
                    <button 
                      onClick={triggerAiFeedback}
                      disabled={loadingAi}
                      className="bg-white text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {loadingAi ? 'Experte prüft...' : 'Modell Validieren'}
                    </button>
                  </div>
                  
                  {aiFeedback ? (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-line animate-in fade-in zoom-in duration-500 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {aiFeedback}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-500 text-sm italic max-w-sm mx-auto">
                        Lassen Sie Ihr Modell von unserem KI-Risk-Manager auf Plausibilität und branchenspezifische Risiken prüfen.
                      </p>
                    </div>
                  )}
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
              </div>

              {/* Matrix Table Overview */}
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <div className="bg-slate-100 p-2 rounded-lg"><FileTextIcon size={20} className="text-slate-600" /></div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Übersicht Scorecard Matrix</h2>
                </div>
                <div className="space-y-8">
                  {groups.map(group => (
                    <div key={group.id} className="group/row">
                      <div className="flex justify-between items-end mb-4 px-2">
                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h4>
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Globale Gewichtung</span>
                           <span className="text-lg font-black text-indigo-600">{group.weight}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parameters.filter(p => p.groupId === group.id).map(p => (
                          <div key={p.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-bold text-slate-700 text-xs">{p.name}</span>
                              <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-md font-black text-slate-400">{p.weight}%</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {p.ranges.map(r => (
                                <div key={r.id} className="text-[10px] bg-white border border-slate-100 px-2 py-1 rounded-lg flex items-center gap-2">
                                  <span className="text-slate-400">{p.type === 'numeric' ? `${r.min}-${r.max}` : r.label}</span>
                                  <span className="font-black text-indigo-600">{r.points}P</span>
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

      {/* Export Toast */}
      {showExportToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-500 z-[100]">
          <div className="bg-green-500 p-2 rounded-full shadow-lg shadow-green-500/20">
            <CheckCircle2Icon className="text-white" size={20} />
          </div>
          <span className="font-black text-xs uppercase tracking-widest">Konfiguration Exportiert</span>
        </div>
      )}
    </div>
  );
};

export default App;
