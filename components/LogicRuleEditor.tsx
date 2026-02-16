
import React from 'react';
import { LogicRule, ScoringParameter } from '../types';
import { ZapIcon, PlusIcon, TrashIcon, ArrowRightIcon } from 'lucide-react';

interface Props {
  rules: LogicRule[];
  parameters: ScoringParameter[];
  onUpdate: (rules: LogicRule[]) => void;
}

const LogicRuleEditor: React.FC<Props> = ({ rules, parameters, onUpdate }) => {
  const addRule = () => {
    const newRule: LogicRule = {
      id: Math.random().toString(36).substr(2, 9),
      parameterId: parameters[0]?.id || '',
      operator: 'equals',
      conditionValue: '',
      action: 'add',
      actionValue: 10,
      label: 'Neuer Boost/Abzug'
    };
    onUpdate([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<LogicRule>) => {
    onUpdate(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    onUpdate(rules.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#0D2B5B] flex items-center gap-3 uppercase tracking-tight">
          <ZapIcon className="text-amber-500" size={24} /> 
          3. Logik-Boosts & Anpassungen
        </h2>
        <button 
          onClick={addRule}
          className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 hover:bg-amber-100 transition font-black uppercase tracking-widest shadow-sm"
        >
          <PlusIcon size={16} /> Regel hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Regel-Name</label>
                <input 
                  type="text"
                  value={rule.label}
                  onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                  className="w-full text-sm font-bold text-[#0D2B5B] bg-transparent outline-none focus:border-b focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">WENN</span>
                <select 
                  value={rule.parameterId}
                  onChange={(e) => updateRule(rule.id, { parameterId: e.target.value })}
                  className="text-xs font-black text-[#1D4686] bg-transparent outline-none max-w-[120px]"
                >
                  <option value="">Parameter</option>
                  {parameters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                
                <select 
                  value={rule.operator}
                  onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                  className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded p-1 outline-none"
                >
                  <option value="equals">=</option>
                  <option value="greater">&gt;</option>
                  <option value="less">&lt;</option>
                </select>

                <input 
                  type="text"
                  value={rule.conditionValue}
                  onChange={(e) => updateRule(rule.id, { conditionValue: e.target.value })}
                  className="w-20 bg-white border border-slate-200 rounded p-1 text-xs outline-none font-bold"
                  placeholder="Wert"
                />
                
                <ArrowRightIcon size={16} className="text-slate-300" />
                
                <span className="text-[10px] font-black text-slate-400 uppercase">DANN</span>
                <select 
                   value={rule.action}
                   onChange={(e) => updateRule(rule.id, { action: e.target.value as any })}
                   className="text-xs font-black text-[#1D4686] bg-transparent outline-none"
                >
                  <option value="add">+ Pkt</option>
                  <option value="subtract">- Pkt</option>
                  <option value="multiply">×</option>
                </select>
                <input 
                  type="number"
                  value={rule.actionValue}
                  onChange={(e) => updateRule(rule.id, { actionValue: Number(e.target.value) })}
                  className="w-16 bg-white border border-slate-200 rounded p-1 text-xs outline-none font-black text-[#1D4686]"
                />
              </div>

              <button onClick={() => removeRule(rule.id)} className="p-2 text-slate-300 hover:text-red-500 transition ml-auto">
                <TrashIcon size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogicRuleEditor;
