
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback, generateScoringConfig } from './services/geminiService';
import { 
  SparklesIcon, 
  FileTextIcon, 
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
      setError("KI-Sparring fehlgeschlagen. Prüfen Sie den API_KEY.");
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
      setAiFeedback("✨ KI-Modell wurde erstellt. Passen Sie es nun individuell an.");
      setGenerationPrompt('');
    } catch (err) {
      setError("KI-Generierung fehlgeschlagen. Prüfen Sie den API_KEY.");
    } finally {
      setGeneratingConfig(false);
    }
  };

  const exportConfiguration = () => {
    const config = { groups, parameters, koCriteria, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scoring-config-${Date.now()}.json`;
    a.click();
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
          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${totalGroupWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {totalGroupWeight === 100 ? <CheckCircle2Icon size={14} /> : <AlertTriangleIcon size={14} />}
                Status: {totalGroupWeight}%
             </div>
             <button onClick={exportConfiguration} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-slate-800 transition flex items-center gap-2">
               <DownloadIcon size={16} /> Export
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-r-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <AlertTriangleIcon size={20} />
            <p className="font-bold text-sm uppercase tracking-tight">{error}</p>
          </div>
        )}

        <div className="mb-14 bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-100/40">
          <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col md:flex-row gap-5 items-center">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg"><Wand2Icon className="text-white" size={28} /></div>
            <div className="flex-1 w-full">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Modell-Generator</p>
              <input 
                type="text" 
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration()}
                placeholder="Zielgruppe beschreiben..."
                className="w-full bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-3 px-5 text-sm outline-none transition-all"
              />
            </div>
            <button onClick={handleAiGeneration} disabled={generatingConfig || !generationPrompt.trim()} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase hover:bg-indigo-700 disabled:opacity-50 transition shadow-xl active:scale-95 flex items-center gap-3">
              {generatingConfig ? <Loader2Icon className="animate-spin" size={18} /> : <SparklesIcon size={18} />} Erstellen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            <ParameterEditor groups={groups} parameters={parameters} onGroupsUpdate={setGroups} onParamsUpdate={setParameters} />
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />
            
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-500 p-3 rounded-2xl"><SparklesIcon className="text-white" size={28} /></div>
                    <h3 className="font-black text-white text-xl tracking-tight uppercase">KI Sparring</h3>
                  </div>
                  <button onClick={triggerAiFeedback} disabled={loadingAi} className="bg-white text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase hover:bg-indigo-50 transition active:scale-95 disabled:opacity-50">
                    {loadingAi ? 'Prüfung...' : 'Validieren'}
                  </button>
                </div>
                {aiFeedback ? (
                  <div className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-line max-h-[500px] overflow-y-auto custom-scrollbar">
                    {aiFeedback}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center text-sm italic py-10">Klicken Sie auf "Validieren", um Experten-Feedback zu erhalten.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 uppercase mb-10 flex items-center gap-3">
                <FileTextIcon size={20} className="text-slate-400" /> Matrix Übersicht
              </h2>
              <div className="space-y-8">
                {groups.map(group => (
                  <div key={group.id}>
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h4>
                      <span className="text-lg font-black text-indigo-600">{group.weight}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parameters.filter(p => p.groupId === group.id).map(p => (
                        <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between mb-3">
                            <span className="font-bold text-slate-700 text-xs">{p.name}</span>
                            <span className="text-[10px] font-black text-slate-400">{p.weight}%</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.ranges.map(r => (
                              <span key={r.id} className="text-[9px] bg-white border px-2 py-1 rounded-md text-slate-500 font-bold">
                                {p.type === 'numeric' ? `${r.min}-${r.max}` : r.label}: <span className="text-indigo-600">{r.points}P</span>
                              </span>
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
          <div className="relative"><LiveTester groups={groups} parameters={parameters} koCriteria={koCriteria} /></div>
        </div>
      </main>

      {showExportToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-12 z-[100]">
          <CheckCircle2Icon className="text-green-400" size={24} />
          <span className="font-black text-xs uppercase tracking-widest">Konfiguration Exportiert</span>
        </div>
      )}
    </div>
  );
};

export default App;
