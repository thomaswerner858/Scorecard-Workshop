
import React, { useState, useEffect, useRef } from 'react';
import { ScoringParameter, KOCriterion, ParameterGroup, RiskClass, LogicRule } from './types';
import ParameterEditor from './components/ParameterEditor';
import KOCriteriaEditor from './components/KOCriteriaEditor';
import RiskClassEditor from './components/RiskClassEditor';
import LogicRuleEditor from './components/LogicRuleEditor';
import LiveTester from './components/LiveTester';
import { getSparringFeedback } from './services/geminiService';
import { BILENDO_LOGO } from './Assets';
import { 
  SparklesIcon, 
  CheckCircle2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  FileJsonIcon,
  SettingsIcon,
  PhoneIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';

declare global {
  interface Window {
    bilendoRuntimeConfig: {
      phoneNumber: string;
    };
  }
}

const App: React.FC = () => {
  const [groups, setGroups] = useState<ParameterGroup[]>([]);
  const [parameters, setParameters] = useState<ScoringParameter[]>([]);
  const [koCriteria, setKOCriteria] = useState<KOCriterion[]>([]);
  const [riskClasses, setRiskClasses] = useState<RiskClass[]>([]);
  const [logicRules, setLogicRules] = useState<LogicRule[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhoneInputOpen, setIsPhoneInputOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.bilendoRuntimeConfig) {
      window.bilendoRuntimeConfig = { phoneNumber: '' };
    }
  }, []);

  useEffect(() => {
    if (window.bilendoRuntimeConfig) {
      window.bilendoRuntimeConfig.phoneNumber = phoneNumber;
    }
  }, [phoneNumber]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
        setIsPhoneInputOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalGroupWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const triggerAiFeedback = async () => {
    if (groups.length === 0) return;
    setLoadingAi(true);
    setShowAiModal(true);
    try {
      const feedback = await getSparringFeedback(parameters, koCriteria, groups);
      setAiFeedback(feedback);
    } catch (err: any) {
      setError("AI Analyse fehlgeschlagen.");
    } finally {
      setLoadingAi(false);
    }
  };

  const exportToJson = () => {
    const config = { groups, parameters, koCriteria, riskClasses, logicRules, phoneNumber, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilendo-scoring-config.json`;
    a.click();
    setToastMessage('Konfiguration exportiert');
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC] font-sans text-[#0D2B5B]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={BILENDO_LOGO} alt="Bilendo Logo" className="h-14 w-auto object-contain" />
            <div className="h-10 w-px bg-slate-200 mx-2 hidden lg:block" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-[#1D4686] whitespace-nowrap">Scoring Studio</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${totalGroupWeight === 100 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                Soll: 100% | Ist: {totalGroupWeight}%
             </div>

             <button 
               onClick={triggerAiFeedback} 
               disabled={loadingAi} 
               title="KI-Sparring starten"
               className="flex items-center justify-center bg-[#E8F0F9] text-[#1D4686] w-10 h-10 rounded-xl hover:bg-[#1D4686] hover:text-white transition shadow-sm border border-[#1D4686]/10"
             >
               {loadingAi ? <Loader2Icon size={18} className="animate-spin" /> : <SparklesIcon size={18} />}
             </button>
             
             <div className="flex gap-2">
               <button onClick={exportToJson} className="bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition border border-slate-200 flex items-center gap-2">
                 <FileJsonIcon size={16} /> <span className="hidden sm:inline">Export</span>
               </button>

               <div className="relative" ref={settingsRef}>
                 <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-xl transition border ${isSettingsOpen ? 'bg-[#E8F0F9] border-[#1D4686]' : 'bg-white border-slate-200'}`}>
                   <SettingsIcon size={20} />
                 </button>
                 {isSettingsOpen && (
                   <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                     <div className="px-4 py-2 border-b border-slate-50"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settings</span></div>
                     {!isPhoneInputOpen ? (
                       <button onClick={() => setIsPhoneInputOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8FAFC]">
                         <PhoneIcon size={16} className="text-slate-400" />
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">API String / Telefon</span>
                           <span className="text-[10px] text-slate-400 truncate">{phoneNumber || 'Kein Wert'}</span>
                         </div>
                       </button>
                     ) : (
                       <div className="p-3">
                         <div className="flex items-center gap-2 bg-slate-50 border rounded-lg p-1">
                           <input autoFocus value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="flex-1 bg-transparent text-xs p-2 outline-none" />
                           <button onClick={() => setIsPhoneInputOpen(false)} className="bg-[#1D4686] text-white p-1 rounded"><CheckIcon size={14} /></button>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            <ParameterEditor groups={groups} parameters={parameters} onGroupsUpdate={setGroups} onParamsUpdate={setParameters} />
            <KOCriteriaEditor criteria={koCriteria} onUpdate={setKOCriteria} />
            <LogicRuleEditor rules={logicRules} parameters={parameters} onUpdate={setLogicRules} />
            <RiskClassEditor riskClasses={riskClasses} onUpdate={setRiskClasses} />
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h2 className="text-xl font-black text-[#0D2B5B] uppercase flex items-center gap-3">
                <ShieldCheckIcon size={24} className="text-[#1D4686]" /> 5. Zusammenfassung & Review
              </h2>
              {groups.length > 0 ? groups.map(group => (
                <div key={group.id}>
                  <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h4>
                    <span className="text-lg font-black text-[#1D4686]">{group.weight}%</span>
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
                            <span key={r.id} className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 font-bold">
                              {p.type === 'numeric' ? `${r.min ?? '−∞'} bis ${r.max ?? '∞'}` : r.label}: <span className="text-[#1D4686]">{r.points}P</span>
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
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="sticky top-24">
              <LiveTester 
                groups={groups} 
                parameters={parameters} 
                koCriteria={koCriteria} 
                riskClasses={riskClasses} 
                logicRules={logicRules}
              />
            </div>
          </div>
        </div>
      </main>

      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#0D2B5B] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SparklesIcon size={20} className="text-amber-400" />
                <h3 className="font-black uppercase tracking-tight text-sm">KI Experten-Sparring</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="hover:bg-white/10 p-1 rounded-full transition">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {loadingAi ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2Icon size={48} className="text-[#1D4686] animate-spin" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Analysiere Konfiguration...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {aiFeedback || "Kein Feedback verfügbar."}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowAiModal(false)} className="bg-[#1D4686] text-white px-8 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0D2B5B] transition">
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
