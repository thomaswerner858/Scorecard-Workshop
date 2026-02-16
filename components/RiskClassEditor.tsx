
import React from 'react';
import { RiskClass } from '../types';
import { ShieldIcon, PlusIcon, TrashIcon } from 'lucide-react';

interface Props {
  riskClasses: RiskClass[];
  onUpdate: (classes: RiskClass[]) => void;
}

const RiskClassEditor: React.FC<Props> = ({ riskClasses, onUpdate }) => {
  const addClass = () => {
    const newClass: RiskClass = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Neue Klasse',
      minScore: 0,
      maxScore: 100,
      color: '#4A90E2'
    };
    onUpdate([...riskClasses, newClass]);
  };

  const updateClass = (id: string, updates: Partial<RiskClass>) => {
    onUpdate(riskClasses.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeClass = (id: string) => {
    onUpdate(riskClasses.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#0D2B5B] flex items-center gap-3 uppercase tracking-tight">
          <ShieldIcon className="text-[#1D4686]" size={24} /> 
          4. Risikoklassen Mapping
        </h2>
        <button 
          onClick={addClass}
          className="flex items-center gap-2 text-xs bg-[#E8F0F9] text-[#1D4686] px-4 py-2 rounded-xl border border-[#1D4686]/20 hover:bg-[#1D4686] hover:text-white transition font-black uppercase tracking-widest shadow-sm"
        >
          <PlusIcon size={16} /> Klasse hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {riskClasses.sort((a, b) => a.minScore - b.minScore).map((rc) => (
          <div key={rc.id} className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-4">
            <div className="w-8 h-8 rounded-full shadow-inner border border-slate-100" style={{ backgroundColor: rc.color }}></div>
            
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bezeichnung</label>
                <input 
                    type="text"
                    value={rc.name}
                    onChange={(e) => updateClass(rc.id, { name: e.target.value })}
                    className="w-full text-sm font-bold text-[#0D2B5B] bg-transparent outline-none py-1 border-b border-transparent focus:border-[#1D4686]"
                    placeholder="z.B. A-Rating"
                />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase">Min Score</label>
                <input 
                  type="number"
                  value={rc.minScore}
                  onChange={(e) => updateClass(rc.id, { minScore: Number(e.target.value) })}
                  className="w-16 bg-transparent text-xs font-black text-[#1D4686] outline-none"
                />
              </div>
              <span className="text-slate-300 mx-1">-</span>
              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase">Max Score</label>
                <input 
                  type="number"
                  value={rc.maxScore}
                  onChange={(e) => updateClass(rc.id, { maxScore: Number(e.target.value) })}
                  className="w-16 bg-transparent text-xs font-black text-[#1D4686] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
               <label className="text-[8px] font-black text-slate-400 uppercase">Farbe</label>
               <input 
                type="color" 
                value={rc.color}
                onChange={(e) => updateClass(rc.id, { color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
               />
            </div>

            <button onClick={() => removeClass(rc.id)} className="p-2 text-slate-300 hover:text-red-500 transition">
              <TrashIcon size={18} />
            </button>
          </div>
        ))}

        {riskClasses.length === 0 && (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs italic">
            Noch keine Risikoklassen definiert.
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskClassEditor;
