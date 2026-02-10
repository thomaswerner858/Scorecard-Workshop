
export interface ScoreRange {
  id: string;
  min?: number;
  max?: number;
  label?: string; // For categorical
  points: number; // 0-100
}

export type ParameterType = 'numeric' | 'categorical';

export interface ScoringParameter {
  id: string;
  groupId: string;
  name: string;
  type: ParameterType;
  weight: number; // Percentage within the group
  ranges: ScoreRange[];
}

export interface ParameterGroup {
  id: string;
  name: string;
  weight: number; // Percentage of the total score
}

export interface KOCriterion {
  id: string;
  parameterName: string;
  operator: 'equals' | 'greater' | 'less';
  value: string | number;
  label: string;
}

export interface TestData {
  [parameterId: string]: number | string | null;
}

export interface ScoringResult {
  totalScore: number;
  isKO: boolean;
  koReason?: string;
  activeGroups: string[]; // IDs of groups that had data
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
    contribution: number; // Contribution to the group score
  }[];
}
