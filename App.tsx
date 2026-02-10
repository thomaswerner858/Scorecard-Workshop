
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback } from './services/geminiService';
import { 
  SparklesIcon, 
  AlertCircleIcon, 
  FileTextIcon, 
  CalculatorIcon, 
  LayoutDashboardIcon, 
  DownloadIcon,
  CheckCircle2Icon
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
  const [showExportToast, setShowExportToast] = useState(false);

  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const triggerAiFeedback = async () => {
    setLoadingAi(true);
    const feedback = await getSparringFeedback(parameters, koCriteria, groups);
    setAiFeedback(feedback);
    setLoadingAi(false);
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
    a.download = `b2b-scoring-config-${new Date().getTime()}.json`;
    a.click();
    
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <CalculatorIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ScoringStudio <span className="text-indigo-600">B2B</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Onboarding Configurator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-500 ${totalGroupWeight === 100 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                <LayoutDashboardIcon size={14} />
                Global: {totalGroupWeight}%
             </div>
             <button 
                onClick={exportConfiguration}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-md active:scale-95"
             >
               <DownloadIcon size={16} />
               Exportieren
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-12">
            {/* AI Advisor Panel */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 border border-indigo-500 shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <SparklesIcon className="text-white" size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg">Strategisches Sparring</h3>
                  </div>
                  <button 
                    onClick={triggerAiFeedback}
                    disabled={loadingAi}
                    className="bg-white text-indigo-900 px-5 py-2 rounded-xl text-sm font-black hover:bg-indigo-50 disabled:opacity-50 transition shadow-lg active:scale-95"
                  >
                    {loadingAi ? 'Experte denkt nach...' : 'Logik validieren'}
                  </button>
                </div>
                
                {aiFeedback ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-indigo-50 text-sm leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-700 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {aiFeedback}
                  </div>
                ) : (
                  <p className="text-indigo-100/70 text-sm italic">
                    Lassen Sie Ihr Scoring-Modell von unserer KI auf Branchenstandards und Vollständigkeit prüfen.
                  </p>
                )}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition duration-1000"></div>
            </div>

            <ParameterEditor 
              groups={groups} 
              parameters={parameters} 
              onGroupsUpdate={setGroups} 
              onParamsUpdate={setParameters} 
            />
            
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />

            {/* Matrix Overview */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-8">
                <FileTextIcon size={24} className="text-slate-400" />
                Scorecard Matrix Übersicht
              </h2>
              <div className="space-y-6">
                {groups.map(group => (
                  <div key={group.id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
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
              
              {totalGroupWeight !== 100 && (
                <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 text-amber-800 text-sm">
                  <AlertCircleIcon className="mt-0.5 shrink-0 text-amber-600" size={20} />
                  <div>
                    <p className="font-bold">Achtung: Gewichtungsfehler</p>
                    <p className="opacity-80">Die Summe der Gruppen-Gewichte beträgt aktuell {totalGroupWeight}%. Für ein valides 0-100 Scoring muss die Summe genau 100% ergeben.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <LiveTester groups={groups} parameters={parameters} koCriteria={koCriteria} />
          </div>

        </div>
      </main>

      {/* Success Toast */}
      {showExportToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-10 duration-500 z-[100]">
          <CheckCircle2Icon className="text-green-400" size={20} />
          <span className="font-bold text-sm">Konfiguration erfolgreich exportiert!</span>
        </div>
      )}
    </div>
  );
};

export default App;
