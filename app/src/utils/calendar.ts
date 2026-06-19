export const HEBREW_DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export const HEBREW_MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

export interface MonthGridCell {
  date: string | null;
  day: number | null;
}

export function parseMonthKey(month: string): { year: number; monthIndex0: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, monthIndex0: m - 1 };
}

export function formatMonthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(month: string): string {
  const { year, monthIndex0 } = parseMonthKey(month);
  return `${HEBREW_MONTH_NAMES[monthIndex0]} ${year}`;
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex0 } = parseMonthKey(month);
  const total = year * 12 + monthIndex0 + delta;
  return formatMonthKey(Math.floor(total / 12), ((total % 12) + 12) % 12);
}

export function currentMonthKey(): string {
  const now = new Date();
  return formatMonthKey(now.getFullYear(), now.getMonth());
}

export function getMonthGrid(month: string): MonthGridCell[] {
  const { year, monthIndex0 } = parseMonthKey(month);
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex0, 1).getDay();

  const cells: MonthGridCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: `${month}-${String(day).padStart(2, '0')}`, day });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

export function daysInMonthKey(month: string): number {
  const { year, monthIndex0 } = parseMonthKey(month);
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export const HEBREW_MONTH_ABBR = [
  'ינו׳',
  'פבר׳',
  'מרץ',
  'אפר׳',
  'מאי',
  'יוני',
  'יולי',
  'אוג׳',
  'ספט׳',
  'אוק׳',
  'נוב׳',
  'דצמ׳',
];

export function formatDateShort(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ב${HEBREW_MONTH_ABBR[m - 1]}`;
}
