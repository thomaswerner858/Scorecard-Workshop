
import React from 'react';
import { ScoringParameter, ParameterGroup, ParameterType, ScoreRange } from '../types';
import { PlusIcon, TrashIcon, LayersIcon, TagIcon, HashIcon, Edit2Icon, XIcon } from 'lucide-react';

interface Props {
  groups: ParameterGroup[];
  parameters: ScoringParameter[];
  onGroupsUpdate: (groups: ParameterGroup[]) => void;
  onParamsUpdate: (params: ScoringParameter[]) => void;
}

const ParameterEditor: React.FC<Props> = ({ groups, parameters, onGroupsUpdate, onParamsUpdate }) => {
  
  const addGroup = () => {
    const newGroup: ParameterGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Neue Gruppe',
      weight: groups.length === 0 ? 100 : 0
    };
    onGroupsUpdate([...groups, newGroup]);
  };

  const updateGroup = (id: string, updates: Partial<ParameterGroup>) => {
    onGroupsUpdate(groups.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGroup = (id: string) => {
    onGroupsUpdate(groups.filter(g => g.id !== id));
    onParamsUpdate(parameters.filter(p => p.groupId !== id));
  };

  const addParameter = (groupId: string) => {
    const newParam: ScoringParameter = {
      id: Math.random().toString(36).substr(2, 9),
      groupId,
      name: 'Neuer Parameter',
      type: 'numeric',
      weight: 0,
      ranges: [{ id: '1', min: 0, max: 100, points: 50 }]
    };
    onParamsUpdate([...parameters, newParam]);
  };

  const updateParam = (id: string, updates: Partial<ScoringParameter>) => {
    onParamsUpdate(parameters.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const toggleParamType = (id: string) => {
    const param = parameters.find(p => p.id === id);
    if (!param) return;
    const newType: ParameterType = param.type === 'numeric' ? 'categorical' : 'numeric';
    const newRanges: ScoreRange[] = newType === 'categorical' 
      ? [{ id: 'c1', label: 'Werte auswählen', points: 0 }]
      : [{ id: 'n1', min: 0, max: 100, points: 50 }];
    updateParam(id, { type: newType, ranges: newRanges });
  };

  const removeParam = (id: string) => {
    onParamsUpdate(parameters.filter(p => p.id !== id));
  };

  const addRange = (paramId: string) => {
    const param = parameters.find(p => p.id === paramId);
    if (!param) return;
    const newRange: ScoreRange = param.type === 'numeric' 
      ? { id: Math.random().toString(36).substr(2, 5), min: 0, max: 100, points: 0 }
      : { id: Math.random().toString(36).substr(2, 5), label: 'Neuer Wert', points: 0 };
    updateParam(paramId, { ranges: [...param.ranges, newRange] });
  };

  const updateRange = (paramId: string, rangeId: string, updates: Partial<ScoreRange>) => {
    const param = parameters.find(p => p.id === paramId);
    if (!param) return;
    updateParam(paramId, { 
      ranges: param.ranges.map(r => r.id === rangeId ? { ...r, ...updates } : r) 
    });
  };

  const removeRange = (paramId: string, rangeId: string) => {
    const param = parameters.find(p => p.id === paramId);
    if (!param || param.ranges.length <= 1) return;
    updateParam(paramId, {
      ranges: param.ranges.filter(r => r.id !== rangeId)
    });
  };

  const handleRangeKeyDown = (e: React.KeyboardEvent, paramId: string, rangeId: string) => {
    // Überprüfen, ob das Event von einem Input-Element stammt
    const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
    
    // Löschen nur, wenn kein Input fokussiert ist ODER wir explizit auf der Karte sind
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
      e.preventDefault(); // Verhindert "Zurück"-Navigation des Browsers
      removeRange(paramId, rangeId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#0D2B5B] flex items-center gap-3 uppercase tracking-tight">
          <LayersIcon className="text-[#1D4686]" />
          1. Gruppen & Parameter
        </h2>
        <button 
          onClick={addGroup}
          className="flex items-center gap-2 bg-[#1D4686] text-white px-5 py-2.5 rounded-xl hover:bg-[#0D2B5B] transition shadow-md font-bold text-sm"
        >
          <PlusIcon size={18} /> Gruppe hinzufügen
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
          <div className="bg-[#F8FAFC] p-5 border-b border-slate-200 flex flex-wrap items-center gap-4">
            <div className="flex-1 flex items-center gap-2 group/title">
              <input 
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                className="bg-transparent font-black text-[#0D2B5B] outline-none border-b-2 border-transparent hover:border-slate-300 focus:border-[#1D4686] w-full transition-colors py-1 text-sm uppercase tracking-wider"
                placeholder="Name der Gruppe..."
              />
              <Edit2Icon size={14} className="text-slate-300 group-hover/title:text-[#1D4686] shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gewicht</span>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 shadow-sm">
                <input 
                    type="number"
                    value={group.weight}
                    onChange={(e) => updateGroup(group.id, { weight: Number(e.target.value) })}
                    className="w-12 p-1 text-xs outline-none text-center font-black text-[#1D4686]"
                />
                <span className="text-[10px] text-slate-400 font-bold">%</span>
              </div>
            </div>
            <button onClick={() => removeGroup(group.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
              <TrashIcon size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {parameters.filter(p => p.groupId === group.id).map(param => (
              <div key={param.id} className="bg-[#F1F5F9]/30 p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap items-start gap-4 mb-5">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Parameter Bezeichnung</label>
                    <input 
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParam(param.id, { name: e.target.value })}
                      className="w-full bg-transparent font-bold text-[#0D2B5B] outline-none border-b border-slate-200 focus:border-[#1D4686] transition-colors py-1"
                    />
                  </div>
                  
                  <div className="w-36">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Daten-Typ</label>
                    <button 
                      onClick={() => toggleParamType(param.id)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1D4686] hover:border-[#1D4686]/40 transition shadow-sm"
                    >
                      {param.type === 'numeric' ? <><HashIcon size={14} /> Numerisch</> : <><TagIcon size={14} /> Kategorial</>}
                    </button>
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gewicht (%)</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                      <input 
                        type="number"
                        value={param.weight}
                        onChange={(e) => updateParam(param.id, { weight: Number(e.target.value) })}
                        className="w-full text-xs font-black text-center text-[#1D4686] outline-none"
                      />
                    </div>
                  </div>

                  <button onClick={() => removeParam(param.id)} className="mt-7 text-slate-300 hover:text-red-400 transition-colors">
                    <TrashIcon size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {param.ranges.map(range => (
                    <div 
                      key={range.id} 
                      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-xs group/range relative transition-all focus:ring-2 focus:ring-[#1D4686] focus:border-[#1D4686] outline-none hover:border-[#1D4686]/40 cursor-pointer"
                      tabIndex={0}
                      onKeyDown={(e) => handleRangeKeyDown(e, param.id, range.id)}
                      onClick={(e) => {
                        // Fokus setzen, wenn man auf die Karte klickt (aber nicht in ein Input)
                        if (e.target === e.currentTarget) {
                          (e.currentTarget as HTMLElement).focus();
                        }
                      }}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRange(param.id, range.id);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 text-slate-300 hover:text-red-500 rounded-full p-0.5 shadow-sm transition-colors opacity-0 group-hover/range:opacity-100 z-10"
                        title="Bereich löschen (Entf)"
                      >
                        <XIcon size={12} />
                      </button>
                      {param.type === 'numeric' ? (
                        <div className="flex items-center gap-2 mb-3">
                          <input 
                            type="number" value={range.min ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { min: Number(e.target.value) })}
                            className="w-full p-1.5 border border-slate-100 rounded-lg focus:border-[#1D4686] outline-none text-center bg-slate-50 font-bold" placeholder="Min"
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                            type="number" value={range.max ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { max: Number(e.target.value) })}
                            className="w-full p-1.5 border border-slate-100 rounded-lg focus:border-[#1D4686] outline-none text-center bg-slate-50 font-bold" placeholder="Max"
                          />
                        </div>
                      ) : (
                        <div className="mb-3">
                          <input 
                            type="text" value={range.label ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { label: e.target.value })}
                            className="w-full p-1.5 border border-slate-100 rounded-lg font-bold text-slate-700 focus:border-[#1D4686] outline-none bg-slate-50" placeholder="z.B. Rating A"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score-Punkte:</span>
                        <input 
                          type="number" value={range.points} 
                          onChange={(e) => updateRange(param.id, range.id, { points: Number(e.target.value) })}
                          className="w-14 p-1 rounded-lg text-right font-black text-[#1D4686] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addRange(param.id)}
                    className="border-2 border-dashed border-slate-100 rounded-xl py-4 flex items-center justify-center text-slate-300 hover:border-[#1D4686]/20 hover:text-[#1D4686] transition bg-slate-50/50"
                  >
                    <PlusIcon size={20} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => addParameter(group.id)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-[#1D4686] transition flex items-center justify-center gap-3 group/addp"
            >
              <PlusIcon size={16} className="group-hover/addp:rotate-90 transition-transform" /> 
              Parameter hinzufügen
            </button>
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm animate-in zoom-in-95">
          <LayersIcon className="mx-auto text-slate-200 mb-6" size={56} />
          <h3 className="text-lg font-black text-[#0D2B5B] uppercase tracking-tight">Struktur leer</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-3 text-sm">Definieren Sie Gruppen wie Finanzdaten oder Compliance, um zu starten.</p>
        </div>
      )}
    </div>
  );
};

export default ParameterEditor;
