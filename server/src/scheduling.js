import {
  addDays,
  daysInMonthKey,
  isMemberAvailable,
  isWeekend,
  MANAGER_ROLES,
  ROLE_REQUIRED,
  shiftHasMember,
  shiftMemberIds,
  weekdayOf,
} from './shiftUtils.js';

function emptyCounts() {
  return { total: 0, night: 0, weekend: 0, onCall: 0 };
}

export function historyBaseline(team, history) {
  const baseline = {};
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

export function buildFairness(team, counts) {
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

export function countShiftsByMember(shifts, team) {
  const counts = {};
  team.forEach((m) => (counts[m.id] = 0));
  shifts.forEach((s) =>
    s.assignments.forEach((a) => {
      if (a.memberId in counts) counts[a.memberId] += 1;
    })
  );
  return counts;
}

function isAssignedSameDay(shifts, memberId, date) {
  return shifts.some((s) => s.date === date && shiftHasMember(s, memberId));
}

function roleEligiblePool(team, role) {
  if (role === 'manager' || role === 'on_call_manager') {
    return team.filter((m) => MANAGER_ROLES.includes(m.role));
  }
  return team.filter((m) => m.role === 'employee');
}

export function findBackfillCandidate(team, exemptions, shifts, date, slot, role, excludeIds) {
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

function buildWeekBlocks(dates) {
  const blocks = [];
  let current = [];
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

export function assignSchedule(month, team, exemptions, baseline) {
  const days = daysInMonthKey(month);
  const dates = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

  const counts = {};
  team.forEach((m) => (counts[m.id] = emptyCounts()));

  const totalOf = (id) => (baseline[id]?.total ?? 0) + counts[id].total;
  const nightOf = (id) => (baseline[id]?.night ?? 0) + counts[id].night;
  const weekendOf = (id) => (baseline[id]?.weekend ?? 0) + counts[id].weekend;
  const onCallOf = (id) => (baseline[id]?.onCall ?? 0) + counts[id].onCall;

  const managers = team.filter((m) => MANAGER_ROLES.includes(m.role));
  const employees = team.filter((m) => m.role === 'employee');

  const shiftsByKey = new Map();
  function getShift(date, slot) {
    const key = `${date}_${slot}`;
    let s = shiftsByKey.get(key);
    if (!s) {
      s = { date, slot, assignments: [] };
      shiftsByKey.set(key, s);
    }
    return s;
  }

  function assign(date, slot, memberId, role, { night = false, weekend = false, onCall = false } = {}) {
    getShift(date, slot).assignments.push({ memberId, role });
    if (onCall) {
      counts[memberId].onCall += 1;
    } else {
      counts[memberId].total += 1;
      if (night) counts[memberId].night += 1;
      if (weekend) counts[memberId].weekend += 1;
    }
  }

  function byNightLoad(a, b) {
    return totalOf(a.id) - totalOf(b.id) || nightOf(a.id) - nightOf(b.id) || weekendOf(a.id) - weekendOf(b.id);
  }

  // 1. Night-shift employees, in continuous Monday–Sunday blocks where possible.
  const nightCommittedByDate = {};
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
  const dayManagerOf = {};
  for (const date of dates) {
    const weekend = isWeekend(date);

    const managerPool = managers.filter((m) => isMemberAvailable(m.id, date, 'day', exemptions));
    managerPool.sort((a, b) => totalOf(a.id) - totalOf(b.id) || weekendOf(a.id) - weekendOf(b.id));
    if (managerPool.length) {
      assign(date, 'day', managerPool[0].id, 'manager', { weekend });
      dayManagerOf[date] = managerPool[0].id;
    }

    const committed = nightCommittedByDate[date] ?? new Set();
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

export function getTouchedShifts(request, schedule) {
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

export function buildImpacts(touchedShifts, memberId) {
  return touchedShifts.map((s) => {
    const role = s.assignments.find((a) => a.memberId === memberId)?.role ?? 'employee';
    const required = ROLE_REQUIRED[s.slot]?.[role] ?? 1;
    const sameRoleCount = s.assignments.filter((a) => a.role === role).length;
    const covered = Math.max(0, sameRoleCount - 1);
    return { date: s.date, slot: s.slot, role, covered, required, ok: covered >= required };
  });
}

export function applyRebalance(request, schedule, team, exemptions) {
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
      const ownAssignment = ownShift.assignments.find((a) => a.memberId === request.memberId);
      const partnerShift = shifts.find(
        (s) => s !== ownShift && s.date === ownShift.date && shiftHasMember(s, partnerId)
      );
      const partnerAssignment = partnerShift?.assignments.find((a) => a.memberId === partnerId);
      if (ownAssignment) ownAssignment.memberId = partnerId;
      if (partnerShift && partnerAssignment) partnerAssignment.memberId = request.memberId;
    }
  }

  const afterCounts = countShiftsByMember(shifts, team);
  return { shifts, beforeCounts, afterCounts };
}

export function buildLoad(team, beforeCounts, afterCounts) {
  const maxAfter = Math.max(1, ...team.map((m) => afterCounts[m.id] ?? 0));
  const avgAfter = team.length
    ? Object.values(afterCounts).reduce((a, b) => a + b, 0) / team.length
    : 0;
  const targetPct = Math.round((avgAfter / maxAfter) * 100);

  return team.map((m) => ({
    memberId: m.id,
    name: m.name,
    before: beforeCounts[m.id] ?? 0,
    after: afterCounts[m.id] ?? 0,
    pct: Math.round(((afterCounts[m.id] ?? 0) / maxAfter) * 100),
    targetPct,
  }));
}
