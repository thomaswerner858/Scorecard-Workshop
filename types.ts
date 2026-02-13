
export interface ScoreRange {
  id: string;
  min?: number;
  max?: number;
  label?: string; 
  points: number; 
}

export type ParameterType = 'numeric' | 'categorical';

export interface ScoringParameter {
  id: string;
  groupId: string;
  name: string;
  type: ParameterType;
  weight: number; 
  ranges: ScoreRange[];
}

export interface ParameterGroup {
  id: string;
  name: string;
  weight: number; 
}

export interface KOCriterion {
  id: string;
  parameterName: string;
  operator: 'equals' | 'greater' | 'less';
  value: string | number;
  label: string;
}

export interface RiskClass {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export type LogicAction = 'add' | 'subtract' | 'multiply';
export type LogicOperator = 'equals' | 'greater' | 'less';

export interface LogicRule {
  id: string;
  parameterId: string;
  operator: LogicOperator;
  conditionValue: string | number;
  action: LogicAction;
  actionValue: number;
  label: string;
}

export interface TestData {
  [parameterId: string]: number | string | null;
}

export interface ScoringResult {
  totalScore: number;
  isKO: boolean;
  koReason?: string;
  activeGroups: string[];
  appliedRules: string[];
  riskClass?: RiskClass;
  groupContributions: {
    groupId: string;
    name: string;
    originalWeight: number;
    adjustedWeight: number;
    score: number;
  }[];
  parameterScores: {
    parameterId: string;
    name: string;
    value: number | string;
    points: number;
    contribution: number;
  }[];
}
