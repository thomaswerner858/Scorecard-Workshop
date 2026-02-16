
import React, { useState } from 'react';
import { ScoringParameter, KOCriterion, ScoringResult, TestData, ParameterGroup, RiskClass, LogicRule } from '../types';
import { PlayIcon, CheckCircleIcon, XCircleIcon, RefreshCcwIcon, ZapIcon, ShieldAlertIcon } from 'lucide-react';

interface Props {
  groups: ParameterGroup[];
  parameters: ScoringParameter[];
  koCriteria: KOCriterion[];
  riskClasses: RiskClass[];
  logicRules: LogicRule[];
}

const LiveTester: React.FC<Props> = ({ groups, parameters, koCriteria, riskClasses, logicRules }) => {
  const [testValues, setTestValues] = useState<TestData>({});
  const [result, setResult] = useState<ScoringResult | null>(null);

  const calculateScore = () => {
    let isKO = false;
    let koReason = '';

    // 1. Check KO
    for (const ko of koCriteria) {
      const val = testValues[ko.id];
      if (val === undefined || val === null || val === '') continue;

      const testValStr = String(val).toLowerCase().trim();
      const koValStr = String(ko.value).toLowerCase().trim();
      
      let triggered = false;
      if (ko.operator === 'equals') {
        triggered = testValStr === koValStr;
      } else {
        const nVal = Number(val);
        const nKo = Number(ko.value);
        if (!isNaN(nVal) && !isNaN(nKo)) {
          if (ko.operator === 'greater') triggered = nVal > nKo;
          if (ko.operator === 'less') triggered = nVal < nKo;
        }
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
        appliedRules: [],
        groupContributions: [],
        parameterScores: []
      });
      return;
    }

    // 2. Base Calculation
    const activeGroupIds = groups.filter(g => 
      parameters.some(p => p.groupId === g.id && testValues[p.id] !== undefined && testValues[p.id] !== null && testValues[p.id] !== '')
    ).map(g => g.id);

    const totalOriginalWeightActive = groups
      .filter(g => activeGroupIds.includes(g.id))
      .reduce((sum, g) => sum + g.weight, 0);

    const groupResults = groups.map(group => {
      const isActive = activeGroupIds.includes(group.id);
      const adjustedWeight = isActive ? (group.weight / (totalOriginalWeightActive || 100)) * 100 : 0;
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
            // Handling open-ended ranges (undefined min/max as -/+ Infinity)
            const range = p.ranges.find(r => nVal >= (r.min ?? -Infinity) && nVal <= (r.max ?? Infinity));
            points = range ? range.points : 0;
          } else {
            const range = p.ranges.find(r => String(r.label).toLowerCase() === String(val).toLowerCase().trim());
            points = range ? range.points : 0;
          }
          const relativeWeight = p.weight / totalParamWeightInGroup;
          return sum + (points * relativeWeight);
        }, 0);
      }

      return { groupId: group.id, name: group.name, originalWeight: group.weight, adjustedWeight, score: groupScore };
    });

    let totalScore = groupResults.reduce((sum, gr) => sum + (gr.score * gr.adjustedWeight / 100), 0);

    // 3. Apply Logic Rules
    const appliedRules: string[] = [];
    logicRules.forEach(rule => {
      const val = testValues[rule.parameterId];
      if (val === undefined || val === null || val === '') return;

      let triggered = false;
      const testValStr = String(val).toLowerCase().trim();
      const condValStr = String(rule.conditionValue).toLowerCase().trim();

      if (rule.operator === 'equals') {
        triggered = testValStr === condValStr;
      } else {
        const nVal = Number(val);
        const nCond = Number(rule.conditionValue);
        if (rule.operator === 'greater') triggered = nVal > nCond;
        if (rule.operator === 'less') triggered = nVal < nCond;
      }

      if (triggered) {
        appliedRules.push(rule.label);
        if (rule.action === 'add') totalScore += rule.actionValue;
        if (rule.action === 'subtract') totalScore -= rule.actionValue;
        if (rule.action === 'multiply') totalScore *= rule.actionValue;
      }
    });

    totalScore = Math.max(0, Math.min(100, totalScore));

    // 4. Find Risk Class
    const riskClass = riskClasses.find(rc => totalScore >= rc.minScore && totalScore <= rc.maxScore);

    setResult({
      totalScore,
      isKO: false,
      activeGroups: activeGroupIds,
      appliedRules,
      riskClass,
      groupContributions: groupResults.filter(gr => gr.adjustedWeight > 0),
      parameterScores: []
    });
  };

  return (
    <div className="bg-[#0D2B5B] text-white rounded-[2.5rem] shadow-2xl p-8 border border-white/5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
            <PlayIcon className="text-[#4A90E2]" size={20} fill="currentColor" />
            Live Simulator
          </h2>
          {result && (
            <button onClick={() => {setResult(null); setTestValues({});}} className="text-slate-500 hover:text-white transition p-2 bg-white/5 rounded-lg">
              <RefreshCcwIcon size={16} />
            </button>
          )}
        </div>

        <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {koCriteria.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <ShieldAlertIcon size={14} className="text-red-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400">K.O. & Stammdaten Check</span>
               </div>
               {koCriteria.map(ko => (
                 <div key={ko.id} className="space-y-1.5">
                   <label className="block text-[9px] font-bold text-slate-300 uppercase">{ko.label}</label>
                   <input 
                     type="text"
                     value={String(testValues[ko.id] || '')}
                     onChange={(e) => setTestValues({ ...testValues, [ko.id]: e.target.value })}
                     className="w-full bg-[#0A244D] border border-red-500/10 rounded-xl p-2.5 text-xs focus:border-red-400 outline-none transition font-bold"
                     placeholder={`${ko.parameterName} Wert...`}
                   />
                 </div>
               ))}
            </div>
          )}

          <div className="space-y-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Scoring Faktoren</span>
            {parameters.map(p => (
              <div key={p.id} className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.name}</label>
                {p.type === 'numeric' ? (
                  <input 
                    type="number"
                    value={String(testValues[p.id] || '')}
                    onChange={(e) => setTestValues({ ...testValues, [p.id]: e.target.value })}
                    className="w-full bg-[#0A244D] border border-white/10 rounded-xl p-3 text-sm focus:border-[#4A90E2] outline-none transition font-bold"
                    placeholder="Wert eingeben..."
                  />
                ) : (
                  <select 
                    value={String(testValues[p.id] || '')}
                    onChange={(e) => setTestValues({ ...testValues, [p.id]: e.target.value })}
                    className="w-full bg-[#0A244D] border border-white/10 rounded-xl p-3 text-sm focus:border-[#4A90E2] outline-none transition font-bold text-white appearance-none"
                  >
                    <option value="">-- Wählen --</option>
                    {p.ranges.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={calculateScore}
            className="w-full bg-[#1D4686] hover:bg-[#4A90E2] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-3 active:scale-95"
          >
            Logik Testen
          </button>

          {result && (
            <div className={`p-8 rounded-[2rem] border-2 animate-in zoom-in duration-300 ${result.isKO ? 'bg-red-500/5 border-red-500/20' : 'bg-[#4A90E2]/5 border-[#4A90E2]/20'}`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ergebnis</span>
                {result.isKO ? <XCircleIcon className="text-red-500" /> : <CheckCircleIcon className="text-green-500" />}
              </div>
              <div className="text-center mb-8">
                <div className="text-6xl font-black tracking-tighter mb-2">{result.totalScore.toFixed(0)}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Punkte erreicht</div>
              </div>
              {result.riskClass && !result.isKO && (
                <div className="mb-6 p-4 rounded-2xl text-center border shadow-lg animate-bounce" style={{ borderColor: result.riskClass.color, backgroundColor: `${result.riskClass.color}15` }}>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1" style={{ color: result.riskClass.color }}>Klassifizierung</div>
                  <div className="text-xl font-black uppercase tracking-tighter" style={{ color: result.riskClass.color }}>{result.riskClass.name}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTester;
