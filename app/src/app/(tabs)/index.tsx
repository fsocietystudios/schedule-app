import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { MonthCalendar } from '@/components/MonthCalendar';
import { DraftBanner } from '@/components/DraftBanner';
import { ShiftDayCard } from '@/components/ShiftDayCard';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { currentMonthKey, formatMonthLabel, isWeekend, shiftMonth } from '@/utils/calendar';
import { groupShiftsByDate } from '@/utils/shift';
import { Shift } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  published: 'פורסם',
};

export default function ScheduleHomeScreen() {
  const schedules = useAppStore((s) => s.schedules);
  const requests = useAppStore((s) => s.requests);
  const realSchedules = useMemo(() => schedules.filter((s) => s.status !== 'demo'), [schedules]);

  const latest = useMemo(
    () => [...realSchedules].sort((a, b) => b.month.localeCompare(a.month))[0],
    [realSchedules]
  );

  const [viewedMonth, setViewedMonth] = useState(latest?.month ?? currentMonthKey());
  const viewedSchedule = realSchedules.find((s) => s.month === viewedMonth);
  const team = useAppStore((s) => s.team);

  const targetMonth = latest ? shiftMonth(latest.month, 1) : currentMonthKey();
  const targetDraft = realSchedules.find((s) => s.month === targetMonth && s.status === 'draft');

  const markedDates: Record<string, 'filled' | 'draft'> = {};
  if (viewedSchedule) {
    viewedSchedule.shifts.forEach((shift) => {
      if (shift.assignments.length > 0) {
        markedDates[shift.date] = viewedSchedule.status === 'published' ? 'filled' : 'draft';
      }
    });
  }

  const byDate = useMemo(
    () => (viewedSchedule ? groupShiftsByDate(viewedSchedule.shifts) : new Map<string, { day?: Shift; night?: Shift }>()),
    [viewedSchedule]
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const hasPublished = realSchedules.some((s) => s.status === 'published');

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <AppText variant="display2">סידור</AppText>
          <AppText variant="caption">
            {formatMonthLabel(viewedMonth)}
            {viewedSchedule ? ` · ${STATUS_LABELS[viewedSchedule.status]}` : ''}
          </AppText>
        </View>
        <Pressable style={styles.avatar} onPress={() => router.push('/settings')} />
      </View>

      <View style={styles.monthNav}>
        <Pressable onPress={() => setViewedMonth((m) => shiftMonth(m, -1))} hitSlop={8}>
          <AppText variant="title">›</AppText>
        </Pressable>
        <AppText variant="bodyBold">{formatMonthLabel(viewedMonth)}</AppText>
        <Pressable onPress={() => setViewedMonth((m) => shiftMonth(m, 1))} hitSlop={8}>
          <AppText variant="title">‹</AppText>
        </Pressable>
      </View>

      <MonthCalendar month={viewedMonth} markedDates={markedDates} />

      {!viewedSchedule ? (
        <AppText variant="caption" style={styles.emptyMonth}>
          לא נוצר סידור לחודש זה.
        </AppText>
      ) : (
        <View style={styles.dayList}>
          {[...byDate.entries()].map(([date, slots]) => (
            <ShiftDayCard
              key={date}
              date={date}
              day={slots.day}
              night={slots.night}
              team={team}
              weekend={isWeekend(date)}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {targetDraft ? (
          <DraftBanner badge="טיוטה" text={`${formatMonthLabel(targetMonth)} ממתינה לבדיקה ולפרסום`} />
        ) : null}

        <Button
          label={targetDraft ? `↻ המשך טיוטת ${formatMonthLabel(targetMonth)}` : `⚡ יצירת ${formatMonthLabel(targetMonth)}`}
          onPress={() =>
            targetDraft
              ? router.push({ pathname: '/schedule/draft', params: { id: targetDraft.id } })
              : router.push({ pathname: '/schedule/generate', params: { month: targetMonth } })
          }
        />
        <Button label="▦ דמו עם נתונים לדוגמה" variant="outline" onPress={() => router.push('/schedule/demo')} />

        {hasPublished ? (
          <Button
            label={pendingRequests > 0 ? `ניהול בקשות (${pendingRequests})` : 'ניהול בקשות'}
            variant="outline"
            onPress={() => router.push('/requests')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surfaceMuted,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emptyMonth: { textAlign: 'center', marginTop: spacing.sm },
  dayList: { gap: spacing.sm, marginTop: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
