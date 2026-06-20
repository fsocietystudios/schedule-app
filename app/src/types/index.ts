export type Role = 'owner' | 'manager' | 'employee';

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  jobTitle?: string;
  createdAt: string;
}

export type ExemptionType = 'no_nights' | 'unavailable' | 'sick' | 'fixed_days';

export interface Exemption {
  id: string;
  memberId: string;
  type: ExemptionType;
  permanent: boolean;
  startDate?: string;
  endDate?: string;
  reason?: string;
  daysOfWeek?: number[];
}

export type ShiftSlot = 'day' | 'night';

export type AssignmentRole = 'manager' | 'employee' | 'on_call_manager';

export interface ShiftAssignment {
  memberId: string;
  role: AssignmentRole;
}

export interface Shift {
  date: string;
  slot: ShiftSlot;
  assignments: ShiftAssignment[];
}

export type ScheduleStatus = 'draft' | 'published' | 'demo';

export interface PersonCounts {
  total: number;
  night: number;
  weekend: number;
  onCall: number;
}

export interface FairnessEntry {
  memberId: string;
  name: string;
  role: Role;
  counts: PersonCounts;
  pct: number;
}

export interface Schedule {
  id: string;
  month: string;
  status: ScheduleStatus;
  shifts: Shift[];
  fairness: FairnessEntry[];
  isDemo?: boolean;
  demoMemberIds?: string[];
  createdAt: string;
  publishedAt?: string;
}

export interface HistoryMonth {
  id: string;
  month: string;
  totalShifts: number;
  peopleCount: number;
  source: 'imported' | 'generated';
  perPersonCounts: Record<string, PersonCounts>;
}

export type RequestType = 'absence' | 'swap';
export type AbsenceType = 'vacation' | 'sick' | 'personal' | 'other';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ShiftImpact {
  date: string;
  slot: ShiftSlot;
  role: AssignmentRole;
  covered: number;
  required: number;
  ok: boolean;
}

export interface AiRequestFeedback {
  impacts: ShiftImpact[];
  suggestion: string;
  recommendApprove: boolean;
}

export interface ShiftRequest {
  id: string;
  type: RequestType;
  memberId: string;
  startDate: string;
  endDate: string;
  absenceType?: AbsenceType;
  reason?: string;
  swapWithMemberId?: string;
  swapDate?: string;
  swapSlot?: ShiftSlot;
  status: RequestStatus;
  aiFeedback?: AiRequestFeedback;
  rebalance?: RebalanceResult;
  createdAt: string;
}

export interface RebalanceLoadEntry {
  memberId: string;
  name: string;
  before: number;
  after: number;
  pct: number;
  targetPct: number;
}

export interface RebalanceResult {
  scheduleId: string;
  load: RebalanceLoadEntry[];
  summary: string;
}

export type AiEngineMode = 'local' | 'remote';

export interface AppSettings {
  aiEngine: AiEngineMode;
  serverUrl: string;
  serverToken: string;
}
