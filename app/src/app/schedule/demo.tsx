import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { DraftBanner } from '@/components/DraftBanner';
import { Stepper } from '@/components/Stepper';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine } from '@/ai';
import { generateId } from '@/utils/id';
import { currentMonthKey } from '@/utils/calendar';
import { spacing } from '@/theme';
import { TeamMember } from '@/types';

const DEMO_NAMES = [
  'נועה', 'איתי', 'דנה', 'עומר', 'שירה', 'יואב', 'טל', 'רותם',
  'גיא', 'ליה', 'אדם', 'מאיה', 'אורי', 'הילה', 'נתן', 'ענבר',
  'דור', 'יעל', 'רון', 'אביב', 'שחר', 'נועם', 'אלה', 'ניצן',
  'תומר', 'אור', 'גל', 'קרן', 'עידן', 'מירב',
];

function buildDemoTeam(count: number): TeamMember[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('demo'),
    name: `${DEMO_NAMES[i % DEMO_NAMES.length]} (דמו)`,
    role: 'employee' as const,
    createdAt: new Date().toISOString(),
  }));
}

const DEMO_MONTH = currentMonthKey();

export default function DemoScheduleScreen() {
  const demoSchedule = useAppStore((s) => s.schedules.find((sc) => sc.status === 'demo'));
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);
  const removeSchedule = useAppStore((s) => s.removeSchedule);
  const minCoveragePerShift = useAppStore((s) => s.settings.minCoveragePerShift);

  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);

  async function regenerate(employeeCount: number) {
    setBusy(true);
    try {
      const team = buildDemoTeam(employeeCount);
      const output = await getAiEngine().generateSchedule({
        month: DEMO_MONTH,
        team,
        exemptions: [],
        history: [],
        minCoveragePerShift,
        isDemo: true,
      });
      if (demoSchedule) removeSchedule(demoSchedule.id);
      upsertSchedule({
        id: generateId('schedule'),
        month: DEMO_MONTH,
        status: 'demo',
        shifts: output.shifts,
        fairness: output.fairness,
        isDemo: true,
        demoMemberIds: team.map((m) => m.id),
        createdAt: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!demoSchedule) regenerate(count);
  }, []);

  const markedDates: Record<string, 'filled' | 'draft'> = {};
  demoSchedule?.shifts.forEach((shift) => {
    if (shift.memberIds.length > 0) markedDates[shift.date] = 'draft';
  });

  function handleExit() {
    if (demoSchedule) removeSchedule(demoSchedule.id);
    router.back();
  }

  return (
    <Screen scroll>
      <DraftBanner badge="דמו" text="נתונים לדוגמה · לא משפיע על אף אחד" />
      <AppText variant="display3">דמו סידור</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        עובדים אוטומטיים
      </AppText>

      <View style={styles.stepperWrap}>
        <Stepper
          label="עובדים"
          value={count}
          min={1}
          max={30}
          onChange={(v) => {
            setCount(v);
            regenerate(v);
          }}
        />
      </View>

      <MonthCalendar month={DEMO_MONTH} markedDates={markedDates} />

      <View style={styles.actions}>
        <Button
          label="↻ יצירה מחדש"
          variant="outline"
          onPress={() => regenerate(count)}
          disabled={busy}
          style={styles.actionBtn}
        />
        <Button label="יציאה מהדמו" variant="danger" onPress={handleExit} style={styles.actionBtnWide} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 2, marginBottom: spacing.md },
  stepperWrap: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.1 },
});
