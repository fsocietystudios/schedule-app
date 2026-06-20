import {
  AssignmentRole,
  Exemption,
  HistoryMonth,
  PersonCounts,
  Role,
  Schedule,
  Shift,
  ShiftSlot,
  TeamMember,
} from '@/types';
import { isWeekend, weekdayOf } from './calendar';

export const SLOTS: ShiftSlot[] = ['day', 'night'];

export const MANAGER_ROLES: Role[] = ['owner', 'manager'];

export const SLOT_LABELS: Record<ShiftSlot, string> = {
  day: 'יום',
  night: 'לילה',
};

export const SLOT_TIME_LABELS: Record<ShiftSlot, string> = {
  day: '08:30–20:30',
  night: '20:30–08:30',
};

export const ASSIGNMENT_ROLE_LABELS: Record<AssignmentRole, string> = {
  manager: 'מנהל',
  employee: 'עובד',
  on_call_manager: 'כונן',
};

export const ROLE_REQUIRED: Record<ShiftSlot, Partial<Record<AssignmentRole, number>>> = {
  day: { manager: 1, employee: 1 },
  night: { employee: 2, on_call_manager: 1 },
};

export function isDateInRange(date: string, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export function isExemptOnSlot(exemption: Exemption, date: string, slot: ShiftSlot): boolean {
  if (exemption.type === 'no_nights') return slot === 'night';
  if (exemption.type === 'unavailable' || exemption.type === 'sick') {
    return isDateInRange(date, exemption.startDate, exemption.endDate);
  }
  if (exemption.type === 'fixed_days') {
    return exemption.daysOfWeek?.includes(weekdayOf(date)) ?? false;
  }
  return false;
}

export function isMemberAvailable(
  memberId: string,
  date: string,
  slot: ShiftSlot,
  exemptions: Exemption[]
): boolean {
  return !exemptions.some((e) => e.memberId === memberId && isExemptOnSlot(e, date, slot));
}

export function shiftMemberIds(shift: Shift): string[] {
  return shift.assignments.map((a) => a.memberId);
}

export function shiftHasMember(shift: Shift, memberId: string): boolean {
  return shift.assignments.some((a) => a.memberId === memberId);
}

export function groupShiftsByDate(shifts: Shift[]): Map<string, { day?: Shift; night?: Shift }> {
  const byDate = new Map<string, { day?: Shift; night?: Shift }>();
  shifts.forEach((s) => {
    const entry = byDate.get(s.date) ?? {};
    entry[s.slot] = s;
    byDate.set(s.date, entry);
  });
  return new Map([...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function emptyCounts(): PersonCounts {
  return { total: 0, night: 0, weekend: 0, onCall: 0 };
}

export function summarizeScheduleCounts(
  schedule: Schedule,
  team: TeamMember[]
): Record<string, PersonCounts> {
  const counts: Record<string, PersonCounts> = {};
  team.forEach((m) => (counts[m.id] = emptyCounts()));

  schedule.shifts.forEach((s) => {
    const weekend = isWeekend(s.date);
    s.assignments.forEach((a) => {
      if (!(a.memberId in counts)) return;
      if (a.role === 'on_call_manager') {
        counts[a.memberId].onCall += 1;
      } else {
        counts[a.memberId].total += 1;
        if (s.slot === 'night') counts[a.memberId].night += 1;
        if (weekend) counts[a.memberId].weekend += 1;
      }
    });
  });

  return counts;
}

export function scheduleToHistoryMonth(schedule: Schedule, team: TeamMember[]): HistoryMonth {
  const perPersonCounts = summarizeScheduleCounts(schedule, team);
  const totalShifts = schedule.shifts.reduce((sum, s) => sum + s.assignments.length, 0);
  const peopleCount = new Set(schedule.shifts.flatMap((s) => shiftMemberIds(s))).size;

  return {
    id: `history-${schedule.id}`,
    month: schedule.month,
    totalShifts,
    peopleCount,
    source: 'generated',
    perPersonCounts,
  };
}
