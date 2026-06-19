import {
  AiRequestFeedback,
  Exemption,
  FairnessEntry,
  HistoryMonth,
  RebalanceResult,
  Schedule,
  Shift,
  ShiftRequest,
  TeamMember,
} from '@/types';

export interface GenerateScheduleInput {
  month: string;
  team: TeamMember[];
  exemptions: Exemption[];
  history: HistoryMonth[];
  minCoveragePerShift: number;
  isDemo?: boolean;
}

export interface GenerateStep {
  label: string;
}

export interface GenerateScheduleOutput {
  shifts: Shift[];
  fairness: FairnessEntry[];
  steps: GenerateStep[];
}

export interface EvaluateRequestInput {
  request: ShiftRequest;
  schedule: Schedule;
  team: TeamMember[];
  exemptions: Exemption[];
  history: HistoryMonth[];
  minCoveragePerShift: number;
}

export interface EvaluateRequestOutput {
  feedback: AiRequestFeedback;
}

export interface RebalanceInput {
  request: ShiftRequest;
  schedule: Schedule;
  team: TeamMember[];
  exemptions: Exemption[];
  history: HistoryMonth[];
  minCoveragePerShift: number;
}

export interface RebalanceOutput {
  shifts: Shift[];
  rebalance: RebalanceResult;
}

export interface AiEngine {
  generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput>;
  evaluateRequest(input: EvaluateRequestInput): Promise<EvaluateRequestOutput>;
  rebalance(input: RebalanceInput): Promise<RebalanceOutput>;
}
