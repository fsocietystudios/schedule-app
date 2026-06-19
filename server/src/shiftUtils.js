export const SLOTS = ['morning', 'evening', 'night'];

export const SLOT_LABELS = {
  morning: 'בוקר',
  evening: 'ערב',
  night: 'לילה',
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
