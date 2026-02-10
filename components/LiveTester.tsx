
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ScoringResult, TestData, ParameterGroup } from '../types';
import { PlayIcon, CheckCircleIcon, XCircleIcon, InfoIcon, RefreshCcwIcon } from 'lucide-react';

interface Props {
  groups: ParameterGroup[];
  parameters: ScoringParameter[];
  koCriteria: KOCriterion[];
}

const LiveTester: React.FC<Props> = ({ groups, parameters, koCriteria }) => {
  const [testValues, setTestValues] = useState<TestData>({});
  const [result, setResult] = useState<ScoringResult | null>(null);

  const calculateScore = () => {
    let isKO = false;
    let koReason = '';

    // 1. Check KO
    for (const ko of koCriteria) {
      const val = testValues[ko.id];
      if (val === undefined || val === null || val === '') continue;

      const testValStr = String(val).toLowerCase();
      const koValStr = String(ko.value).toLowerCase();
      
      let triggered = false;
      if (ko.operator === 'equals') {
        triggered = testValStr === koValStr;
      } else {
        const nVal = Number(val);
        const nKo = Number(ko.value);
        if (ko.operator === 'greater') triggered = nVal > nKo;
        if (ko.operator === 'less') triggered = nVal < nKo;
      }

      if (triggered) {
        isKO = true;
        koReason = ko.label;
        break;
      }
    }

    if (isKO) {
      setResult({
        totalScore: 0,
        isKO: true,
        koReason,
        activeGroups: [],
        groupContributions: [],
        parameterScores: []
      });
      return;
    }

    // 2. Identify active groups (groups where at least one parameter has data)
    const activeGroupIds = groups.filter(g => 
      parameters.some(p => p.groupId === g.id && testValues[p.id] !== undefined && testValues[p.id] !== null && testValues[p.id] !== '')
    ).map(g => g.id);

    // 3. Dynamic Weight Redistribution
    const totalOriginalWeightActive = groups
      .filter(g => activeGroupIds.includes(g.id))
      .reduce((sum, g) => sum + g.weight, 0);

    // Calculate adjusted group weights (they must sum to 100% of the active portion)
    const groupResults = groups.map(group => {
      const isActive = activeGroupIds.includes(group.id);
      const adjustedWeight = isActive ? (group.weight / totalOriginalWeightActive) * 100 : 0;
      
      // Calculate Group Score (Weighted average of its parameters)
      const groupParams = parameters.filter(p => p.groupId === group.id);
      const activeParamsInGroup = groupParams.filter(p => testValues[p.id] !== undefined && testValues[p.id] !== null && testValues[p.id] !== '');
      
      const totalParamWeightInGroup = activeParamsInGroup.reduce((sum, p) => sum + p.weight, 0);
      
      let groupScore = 0;
      if (isActive && totalParamWeightInGroup > 0) {
        groupScore = activeParamsInGroup.reduce((sum, p) => {
          const val = testValues[p.id];
          let points = 0;
          if (p.type === 'numeric') {
            const nVal = Number(val);
            const range = p.ranges.find(r => nVal >= (r.min || 0) && nVal < (r.max || Infinity));
            points = range ? range.points : 0;
          } else {
            const range = p.ranges.find(r => String(r.label).toLowerCase() === String(val).toLowerCase());
            points = range ? range.points : 0;
          }
          // Within group: relative weight
          const relativeWeight = p.weight / totalParamWeightInGroup;
          return sum + (points * relativeWeight);
        }, 0);
      }

      return {
        groupId: group.id,
        name: group.name,
        originalWeight: group.weight,
        adjustedWeight,
        score: groupScore
      };
    });

    const totalScore = groupResults.reduce((sum, gr) => sum + (gr.score * gr.adjustedWeight / 100), 0);

    setResult({
      totalScore,
      isKO: false,
      activeGroups: activeGroupIds,
      groupContributions: groupResults.filter(gr => gr.adjustedWeight > 0),
      parameterScores: [] // Could be expanded for detail view
    });
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-8 sticky top-6 overflow-hidden border border-slate-800">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <PlayIcon className="text-indigo-400" size={24} fill="currentColor" />
            Live-Test & Validierung
          </h2>
          {result && (
            <button 
              onClick={() => {setResult(null); setTestValues({});}} 
              className="text-slate-400 hover:text-white transition p-2"
              title="Reset"
            >
              <RefreshCcwIcon size={18} />
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* KO SECTION */}
          {koCriteria.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black tracking-widest text-red-400 uppercase">K.O. Test-Werte</h3>
              <div className="grid grid-cols-1 gap-3">
                {koCriteria.map(ko => (
                  <div key={ko.id}>
                    <label className="block text-xs text-slate-400 mb-1">{ko.label}</label>
                    <input 
                      type="text"
                      value={String(testValues[ko.id] || '')}
                      onChange={(e) => setTestValues({ ...testValues, [ko.id]: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition"
                      placeholder="z.B. Ja / Nein"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS SECTION */}
          {groups.map(group => (
            <div key={group.id} className="space-y-4">
              <h3 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">{group.name}</h3>
              <div className="grid grid-cols-1 gap-4">
                {parameters.filter(p => p.groupId === group.id).map(p => (
                  <div key={p.id}>
                    <label className="block text-xs text-slate-400 mb-1">{p.name}</label>
                    {p.type === 'numeric' ? (
                      <input 
                        type="number"
                        value={String(testValues[p.id] || '')}
                        onChange={(e) => setTestValues({ ...testValues, [p.id]: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                        placeholder="Zahlenwert eingeben..."
                      />
                    ) : (
                      <select 
                        value={String(testValues[p.id] || '')}
                        onChange={(e) => setTestValues({ ...testValues, [p.id]: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                      >
                        <option value="">-- Nicht angegeben --</option>
                        {p.ranges.map(opt => (
                          <option key={opt.id} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={calculateScore}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            Berechnung starten
          </button>

          {/* RESULT BOX */}
          {result && (
            <div className={`p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${result.isKO ? 'bg-red-500/10 border-red-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Resultat</span>
                {result.isKO ? <XCircleIcon className="text-red-500" /> : <CheckCircleIcon className="text-green-500" />}
              </div>
              
              <div className="text-5xl font-black tracking-tighter mb-4">
                {result.totalScore.toFixed(1)} <span className="text-lg font-normal opacity-40">/ 100</span>
              </div>

              {result.isKO ? (
                <div className="p-3 bg-red-500/20 rounded-lg text-red-200 text-sm font-medium">
                  K.O. Kriterium: {result.koReason}
                </div>
              ) : (
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase mb-2">
                    <RefreshCcwIcon size={12} /> Dynamic Weighting Aktiv
                  </div>
                  {result.groupContributions.map(gc => (
                    <div key={gc.groupId} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{gc.name}</span>
                        <span className="font-bold">{gc.score.toFixed(0)} Pkt</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-1000" 
                          style={{ width: `${gc.score}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        Gewicht: {gc.originalWeight}% → <span className="text-amber-400">{gc.adjustedWeight.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mt-16"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mb-16"></div>
    </div>
  );
};

export default LiveTester;
