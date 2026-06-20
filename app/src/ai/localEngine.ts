import {
  AssignmentRole,
  Exemption,
  FairnessEntry,
  HistoryMonth,
  PersonCounts,
  RebalanceLoadEntry,
  Shift,
  ShiftAssignment,
  ShiftImpact,
  ShiftSlot,
  TeamMember,
} from '@/types';
import { addDays, daysInMonthKey, formatDateShort, isWeekend, weekdayOf } from '@/utils/calendar';
import { isMemberAvailable, MANAGER_ROLES, ROLE_REQUIRED, shiftHasMember, shiftMemberIds } from '@/utils/shift';
import {
  AiEngine,
  EvaluateRequestInput,
  EvaluateRequestOutput,
  GenerateScheduleInput,
  GenerateScheduleOutput,
  RebalanceInput,
  RebalanceOutput,
} from './types';

function emptyCounts(): PersonCounts {
  return { total: 0, night: 0, weekend: 0, onCall: 0 };
}

function historyBaseline(team: TeamMember[], history: HistoryMonth[]): Record<string, PersonCounts> {
  const baseline: Record<string, PersonCounts> = {};
  team.forEach((m) => (baseline[m.id] = emptyCounts()));
  history.forEach((h) => {
    Object.entries(h.perPersonCounts ?? {}).forEach(([memberId, counts]) => {
      if (!(memberId in baseline)) return;
      baseline[memberId].total += counts.total ?? 0;
      baseline[memberId].night += counts.night ?? 0;
      baseline[memberId].weekend += counts.weekend ?? 0;
      baseline[memberId].onCall += counts.onCall ?? 0;
    });
  });
  return baseline;
}

function buildFairness(team: TeamMember[], counts: Record<string, PersonCounts>): FairnessEntry[] {
  const max = Math.max(1, ...team.map((m) => counts[m.id]?.total ?? 0));
  return team.map((m) => {
    const c = counts[m.id] ?? emptyCounts();
    return {
      memberId: m.id,
      name: m.name,
      role: m.role,
      counts: c,
      pct: Math.round((c.total / max) * 100),
    };
  });
}

function countShiftsByMember(shifts: Shift[], team: TeamMember[]): Record<string, number> {
  const counts: Record<string, number> = {};
  team.forEach((m) => (counts[m.id] = 0));
  shifts.forEach((s) =>
    s.assignments.forEach((a) => {
      if (a.memberId in counts) counts[a.memberId] += 1;
    })
  );
  return counts;
}

function isAssignedSameDay(shifts: Shift[], memberId: string, date: string): boolean {
  return shifts.some((s) => s.date === date && shiftHasMember(s, memberId));
}

function roleEligiblePool(team: TeamMember[], role: AssignmentRole): TeamMember[] {
  if (role === 'manager' || role === 'on_call_manager') {
    return team.filter((m) => MANAGER_ROLES.includes(m.role));
  }
  return team.filter((m) => m.role === 'employee');
}

function findBackfillCandidate(
  team: TeamMember[],
  exemptions: Exemption[],
  shifts: Shift[],
  date: string,
  slot: ShiftSlot,
  role: AssignmentRole,
  excludeIds: string[]
): TeamMember | null {
  const counts = countShiftsByMember(shifts, team);
  const pool = roleEligiblePool(team, role);
  const candidates = pool.filter(
    (m) =>
      !excludeIds.includes(m.id) &&
      isMemberAvailable(m.id, date, slot, exemptions) &&
      !isAssignedSameDay(shifts, m.id, date)
  );
  candidates.sort((a, b) => counts[a.id] - counts[b.id]);
  return candidates[0] ?? null;
}

