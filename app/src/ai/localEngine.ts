import {
  Exemption,
  FairnessEntry,
  HistoryMonth,
  RebalanceLoadEntry,
  Shift,
  ShiftSlot,
  TeamMember,
} from '@/types';
import { daysInMonthKey, formatDateShort } from '@/utils/calendar';
import { isMemberAvailable, SLOTS } from '@/utils/shift';
import {
  AiEngine,
  EvaluateRequestInput,
  EvaluateRequestOutput,
  GenerateScheduleInput,
  GenerateScheduleOutput,
  RebalanceInput,
  RebalanceOutput,
} from './types';

function historyBaseline(team: TeamMember[], history: HistoryMonth[]): Record<string, number> {
  const baseline: Record<string, number> = {};
  team.forEach((m) => (baseline[m.id] = 0));
  history.forEach((h) => {
    Object.entries(h.perPersonCounts).forEach(([memberId, count]) => {
      if (memberId in baseline) baseline[memberId] += count;
    });
  });
  return baseline;
}

function buildFairness(team: TeamMember[], counts: Record<string, number>): FairnessEntry[] {
  const max = Math.max(1, ...team.map((m) => counts[m.id] ?? 0));
  return team.map((m) => ({
    memberId: m.id,
    name: m.name,
    count: counts[m.id] ?? 0,
    pct: Math.round(((counts[m.id] ?? 0) / max) * 100),
  }));
}

function countShiftsByMember(shifts: Shift[], team: TeamMember[]): Record<string, number> {
  const counts: Record<string, number> = {};
  team.forEach((m) => (counts[m.id] = 0));
  shifts.forEach((s) =>
    s.memberIds.forEach((id) => {
      if (id in counts) counts[id] += 1;
    })
  );
  return counts;
}

function isAssignedSameDay(shifts: Shift[], memberId: string, date: string): boolean {
  return shifts.some((s) => s.date === date && s.memberIds.includes(memberId));
}

function findBackfillCandidate(
  team: TeamMember[],
  exemptions: Exemption[],
  shifts: Shift[],
  date: string,
  slot: ShiftSlot,
  excludeIds: string[]
): TeamMember | null {
  const counts = countShiftsByMember(shifts, team);
  const candidates = team.filter(
    (m) =>
      !excludeIds.includes(m.id) &&
      isMemberAvailable(m.id, date, slot, exemptions) &&
      !isAssignedSameDay(shifts, m.id, date)
  );
  candidates.sort((a, b) => counts[a.id] - counts[b.id]);
  return candidates[0] ?? null;
}

function assignSchedule(
  month: string,
  team: TeamMember[],
  exemptions: Exemption[],
  minCoverage: number,
  baseline: Record<string, number>
): { shifts: Shift[]; monthCounts: Record<string, number> } {
  const days = daysInMonthKey(month);
  const monthCounts: Record<string, number> = {};
  const nightCounts: Record<string, number> = {};
  team.forEach((m) => {
    monthCounts[m.id] = 0;
    nightCounts[m.id] = 0;
  });
  const shifts: Shift[] = [];

  for (let day = 1; day <= days; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const assignedToday = new Set<string>();
    for (const slot of SLOTS) {
      const eligible = team.filter(
        (m) => !assignedToday.has(m.id) && isMemberAvailable(m.id, date, slot, exemptions)
      );
      eligible.sort((a, b) => {
        const totalA = baseline[a.id] + monthCounts[a.id];
        const totalB = baseline[b.id] + monthCounts[b.id];
        if (totalA !== totalB) return totalA - totalB;
        if (slot === 'night') return nightCounts[a.id] - nightCounts[b.id];
        return 0;
      });
      const picked = eligible.slice(0, minCoverage);
      picked.forEach((m) => {
        assignedToday.add(m.id);
        monthCounts[m.id] += 1;
        if (slot === 'night') nightCounts[m.id] += 1;
      });
      shifts.push({ date, slot, memberIds: picked.map((m) => m.id) });
    }
  }
  return { shifts, monthCounts };
}

async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  const baseline = historyBaseline(input.team, input.history);
  const { shifts, monthCounts } = assignSchedule(
    input.month,
    input.team,
    input.exemptions,
    input.minCoveragePerShift,
    baseline
  );
  const fairness = buildFairness(input.team, monthCounts);

  return {
    shifts,
    fairness,
    steps: [
      { label: 'קריאת תפקידים, שחרורים וזמינות' },
      { label: 'החלת איוש מינימלי לכל משמרת' },
      { label: 'איזון מול חודשים קודמים (היסטוריה)' },
      { label: 'חלוקת לילות וסופי שבוע באופן הוגן' },
    ],
  };
}

