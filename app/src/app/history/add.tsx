import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { Stepper } from '@/components/Stepper';
import { Button } from '@/components/Button';
import { AppText } from '@/components/AppText';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/id';
import { spacing } from '@/theme';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function AddHistoryMonthScreen() {
  const team = useAppStore((s) => s.team);
  const addHistoryMonth = useAppStore((s) => s.addHistoryMonth);

  const [month, setMonth] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(team.map((m) => [m.id, 0]))
  );

  const totalShifts = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const canSubmit = MONTH_PATTERN.test(month.trim()) && totalShifts > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    addHistoryMonth({
      id: generateId('history'),
      month: month.trim(),
      totalShifts,
      peopleCount: team.length,
      source: 'imported',
      perPersonCounts: Object.fromEntries(
        Object.entries(counts).map(([id, total]) => [id, { total, night: 0, weekend: 0, onCall: 0 }])
      ),
    });
    router.back();
  }

  return (
    <Screen scroll>
      <ScreenHeader title="הוספת חודש ידני" subtitle="הזינו כמה משמרות עבד כל אדם בחודש הזה" />
      <View style={styles.form}>
        <TextField label="חודש (YYYY-MM)" value={month} onChangeText={setMonth} placeholder="2026-05" />

        {team.length === 0 ? (
          <AppText variant="body" style={{ textAlign: 'center', marginTop: spacing.lg }}>
            אין אנשי צוות. הוסיפו אנשים לפני הזנת היסטוריה.
          </AppText>
        ) : (
          <View style={styles.steppers}>
            {team.map((m) => (
              <Stepper
                key={m.id}
                label={m.name}
                value={counts[m.id] ?? 0}
                min={0}
                max={31}
                onChange={(v) => setCounts((prev) => ({ ...prev, [m.id]: v }))}
              />
            ))}
          </View>
        )}
      </View>
      <Button label="שמירת החודש" onPress={handleSubmit} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = {
  form: { gap: spacing.md, marginBottom: spacing.lg },
  steppers: { gap: spacing.sm },
} as const;
