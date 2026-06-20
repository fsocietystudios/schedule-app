import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { DraftBanner } from '@/components/DraftBanner';
import { Stepper } from '@/components/Stepper';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ShiftDayCard } from '@/components/ShiftDayCard';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine } from '@/ai';
import { generateId } from '@/utils/id';
import { currentMonthKey, isWeekend } from '@/utils/calendar';
import { spacing } from '@/theme';
import { Shift, TeamMember } from '@/types';
import { groupShiftsByDate } from '@/utils/shift';

const DEMO_NAMES = [
  'נועה', 'איתי', 'דנה', 'עומר', 'שירה', 'יואב', 'טל', 'רותם',
  'גיא', 'ליה', 'אדם', 'מאיה', 'אורי', 'הילה', 'נתן', 'ענבר',
  'דור', 'יעל', 'רון', 'אביב', 'שחר', 'נועם', 'אלה', 'ניצן',
  'תומר', 'אור', 'גל', 'קרן', 'עידן', 'מירב',
];

function buildDemoTeam(managerCount: number, employeeCount: number): TeamMember[] {
  const managers = Array.from({ length: managerCount }, (_, i) => ({
    id: generateId('demo'),
    name: `${DEMO_NAMES[i % DEMO_NAMES.length]} (דמו, מנהל)`,
    role: 'manager' as const,
    createdAt: new Date().toISOString(),
  }));
  const employees = Array.from({ length: employeeCount }, (_, i) => ({
    id: generateId('demo'),
    name: `${DEMO_NAMES[(managerCount + i) % DEMO_NAMES.length]} (דמו)`,
    role: 'employee' as const,
    createdAt: new Date().toISOString(),
  }));
  return [...managers, ...employees];
}

const DEMO_MONTH = currentMonthKey();

export default function DemoScheduleScreen() {
  const demoSchedule = useAppStore((s) => s.schedules.find((sc) => sc.status === 'demo'));
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);
  const removeSchedule = useAppStore((s) => s.removeSchedule);

  const [managerCount, setManagerCount] = useState(2);
  const [employeeCount, setEmployeeCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [demoTeam, setDemoTeam] = useState<TeamMember[]>([]);

  async function regenerate(nextManagerCount: number, nextEmployeeCount: number) {
    setBusy(true);
    try {
      const team = buildDemoTeam(nextManagerCount, nextEmployeeCount);
      const output = await getAiEngine().generateSchedule({
        month: DEMO_MONTH,
        team,
        exemptions: [],
        history: [],
        isDemo: true,
      });
      if (demoSchedule) removeSchedule(demoSchedule.id);
      setDemoTeam(team);
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
    if (!demoSchedule) regenerate(managerCount, employeeCount);
  }, []);

  const markedDates: Record<string, 'filled' | 'draft'> = {};
  demoSchedule?.shifts.forEach((shift) => {
    if (shift.assignments.length > 0) markedDates[shift.date] = 'draft';
  });

  const byDate = useMemo(
    () => (demoSchedule ? groupShiftsByDate(demoSchedule.shifts) : new Map<string, { day?: Shift; night?: Shift }>()),
    [demoSchedule]
  );

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
          label="מנהלים"
          value={managerCount}
          min={1}
          max={5}
          onChange={(v) => {
            setManagerCount(v);
            regenerate(v, employeeCount);
          }}
        />
        <Stepper
          label="עובדים"
          value={employeeCount}
          min={2}
          max={30}
          onChange={(v) => {
            setEmployeeCount(v);
            regenerate(managerCount, v);
          }}
        />
      </View>

      <MonthCalendar month={DEMO_MONTH} markedDates={markedDates} />

      <View style={styles.dayList}>
        {[...byDate.entries()].map(([date, slots]) => (
          <ShiftDayCard
            key={date}
            date={date}
            day={slots.day}
            night={slots.night}
            team={demoTeam}
            weekend={isWeekend(date)}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label="↻ יצירה מחדש"
          variant="outline"
          onPress={() => regenerate(managerCount, employeeCount)}
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
  stepperWrap: { gap: spacing.sm, marginBottom: spacing.md },
  dayList: { gap: spacing.sm, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.1 },
});
