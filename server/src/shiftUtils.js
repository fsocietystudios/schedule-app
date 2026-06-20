export const SLOTS = ['day', 'night'];

export const SLOT_LABELS = {
  day: 'יום',
  night: 'לילה',
};

export const SLOT_TIME_LABELS = {
  day: '08:30–20:30',
  night: '20:30–08:30',
};

export const MANAGER_ROLES = ['owner', 'manager'];

export const ROLE_REQUIRED = {
  day: { manager: 1, employee: 1 },
  night: { employee: 2, on_call_manager: 1 },
};

const HEBREW_MONTH_ABBR = [
  'ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
  'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳',
];

export function formatDateShort(date) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ב${HEBREW_MONTH_ABBR[m - 1]}`;
}

export function daysInMonthKey(month) {
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(year, monthNum, 0).getDate();
}

export function weekdayOf(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isWeekend(date) {
  const wd = weekdayOf(date);
  return wd === 5 || wd === 6;
}

export function addDays(date, amount) {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, m - 1, d + amount);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

export function isDateInRange(date, start, end) {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export function isExemptOnSlot(exemption, date, slot) {
  if (exemption.type === 'no_nights') return slot === 'night';
  if (exemption.type === 'unavailable' || exemption.type === 'sick') {
    return isDateInRange(date, exemption.startDate, exemption.endDate);
  }
  if (exemption.type === 'fixed_days') {
    return exemption.daysOfWeek?.includes(weekdayOf(date)) ?? false;
  }
  return false;
}

export function isMemberAvailable(memberId, date, slot, exemptions) {
  return !exemptions.some((e) => e.memberId === memberId && isExemptOnSlot(e, date, slot));
}

export function shiftMemberIds(shift) {
  return shift.assignments.map((a) => a.memberId);
}

export function shiftHasMember(shift, memberId) {
  return shift.assignments.some((a) => a.memberId === memberId);
}
