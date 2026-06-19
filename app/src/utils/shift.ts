import { Exemption, ShiftSlot } from '@/types';
import { weekdayOf } from './calendar';

export const SLOTS: ShiftSlot[] = ['morning', 'evening', 'night'];

export const SLOT_LABELS: Record<ShiftSlot, string> = {
  morning: 'בוקר',
  evening: 'ערב',
  night: 'לילה',
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
