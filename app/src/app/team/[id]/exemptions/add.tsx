import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ChipGroup } from '@/components/ChipGroup';
import { AppText } from '@/components/AppText';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/id';
import { ExemptionType } from '@/types';
import { colors, radius, spacing } from '@/theme';

const TYPE_OPTIONS: { value: ExemptionType; label: string }[] = [
  { value: 'no_nights', label: '🚫 אסור לילה' },
  { value: 'unavailable', label: '🌴 לא זמין' },
  { value: 'sick', label: '🤒 מחלה' },
  { value: 'fixed_days', label: '📌 ימים קבועים' },
];

const WEEKDAY_OPTIONS = [
  { value: '0', label: 'א׳' },
  { value: '1', label: 'ב׳' },
  { value: '2', label: 'ג׳' },
  { value: '3', label: 'ד׳' },
  { value: '4', label: 'ה׳' },
  { value: '5', label: 'ו׳' },
  { value: '6', label: 'ש׳' },
];

export default function AddExemptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addExemption = useAppStore((s) => s.addExemption);

  const [type, setType] = useState<ExemptionType>('unavailable');
  const [permanent, setPermanent] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [days, setDays] = useState<string[]>([]);

  const needsRange = type === 'unavailable' || type === 'sick';
  const needsDays = type === 'fixed_days';
  const canSubmit =
    type === 'no_nights' ||
    (needsDays && days.length > 0) ||
    (needsRange && (permanent || (startDate.trim() && endDate.trim())));

  function handleSubmit() {
    if (!id || !canSubmit) return;
    addExemption({
      id: generateId('exemption'),
      memberId: id,
      type,
      permanent: type === 'no_nights' ? true : permanent,
      startDate: needsRange && !permanent ? startDate.trim() : undefined,
      endDate: needsRange && !permanent ? endDate.trim() : undefined,
      reason: reason.trim() || undefined,
      daysOfWeek: needsDays ? days.map(Number) : undefined,
    });
    router.back();
  }

  return (
    <Screen scroll>
      <ScreenHeader title="הוספת שחרור" />
      <View style={styles.form}>
        <ChipGroup options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as ExemptionType)} />

        {needsRange ? (
          <>
            <ChipGroup
              options={[
                { value: 'range', label: 'טווח תאריכים' },
                { value: 'permanent', label: 'קבוע' },
              ]}
              value={permanent ? 'permanent' : 'range'}
              onChange={(v) => setPermanent(v === 'permanent')}
            />
            {!permanent ? (
              <View style={styles.row}>
                <View style={styles.half}>
                  <TextField
                    label="מתאריך (YYYY-MM-DD)"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-08-18"
                  />
                </View>
                <View style={styles.half}>
                  <TextField
                    label="עד תאריך (YYYY-MM-DD)"
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-08-20"
                  />
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {needsDays ? (
          <View style={styles.weekdayRow}>
            {WEEKDAY_OPTIONS.map((opt) => {
              const selected = days.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() =>
                    setDays((prev) =>
                      prev.includes(opt.value) ? prev.filter((d) => d !== opt.value) : [...prev, opt.value]
                    )
                  }
                  style={[styles.weekdayChip, selected && styles.weekdayChipSelected]}>
                  <AppText variant="captionBold" style={{ color: selected ? colors.surface : colors.ink }}>
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextField
          label="סיבה (לא חובה)"
          value={reason}
          onChangeText={setReason}
          placeholder="לדוגמה: אילוץ רפואי"
          multiline
        />
      </View>
      <Button label="הוספת שחרור" onPress={handleSubmit} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = {
  form: { gap: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  weekdayRow: { flexDirection: 'row', gap: spacing.sm },
  weekdayChip: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipSelected: { backgroundColor: colors.ink },
} as const;