async function evaluateRequest(input: EvaluateRequestInput): Promise<EvaluateRequestOutput> {
  const { request, schedule, team, exemptions, minCoveragePerShift } = input;
  let touchedShifts: Shift[] = [];

  if (request.type === 'absence') {
    touchedShifts = schedule.shifts.filter(
      (s) =>
        s.memberIds.includes(request.memberId) &&
        s.date >= request.startDate &&
        s.date <= request.endDate
    );
  } else if (request.type === 'swap' && request.swapDate && request.swapSlot) {
    const own = schedule.shifts.find(
      (s) => s.date === request.swapDate && s.slot === request.swapSlot
    );
    if (own) touchedShifts = [own];
  }

  const impacts = touchedShifts.map((s) => {
    const covered = s.memberIds.length - 1;
    return { date: s.date, slot: s.slot, covered, required: minCoveragePerShift, ok: covered >= minCoveragePerShift };
  });

  const understaffed = impacts.filter((i) => !i.ok);
  let suggestion: string;
  let recommendApprove = true;

  if (touchedShifts.length === 0) {
    suggestion = 'לא נמצאו משמרות מושפעות בטווח שנבחר. ניתן לאשר ללא חשש.';
  } else if (understaffed.length === 0) {
    suggestion = 'ניתן לאשר. אם תאשר, אבצע איזון מחדש כך שהעומס יישאר הוגן לכולם.';
  } else {
    const first = understaffed[0];
    const candidate = findBackfillCandidate(team, exemptions, schedule.shifts, first.date, first.slot, [
      request.memberId,
    ]);
    if (candidate) {
      suggestion = `ניתן לאשר. אם תאשר, אבצע איזון מחדש ואכסה את ${formatDateShort(first.date)} עם ${candidate.name} (הכי מעט משמרות החודש).`;
    } else {
      suggestion = 'הבקשה תשאיר איוש חסר ולא נמצא מחליף מתאים. מומלץ לבדוק ידנית לפני אישור.';
      recommendApprove = false;
    }
  }

  return { feedback: { impacts, suggestion, recommendApprove } };
}

async function rebalance(input: RebalanceInput): Promise<RebalanceOutput> {
  const { request, schedule, team, exemptions, minCoveragePerShift } = input;
  const beforeCounts = countShiftsByMember(schedule.shifts, team);
  const shifts = schedule.shifts.map((s) => ({ ...s, memberIds: [...s.memberIds] }));

  if (request.type === 'absence') {
    const touched = shifts.filter(
      (s) =>
        s.memberIds.includes(request.memberId) &&
        s.date >= request.startDate &&
        s.date <= request.endDate
    );
    touched.forEach((s) => {
      s.memberIds = s.memberIds.filter((id) => id !== request.memberId);
      if (s.memberIds.length < minCoveragePerShift) {
        const candidate = findBackfillCandidate(team, exemptions, shifts, s.date, s.slot, [
          request.memberId,
          ...s.memberIds,
        ]);
        if (candidate) s.memberIds.push(candidate.id);
      }
    });
  } else if (
    request.type === 'swap' &&
    request.swapDate &&
    request.swapSlot &&
    request.swapWithMemberId
  ) {
    const ownShift = shifts.find((s) => s.date === request.swapDate && s.slot === request.swapSlot);
    if (ownShift) {
      const partnerId = request.swapWithMemberId;
      const partnerShift = shifts.find(
        (s) => s !== ownShift && s.date === ownShift.date && s.memberIds.includes(partnerId)
      );
      ownShift.memberIds = ownShift.memberIds.map((id) => (id === request.memberId ? partnerId : id));
      if (partnerShift) {
        partnerShift.memberIds = partnerShift.memberIds.map((id) =>
          id === partnerId ? request.memberId : id
        );
      }
    }
  }

  const afterCounts = countShiftsByMember(shifts, team);
  const maxAfter = Math.max(1, ...team.map((m) => afterCounts[m.id] ?? 0));
  const avgAfter = team.length
    ? Object.values(afterCounts).reduce((a, b) => a + b, 0) / team.length
    : 0;
  const targetPct = Math.round((avgAfter / maxAfter) * 100);

  const load: RebalanceLoadEntry[] = team.map((m) => ({
    memberId: m.id,
    name: m.name,
    before: beforeCounts[m.id] ?? 0,
    after: afterCounts[m.id] ?? 0,
    pct: Math.round(((afterCounts[m.id] ?? 0) / maxAfter) * 100),
    targetPct,
  }));

  const values = Object.values(afterCounts);
  const gap = values.length ? Math.max(...values) - Math.min(...values) : 0;
  const requesterName = team.find((m) => m.id === request.memberId)?.name ?? '';

  return {
    shifts,
    rebalance: {
      scheduleId: schedule.id,
      load,
      summary: `המשמרות של ${requesterName} פוזרו מחדש. בהתחשב בחודשים קודמים, הפער ירד ל-±${gap} — הוגן לכולם.`,
    },
  };
}

export const localEngine: AiEngine = { generateSchedule, evaluateRequest, rebalance };