function buildWeekBlocks(dates: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const date of dates) {
    if (current.length && weekdayOf(date) === 1) {
      blocks.push(current);
      current = [];
    }
    current.push(date);
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function assignSchedule(
  month: string,
  team: TeamMember[],
  exemptions: Exemption[],
  baseline: Record<string, PersonCounts>
): { shifts: Shift[]; counts: Record<string, PersonCounts> } {
  const days = daysInMonthKey(month);
  const dates = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

  const counts: Record<string, PersonCounts> = {};
  team.forEach((m) => (counts[m.id] = emptyCounts()));

  const totalOf = (id: string) => (baseline[id]?.total ?? 0) + counts[id].total;
  const nightOf = (id: string) => (baseline[id]?.night ?? 0) + counts[id].night;
  const weekendOf = (id: string) => (baseline[id]?.weekend ?? 0) + counts[id].weekend;
  const onCallOf = (id: string) => (baseline[id]?.onCall ?? 0) + counts[id].onCall;

  const managers = team.filter((m) => MANAGER_ROLES.includes(m.role));
  const employees = team.filter((m) => m.role === 'employee');

  const shiftsByKey = new Map<string, Shift>();
  function getShift(date: string, slot: ShiftSlot): Shift {
    const key = `${date}_${slot}`;
    let s = shiftsByKey.get(key);
    if (!s) {
      s = { date, slot, assignments: [] };
      shiftsByKey.set(key, s);
    }
    return s;
  }

  function assign(
    date: string,
    slot: ShiftSlot,
    memberId: string,
    role: AssignmentRole,
    { night = false, weekend = false, onCall = false }: { night?: boolean; weekend?: boolean; onCall?: boolean } = {}
  ) {
    getShift(date, slot).assignments.push({ memberId, role });
    if (onCall) {
      counts[memberId].onCall += 1;
    } else {
      counts[memberId].total += 1;
      if (night) counts[memberId].night += 1;
      if (weekend) counts[memberId].weekend += 1;
    }
  }

  function byNightLoad(a: TeamMember, b: TeamMember) {
    return totalOf(a.id) - totalOf(b.id) || nightOf(a.id) - nightOf(b.id) || weekendOf(a.id) - weekendOf(b.id);
  }

  // 1. Night-shift employees, in continuous Monday–Sunday blocks where possible.
  const nightCommittedByDate: Record<string, Set<string>> = {};
  const blocks = buildWeekBlocks(dates);
  for (const block of blocks) {
    const fullyAvailable = employees.filter((m) =>
      block.every((d) => isMemberAvailable(m.id, d, 'night', exemptions))
    );
    fullyAvailable.sort(byNightLoad);
    const picked = fullyAvailable.slice(0, 2);
    const committed = new Set(picked.map((m) => m.id));

    block.forEach((date) => {
      const weekend = isWeekend(date);
      picked.forEach((m) => assign(date, 'night', m.id, 'employee', { night: true, weekend }));
    });

    // Top up any night still short of 2 employees (small team / heavy exemptions).
    block.forEach((date) => {
      const weekend = isWeekend(date);
      while (getShift(date, 'night').assignments.filter((a) => a.role === 'employee').length < 2) {
        const already = shiftMemberIds(getShift(date, 'night'));
        const pool = employees.filter(
          (m) => !already.includes(m.id) && isMemberAvailable(m.id, date, 'night', exemptions)
        );
        pool.sort(byNightLoad);
        if (!pool.length) break;
        assign(date, 'night', pool[0].id, 'employee', { night: true, weekend });
        committed.add(pool[0].id);
      }
    });

    block.forEach((date) => {
      nightCommittedByDate[date] = committed;
    });
  }

  // 2. Day-shift manager + employee, every day (including weekends).
  const dayManagerOf: Record<string, string> = {};
  for (const date of dates) {
    const weekend = isWeekend(date);

    const managerPool = managers.filter((m) => isMemberAvailable(m.id, date, 'day', exemptions));
    managerPool.sort((a, b) => totalOf(a.id) - totalOf(b.id) || weekendOf(a.id) - weekendOf(b.id));
    if (managerPool.length) {
      assign(date, 'day', managerPool[0].id, 'manager', { weekend });
      dayManagerOf[date] = managerPool[0].id;
    }

    const committed = nightCommittedByDate[date] ?? new Set<string>();
    const employeePool = employees.filter(
      (m) => !committed.has(m.id) && isMemberAvailable(m.id, date, 'day', exemptions)
    );
    employeePool.sort((a, b) => totalOf(a.id) - totalOf(b.id) || weekendOf(a.id) - weekendOf(b.id));
    if (employeePool.length) assign(date, 'day', employeePool[0].id, 'employee', { weekend });
  }

  // 3. Night on-call manager — fair rotation, never the next day's shift manager.
  for (const date of dates) {
    const nextDate = addDays(date, 1);
    const forbiddenId = dates.includes(nextDate) ? dayManagerOf[nextDate] : undefined;

    let pool = managers.filter((m) => m.id !== forbiddenId && isMemberAvailable(m.id, date, 'night', exemptions));
    if (!pool.length) {
      pool = managers.filter((m) => isMemberAvailable(m.id, date, 'night', exemptions));
    }
    pool.sort((a, b) => onCallOf(a.id) - onCallOf(b.id) || totalOf(a.id) - totalOf(b.id));
    if (pool.length) assign(date, 'night', pool[0].id, 'on_call_manager', { onCall: true });
  }

  const shifts = dates.flatMap((date) => [getShift(date, 'day'), getShift(date, 'night')]);
  return { shifts, counts };
}

async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  const baseline = historyBaseline(input.team, input.history);
  const { shifts, counts } = assignSchedule(input.month, input.team, input.exemptions, baseline);
  const fairness = buildFairness(input.team, counts);

  return {
    shifts,
    fairness,
    steps: [
      { label: 'קריאת תפקידים, שחרורים וזמינות' },
      { label: 'שיבוץ עובדי לילה בבלוקים שבועיים' },
      { label: 'שיבוץ מנהל ועובד למשמרות יום, כולל סופי שבוע' },
      { label: 'שיבוץ כונן לילה תוך הימנעות מהמנהל של היום הבא' },
      { label: 'איזון מול חודשים קודמים (היסטוריה)' },
    ],
  };
}

