import { daysInMonthKey, isMemberAvailable, SLOTS } from './shiftUtils.js';

export function historyBaseline(team, history) {
  const baseline = {};
  team.forEach((m) => (baseline[m.id] = 0));
  history.forEach((h) => {
    Object.entries(h.perPersonCounts).forEach(([memberId, count]) => {
      if (memberId in baseline) baseline[memberId] += count;
    });
  });
  return baseline;
}

export function buildFairness(team, counts) {
  const max = Math.max(1, ...team.map((m) => counts[m.id] ?? 0));
  return team.map((m) => ({
    memberId: m.id,
    name: m.name,
    count: counts[m.id] ?? 0,
    pct: Math.round(((counts[m.id] ?? 0) / max) * 100),
  }));
}

export function countShiftsByMember(shifts, team) {
  const counts = {};
  team.forEach((m) => (counts[m.id] = 0));
  shifts.forEach((s) =>
    s.memberIds.forEach((id) => {
      if (id in counts) counts[id] += 1;
    })
  );
  return counts;
}

function isAssignedSameDay(shifts, memberId, date) {
  return shifts.some((s) => s.date === date && s.memberIds.includes(memberId));
}

export function findBackfillCandidate(team, exemptions, shifts, date, slot, excludeIds) {
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

export function assignSchedule(month, team, exemptions, minCoverage, baseline) {
  const days = daysInMonthKey(month);
  const monthCounts = {};
  const nightCounts = {};
  team.forEach((m) => {
    monthCounts[m.id] = 0;
    nightCounts[m.id] = 0;
  });
  const shifts = [];

  for (let day = 1; day <= days; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const assignedToday = new Set();
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

export function getTouchedShifts(request, schedule) {
  if (request.type === 'absence') {
    return schedule.shifts.filter(
      (s) =>
        s.memberIds.includes(request.memberId) &&
        s.date >= request.startDate &&
        s.date <= request.endDate
    );
  }
  if (request.type === 'swap' && request.swapDate && request.swapSlot) {
    const own = schedule.shifts.find((s) => s.date === request.swapDate && s.slot === request.swapSlot);
    return own ? [own] : [];
  }
  return [];
}

export function buildImpacts(touchedShifts, minCoveragePerShift) {
  return touchedShifts.map((s) => {
    const covered = s.memberIds.length - 1;
    return { date: s.date, slot: s.slot, covered, required: minCoveragePerShift, ok: covered >= minCoveragePerShift };
  });
}

export function applyRebalance(request, schedule, team, exemptions, minCoveragePerShift) {
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
