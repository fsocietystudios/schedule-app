import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine, GenerateScheduleOutput, GenerateStep } from '@/ai';
import { generateId } from '@/utils/id';
import { colors, radius, spacing } from '@/theme';
import { formatMonthLabel } from '@/utils/calendar';
import { scheduleToHistoryMonth } from '@/utils/shift';

export default function GenerateScheduleScreen() {
  const { month } = useLocalSearchParams<{ month: string }>();
  const team = useAppStore((s) => s.team);
  const exemptions = useAppStore((s) => s.exemptions);
  const history = useAppStore((s) => s.history);
  const schedules = useAppStore((s) => s.schedules);
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);

  const combinedHistory = useMemo(
    () => [
      ...history,
      ...schedules
        .filter((sc) => sc.status === 'published' && sc.month !== month)
        .map((sc) => scheduleToHistoryMonth(sc, team)),
    ],
    [history, schedules, team, month]
  );

  const [steps, setSteps] = useState<GenerateStep[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    let result: GenerateScheduleOutput | null = null;

    async function run() {
      try {
        const output = await getAiEngine().generateSchedule({
          month,
          team,
          exemptions,
          history: combinedHistory,
        });
        if (cancelled.current) return;
        result = output;
        setSteps(output.steps);
        for (let i = 0; i < output.steps.length; i++) {
          await new Promise((r) => setTimeout(r, 450));
          if (cancelled.current) return;
          setDoneCount(i + 1);
        }
        await new Promise((r) => setTimeout(r, 350));
        if (cancelled.current || !result) return;
        const schedule = {
          id: generateId('schedule'),
          month,
          status: 'draft' as const,
          shifts: result.shifts,
          fairness: result.fairness,
          createdAt: new Date().toISOString(),
        };
        upsertSchedule(schedule);
        router.replace({ pathname: '/schedule/draft', params: { id: schedule.id } });
      } catch (e) {
        if (!cancelled.current) setError(e instanceof Error ? e.message : 'שגיאה ביצירת הסידור');
      }
    }

    run();
    return () => {
      cancelled.current = true;
    };
  }, [month]);

  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.cancel}>
        <AppText variant="bodyMedium" style={{ color: colors.textMuted }}>
          ✕ ביטול
        </AppText>
      </Pressable>

      <View style={styles.center}>
        <View style={styles.badge}>
          <AppText variant="display3" style={{ color: colors.amber }}>
            AI
          </AppText>
        </View>
        <AppText variant="display3">בונה את {formatMonthLabel(month)}…</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          מסדר משמרות ל-{team.length} אנשים
        </AppText>
        <View style={styles.progressWrap}>
          <ProgressBar pct={pct} />
          <AppText variant="micro" style={styles.pct}>
            {pct}%
          </AppText>
        </View>
      </View>

      <View style={styles.steps}>
        {steps.map((step, i) => (
          <View key={step.label} style={styles.stepRow}>
            <View style={[styles.stepDot, i < doneCount ? styles.stepDotDone : styles.stepDotPending]}>
              {i < doneCount ? (
                <AppText variant="caption" style={{ color: colors.surface }}>
                  ✓
                </AppText>
              ) : null}
            </View>
            <AppText variant="body">{step.label}</AppText>
          </View>
        ))}
      </View>

      {error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="caption" style={styles.footer}>
        הטיוטה נשארת פרטית עד הפרסום
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cancel: { marginBottom: spacing.lg },
  center: { alignItems: 'center', gap: 4 },
  badge: {
    width: 92,
    height: 92,
    borderRadius: radius.pill,
    borderWidth: 5,
    borderColor: colors.amber,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subtitle: { marginBottom: spacing.sm },
  progressWrap: { width: '100%', marginTop: spacing.md, gap: 4 },
  pct: { alignSelf: 'flex-start' },
  steps: { gap: spacing.md, marginTop: spacing.xl },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepDot: { width: 22, height: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: colors.ink },
  stepDotPending: { borderWidth: 2.5, borderColor: colors.amber, borderStyle: 'dashed' },
  error: { color: colors.red, marginTop: spacing.lg, textAlign: 'center' },
  footer: { marginTop: 'auto', textAlign: 'center', paddingTop: spacing.xl },
});