function getTouchedShifts(request: EvaluateRequestInput['request'], schedule: EvaluateRequestInput['schedule']): Shift[] {
  if (request.type === 'absence') {
    return schedule.shifts.filter(
      (s) => shiftHasMember(s, request.memberId) && s.date >= request.startDate && s.date <= request.endDate
    );
  }
  if (request.type === 'swap' && request.swapDate && request.swapSlot) {
    const own = schedule.shifts.find((s) => s.date === request.swapDate && s.slot === request.swapSlot);
    return own ? [own] : [];
  }
  return [];
}

function buildImpacts(touchedShifts: Shift[], memberId: string): ShiftImpact[] {
  return touchedShifts.map((s) => {
    const role: AssignmentRole = s.assignments.find((a) => a.memberId === memberId)?.role ?? 'employee';
    const required = ROLE_REQUIRED[s.slot]?.[role] ?? 1;
    const sameRoleCount = s.assignments.filter((a) => a.role === role).length;
    const covered = Math.max(0, sameRoleCount - 1);
    return { date: s.date, slot: s.slot, role, covered, required, ok: covered >= required };
  });
}

async function evaluateRequest(input: EvaluateRequestInput): Promise<EvaluateRequestOutput> {
  const { request, schedule, team, exemptions } = input;
  const touchedShifts = getTouchedShifts(request, schedule);
  const impacts = buildImpacts(touchedShifts, request.memberId);
  const understaffed = impacts.filter((i) => !i.ok);

  if (touchedShifts.length === 0) {
    return {
      feedback: {
        impacts,
        suggestion: 'לא נמצאו משמרות מושפעות בטווח שנבחר. ניתן לאשר ללא חשש.',
        recommendApprove: true,
      },
    };
  }

  let suggestion: string;
  let recommendApprove = true;

  if (understaffed.length === 0) {
    suggestion = 'ניתן לאשר. אם תאשר, אבצע איזון מחדש כך שהעומס יישאר הוגן לכולם.';
  } else {
    const first = understaffed[0];
    const candidate = findBackfillCandidate(team, exemptions, schedule.shifts, first.date, first.slot, first.role, [
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
  const { request, schedule, team, exemptions } = input;
  const beforeCounts = countShiftsByMember(schedule.shifts, team);
  const shifts = schedule.shifts.map((s) => ({ ...s, assignments: s.assignments.map((a) => ({ ...a })) }));

  if (request.type === 'absence') {
    const touched = shifts.filter(
      (s) => shiftHasMember(s, request.memberId) && s.date >= request.startDate && s.date <= request.endDate
    );
    touched.forEach((s) => {
      const vacated = s.assignments.find((a) => a.memberId === request.memberId);
      s.assignments = s.assignments.filter((a) => a.memberId !== request.memberId);
      if (!vacated) return;
      const required = ROLE_REQUIRED[s.slot]?.[vacated.role] ?? 1;
      const remaining = s.assignments.filter((a) => a.role === vacated.role).length;
      if (remaining < required) {
        const exclude = [request.memberId, ...s.assignments.map((a) => a.memberId)];
        const candidate = findBackfillCandidate(team, exemptions, shifts, s.date, s.slot, vacated.role, exclude);
        if (candidate) s.assignments.push({ memberId: candidate.id, role: vacated.role });
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
      const ownAssignment: ShiftAssignment | undefined = ownShift.assignments.find(
        (a) => a.memberId === request.memberId
      );
      const partnerShift = shifts.find(
        (s) => s !== ownShift && s.date === ownShift.date && shiftHasMember(s, partnerId)
      );
      const partnerAssignment = partnerShift?.assignments.find((a) => a.memberId === partnerId);
      if (ownAssignment) ownAssignment.memberId = partnerId;
      if (partnerShift && partnerAssignment) partnerAssignment.memberId = request.memberId;
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
