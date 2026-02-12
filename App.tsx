// App.tsx
import React, { useState, useEffect } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback } from './services/geminiService';
import { 
  SparklesIcon, 
  CheckCircle2Icon,
  Loader2Icon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  FileJsonIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [groups, setGroups] = useState<ParameterGroup[]>([]);
  const [parameters, setParameters] = useState<ScoringParameter[]>([]);
  const [koCriteria, setKOCriteria] = useState<KOCriterion[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // API Key States
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Key beim ersten Laden aus LocalStorage holen
  useEffect(() => {
    const savedKey = localStorage.getItem('bilendo_gemini_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Key speichern
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('bilendo_gemini_key', val);
  };

  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const triggerAiFeedback = async () => {
    if (!apiKey) {
      setError("Bitte geben Sie einen API-Key ein, um die KI-Analyse zu nutzen.");
      return;
    }
    if (groups.length === 0) {
      setError("Bitte definieren Sie mindestens eine Gruppe, bevor Sie die KI-Analyse starten.");
      return;
    }
    
    setLoadingAi(true);
    setError(null);
    try {
      const feedback = await getSparringFeedback(apiKey, parameters, koCriteria, groups);
      setAiFeedback(feedback);
    } catch (err: any) {
      setError("Sparring-Analyse fehlgeschlagen.");
    } finally {
      setLoadingAi(false);
    }
  };

  const exportToJson = () => {
    const config = { groups, parameters, koCriteria, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilendo-scoring-config.json`;
    a.click();
    setToastMessage('Konfiguration als JSON exportiert');
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">B</div>
            <h1 className="text-xl font-black tracking-tight uppercase">Bilendo <span className="text-indigo-600">ScoringStudio</span></h1>
          </div>
          <div className="flex gap-2">
               <button 
                 onClick={exportToJson} 
                 className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-slate-800 transition flex items-center gap-2 shadow-lg"
               >
                 <FileJsonIcon size={16} /> <span className="hidden sm:inline">JSON Export</span>
               </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        
        {/* API Key Eingabe-Sektion */}
        <div className="mb-8 bg-indigo-900 text-white rounded-[2rem] p-6 shadow-xl flex flex-col md:flex-row items-center gap-6 border border-indigo-700">
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-indigo-500/30 p-3 rounded-2xl text-indigo-200">
              <KeyIcon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Gemini API Key</h3>
              <p className="text-indigo-300 text-[10px]">Wird lokal gespeichert</p>
            </div>
          </div>
          
          <div className="relative flex-1 w-full">
            <input 
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={handleKeyChange}
              placeholder="Geben Sie Ihren API Key hier ein (AIza...)"
              className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-indigo-100 placeholder:text-indigo-400/50 outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
            <button 
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition"
            >
              {showApiKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${totalGroupWeight === 100 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {totalGroupWeight === 100 ? <CheckCircle2Icon size={14} /> : <AlertTriangleIcon size={14} />}
            Gewichtung: {totalGroupWeight}%
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-r-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <AlertTriangleIcon size={20} className="shrink-0" />
            <p className="font-bold text-sm uppercase tracking-tight">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            <ParameterEditor groups={groups} parameters={parameters} onGroupsUpdate={setGroups} onParamsUpdate={setParameters} />
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />
            
            <div className="space-y-8">
              <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                <ShieldCheckIcon size={24} className="text-indigo-600" /> Zusammenfassung & Review
              </h2>
              
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                {groups.length > 0 ? groups.map(group => (
                  <div key={group.id}>
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h4>
                      <span className="text-lg font-black text-indigo-600">{group.weight}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parameters.filter(p => p.groupId === group.id).length > 0 ? parameters.filter(p => p.groupId === group.id).map(p => (
                        <div key={p.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between mb-4">
                            <span className="font-bold text-slate-700 text-xs">{p.name}</span>
                            <span className="text-[10px] font-black text-slate-400">{p.weight}%</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.ranges.map(r => (
                              <span key={r.id} className="text-[9px] bg-white border px-2 py-1 rounded-md text-slate-500 font-bold">
                                {p.type === 'numeric' ? `${r.min ?? '?'}-${r.max ?? '?'}` : r.label}: <span className="text-indigo-600">{r.points}P</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <p className="text-slate-400 text-[10px] italic col-span-2">Keine Parameter in dieser Gruppe.</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400 italic mb-2">Noch keine Scoring-Struktur vorhanden.</p>
                    <p className="text-[10px] text-slate-300 uppercase font-black">Legen Sie oben Gruppen und Parameter an.</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500 p-3 rounded-2xl"><SparklesIcon className="text-white" size={28} /></div>
                      <div>
                        <h3 className="font-black text-white text-xl tracking-tight uppercase">KI Experten-Sparring</h3>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Risk Management Analyse</p>
                      </div>
                    </div>
                    <button 
                      onClick={triggerAiFeedback} 
                      disabled={loadingAi || groups.length === 0 || !apiKey} 
                      className="bg-white text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase hover:bg-indigo-50 transition active:scale-95 disabled:opacity-30 flex items-center gap-2"
                    >
                      {loadingAi && <Loader2Icon size={16} className="animate-spin" />}
                      {!apiKey ? 'Key erforderlich' : (loadingAi ? 'Analyse...' : 'Modell validieren')}
                    </button>
                  </div>
                  {aiFeedback ? (
                    <div className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-line max-h-[500px] overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
                      {aiFeedback}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic text-center py-10">
                      {!apiKey ? 'Bitte geben Sie oben Ihren API-Key ein, um die Analyse zu starten.' : 'Klicken Sie auf "Modell validieren", um fachliches Feedback zu erhalten.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="sticky top-24">
              <LiveTester groups={groups} parameters={parameters} koCriteria={koCriteria} />
            </div>
          </div>
        </div>
      </main>

      {showExportToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-12 z-[100] border border-white/10">
          <CheckCircle2Icon className="text-green-400" size={24} />
          <span className="font-black text-xs uppercase tracking-widest">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;