
import React from 'react';
import { ScoringParameter, ParameterGroup, ParameterType, ScoreRange } from '../types';
import { PlusIcon, TrashIcon, LayersIcon, TagIcon, HashIcon, Edit2Icon } from 'lucide-react';

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
      ? [{ id: 'c1', label: 'High Risk', points: 0 }]
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <LayersIcon className="text-indigo-500" />
          1. Gruppen & Parameter
        </h2>
        <button 
          onClick={addGroup}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <PlusIcon size={18} /> Gruppe hinzufügen
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Group Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <div className="flex-1 flex items-center gap-2 group/title">
              <input 
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                className="bg-transparent font-bold text-gray-800 outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-500 w-full transition-colors py-1"
                placeholder="Name der Gruppe..."
              />
              <Edit2Icon size={14} className="text-gray-300 group-hover/title:text-gray-400 shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Gewicht:</span>
              <input 
                type="number"
                value={group.weight}
                onChange={(e) => updateGroup(group.id, { weight: Number(e.target.value) })}
                className="w-16 p-1 text-sm border border-gray-300 rounded text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <button onClick={() => removeGroup(group.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
              <TrashIcon size={18} />
            </button>
          </div>

          {/* Parameters in Group */}
          <div className="p-6 space-y-6">
            {parameters.filter(p => p.groupId === group.id).map(param => (
              <div key={param.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex flex-wrap items-start gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parameter Name</label>
                    <input 
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParam(param.id, { name: e.target.value })}
                      className="w-full bg-transparent font-semibold text-gray-700 outline-none border-b border-gray-200 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Typ</label>
                    <button 
                      onClick={() => toggleParamType(param.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                      {param.type === 'numeric' ? <><HashIcon size={14} /> Zahl</> : <><TagIcon size={14} /> Text</>}
                    </button>
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gewicht (%)</label>
                    <input 
                      type="number"
                      value={param.weight}
                      onChange={(e) => updateParam(param.id, { weight: Number(e.target.value) })}
                      className="w-full p-1.5 text-sm border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <button onClick={() => removeParam(param.id)} className="mt-6 text-gray-300 hover:text-red-400 transition-colors">
                    <TrashIcon size={16} />
                  </button>
                </div>

                {/* Values / Ranges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {param.ranges.map(range => (
                    <div key={range.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-xs group/range relative">
                      {param.type === 'numeric' ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="number" value={range.min ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { min: Number(e.target.value) })}
                            className="w-full p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Von"
                          />
                          <span>-</span>
                          <input 
                            type="number" value={range.max ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { max: Number(e.target.value) })}
                            className="w-full p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Bis"
                          />
                        </div>
                      ) : (
                        <div className="mb-2">
                          <input 
                            type="text" value={range.label ?? ''} 
                            onChange={(e) => updateRange(param.id, range.id, { label: e.target.value })}
                            className="w-full p-1 border rounded font-medium focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="z.B. High Risk"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Score:</span>
                        <input 
                          type="number" value={range.points} 
                          onChange={(e) => updateRange(param.id, range.id, { points: Number(e.target.value) })}
                          className="w-12 p-1 border rounded text-right font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addRange(param.id)}
                    className="border-2 border-dashed border-gray-200 rounded-lg py-4 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition"
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => addParameter(group.id)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 transition flex items-center justify-center gap-2 group/addp"
            >
              <PlusIcon size={16} className="group-hover/addp:scale-110 transition-transform" /> 
              Parameter in <span className="font-bold text-gray-500">"{group.name}"</span> hinzufügen
            </button>
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
          <LayersIcon className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">Keine Gruppen definiert</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">Beginnen Sie mit einer Gruppe wie "Finanzen" oder "Operatives Risiko".</p>
        </div>
      )}
    </div>
  );
};

export default ParameterEditor;
