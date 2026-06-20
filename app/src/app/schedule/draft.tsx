import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DraftBanner } from '@/components/DraftBanner';
import { LoadBar } from '@/components/LoadBar';
import { AiNote } from '@/components/AiNote';
import { ShiftDayCard } from '@/components/ShiftDayCard';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine } from '@/ai';
import { colors, spacing } from '@/theme';
import { formatMonthLabel, isWeekend } from '@/utils/calendar';
import { groupShiftsByDate, scheduleToHistoryMonth } from '@/utils/shift';
import { Shift } from '@/types';

export default function DraftScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const schedule = useAppStore((s) => s.schedules.find((sc) => sc.id === id));
  const team = useAppStore((s) => s.team);
  const exemptions = useAppStore((s) => s.exemptions);
  const history = useAppStore((s) => s.history);
  const schedules = useAppStore((s) => s.schedules);
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);
  const removeSchedule = useAppStore((s) => s.removeSchedule);
  const [regenerating, setRegenerating] = useState(false);

  const byDate = useMemo(
    () => (schedule ? groupShiftsByDate(schedule.shifts) : new Map<string, { day?: Shift; night?: Shift }>()),
    [schedule]
  );

  if (!schedule) {
    return (
      <Screen>
        <AppText variant="body">הסידור לא נמצא.</AppText>
      </Screen>
    );
  }

  const maxCount = Math.max(1, ...schedule.fairness.map((f) => f.counts.total));
  const maxGap =
    schedule.fairness.length > 1
      ? Math.max(...schedule.fairness.map((f) => f.counts.total)) -
        Math.min(...schedule.fairness.map((f) => f.counts.total))
      : 0;

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const combinedHistory = [
        ...history,
        ...schedules
          .filter((sc) => sc.status === 'published' && sc.month !== schedule!.month)
          .map((sc) => scheduleToHistoryMonth(sc, team)),
      ];
      const output = await getAiEngine().generateSchedule({
        month: schedule!.month,
        team,
        exemptions,
        history: combinedHistory,
      });
      upsertSchedule({ ...schedule!, shifts: output.shifts, fairness: output.fairness });
    } finally {
      setRegenerating(false);
    }
  }

  function handleDelete() {
    removeSchedule(schedule!.id);
    router.back();
  }

  function handlePublish() {
    upsertSchedule({ ...schedule!, status: 'published', publishedAt: new Date().toISOString() });
    router.replace('/');
  }

  return (
    <Screen scroll>
      <DraftBanner badge="טיוטה" text={`${formatMonthLabel(schedule.month)} · מוסתר מהצוות`} />

      <AppText variant="display3">סידור משמרות</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        יום: מנהל + עובד · לילה: 2 עובדים + כונן
      </AppText>

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

      <AppText variant="display3">איזון עומס</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        משמרות לאדם · כולל היסטוריה
      </AppText>

      <View style={styles.fairnessList}>
        {schedule.fairness.map((f) => (
          <View key={f.memberId} style={styles.fairnessRow}>
            <AppText variant="captionBold" style={styles.fairnessName}>
              {f.name}
            </AppText>
            <View style={styles.barWrap}>
              <LoadBar pct={Math.round((f.counts.total / maxCount) * 100)} />
            </View>
            <AppText variant="captionBold" style={styles.fairnessCount}>
              {f.counts.total}
            </AppText>
          </View>
        ))}
      </View>

      <AiNote tone="green" message={`פער מקס׳ ±${maxGap} משמרת — חלוקה הוגנת ✓`} />

      <View style={styles.actions}>
        <Button label="מחיקה" variant="danger" onPress={handleDelete} style={styles.actionBtn} />
        <Button
          label={regenerating ? '…' : '↻ עריכה'}
          variant="outline"
          onPress={handleRegenerate}
          disabled={regenerating}
          style={styles.actionBtn}
        />
        <Button label="פרסום" onPress={handlePublish} style={styles.actionBtnWide} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 2, marginBottom: spacing.md },
  dayList: { gap: spacing.sm, marginBottom: spacing.xl },
  fairnessList: { gap: spacing.sm, marginBottom: spacing.md },
  fairnessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fairnessName: { width: 64 },
  barWrap: { flex: 1 },
  fairnessCount: { width: 24, textAlign: 'left' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.2 },
});
