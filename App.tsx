
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback } from './services/geminiService';
import { SparklesIcon, AlertCircleIcon, FileTextIcon, CalculatorIcon, LayoutDashboardIcon } from 'lucide-react';

const App: React.FC = () => {
  const [groups, setGroups] = useState<ParameterGroup[]>([
    { id: 'g1', name: 'Finanzen & Bonität', weight: 60 },
    { id: 'g2', name: 'Stammdaten', weight: 40 }
  ]);
  const [parameters, setParameters] = useState<ScoringParameter[]>([
    { 
      id: 'p1', groupId: 'g1', name: 'Umsatz (Mio. €)', type: 'numeric', weight: 100,
      ranges: [{ id: 'r1', min: 0, max: 1, points: 20 }, { id: 'r2', min: 1, max: 10, points: 60 }, { id: 'r3', min: 10, max: 1000, points: 100 }]
    },
    {
      id: 'p2', groupId: 'g2', name: 'Rechtsform', type: 'categorical', weight: 100,
      ranges: [{ id: 'c1', label: 'Einzelunternehmen', points: 40 }, { id: 'c2', label: 'GmbH', points: 80 }, { id: 'c3', label: 'AG', points: 100 }]
    }
  ]);
  const [koCriteria, setKOCriteria] = useState<KOCriterion[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const triggerAiFeedback = async () => {
    setLoadingAi(true);
    const feedback = await getSparringFeedback(parameters, koCriteria, groups);
    setAiFeedback(feedback);
    setLoadingAi(false);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <CalculatorIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ScoringStudio <span className="text-indigo-600">B2B</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expert Configuration Mode</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-500 ${totalGroupWeight === 100 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                <LayoutDashboardIcon size={14} />
                Global: {totalGroupWeight}%
             </div>
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
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-indigo-50 text-sm leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-700 max-h-[400px] overflow-y-auto">
                    {aiFeedback}
                  </div>
                ) : (
                  <p className="text-indigo-100/70 text-sm italic">
                    Lassen Sie Ihre Scoring-Modell von unserer KI auf Branchenstandards und Vollständigkeit prüfen.
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

            {/* Summary List View */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-8">
                <FileTextIcon size={24} className="text-slate-400" />
                Scorecard Matrix Übersicht
              </h2>
              <div className="space-y-6">
                {groups.map(group => (
                  <div key={group.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700">{group.name}</h4>
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{group.weight}% Global</span>
                    </div>
                    <div className="space-y-2">
                      {parameters.filter(p => p.groupId === group.id).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span className="font-medium text-slate-600">{p.name}</span>
                            <span className="text-[10px] text-slate-400">({p.type === 'numeric' ? 'Zahl' : 'Text'})</span>
                          </div>
                          <span className="font-mono text-slate-400">{p.weight}% Gruppe</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalGroupWeight !== 100 && (
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
                  <AlertCircleIcon className="mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="font-bold">Achtung: Gewichtungsfehler</p>
                    <p className="opacity-80">Die Summe der Gruppen-Gewichte beträgt aktuell {totalGroupWeight}%. Für ein valides 0-100 Scoring ist eine Summe von 100% erforderlich.</p>
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
    </div>
  );
};

export default App;
