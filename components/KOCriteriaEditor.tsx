
import React from 'react';
import { KOCriterion } from '../types';
import { ShieldAlertIcon, PlusIcon, TrashIcon } from 'lucide-react';

interface Props {
  criteria: KOCriterion[];
  onUpdate: (criteria: KOCriterion[]) => void;
}

const KOCriteriaEditor: React.FC<Props> = ({ criteria, onUpdate }) => {
  const addKO = () => {
    const newKO: KOCriterion = {
      id: Math.random().toString(36).substr(2, 9),
      parameterName: 'Insolvenz',
      operator: 'equals',
      value: 'Ja',
      label: 'Kunde ist in Insolvenz'
    };
    onUpdate([...criteria, newKO]);
  };

  const removeKO = (id: string) => {
    onUpdate(criteria.filter(c => c.id !== id));
  };

  const updateKO = (id: string, updates: Partial<KOCriterion>) => {
    onUpdate(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#0D2B5B] flex items-center gap-3 uppercase tracking-tight">
          <ShieldAlertIcon className="text-red-500" size={24} /> 
          2. K.O. Kriterien
        </h2>
        <button 
          onClick={addKO}
          className="flex items-center gap-2 text-xs bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition font-black uppercase tracking-widest shadow-sm"
        >
          <PlusIcon size={16} /> Hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {criteria.map((ko) => (
          <div key={ko.id} className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-4">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bezeichnung des Ausschlussgrundes</label>
                <input 
                    type="text"
                    value={ko.label}
                    onChange={(e) => updateKO(ko.id, { label: e.target.value })}
                    className="w-full text-sm font-bold text-[#0D2B5B] bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#1D4686] outline-none py-1"
                    placeholder="z.B. Negativmerkmale..."
                />
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-black">Bedingung:</span>
              <input 
                type="text"
                value={ko.parameterName}
                onChange={(e) => updateKO(ko.id, { parameterName: e.target.value })}
                className="w-28 p-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1D4686]"
                placeholder="Feldname"
              />
              <select 
                value={ko.operator}
                onChange={(e) => updateKO(ko.id, { operator: e.target.value as any })}
                className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-[#1D4686] font-black"
              >
                <option value="equals">=</option>
                <option value="greater">&gt;</option>
                <option value="less">&lt;</option>
              </select>
              <input 
                type="text"
                value={ko.value}
                onChange={(e) => updateKO(ko.id, { value: e.target.value })}
                className="w-24 p-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1D4686]"
                placeholder="Wert"
              />
            </div>
            <button 
              onClick={() => removeKO(ko.id)}
              className="p-2 text-slate-300 hover:text-red-500 transition ml-auto"
            >
              <TrashIcon size={20} />
            </button>
          </div>
        ))}

        {criteria.length === 0 && (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs italic">
            Aktuell keine harten Ausschlusskriterien definiert.
          </div>
        )}
      </div>
    </div>
  );
};

export default KOCriteriaEditor;
