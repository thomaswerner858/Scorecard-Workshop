
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldAlertIcon className="text-red-500" size={24} /> 
          2. K.O. Kriterien
        </h2>
        <button 
          onClick={addKO}
          className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition"
        >
          <PlusIcon size={16} /> K.O. Hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {criteria.map((ko) => (
          <div key={ko.id} className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text"
                value={ko.label}
                onChange={(e) => updateKO(ko.id, { label: e.target.value })}
                className="w-full text-sm font-semibold text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none"
                placeholder="Bezeichnung (z.B. Negativmerkmale)"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Wenn
              <input 
                type="text"
                value={ko.parameterName}
                onChange={(e) => updateKO(ko.id, { parameterName: e.target.value })}
                className="w-24 p-1 border rounded"
                placeholder="Feld"
              />
              <select 
                value={ko.operator}
                onChange={(e) => updateKO(ko.id, { operator: e.target.value as any })}
                className="p-1 border rounded"
              >
                <option value="equals">=</option>
                <option value="greater">&gt;</option>
                <option value="less">&lt;</option>
              </select>
              <input 
                type="text"
                value={ko.value}
                onChange={(e) => updateKO(ko.id, { value: e.target.value })}
                className="w-20 p-1 border rounded"
                placeholder="Wert"
              />
            </div>
            <button 
              onClick={() => removeKO(ko.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition"
            >
              <TrashIcon size={18} />
            </button>
          </div>
        ))}

        {criteria.length === 0 && (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center text-gray-500 text-sm">
            Keine K.O. Kriterien definiert. Der Score berechnet sich rein additiv.
          </div>
        )}
      </div>
    </div>
  );
};

export default KOCriteriaEditor;
