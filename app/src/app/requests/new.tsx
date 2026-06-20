import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ChipGroup } from '@/components/ChipGroup';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { AppText } from '@/components/AppText';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine } from '@/ai';
import { generateId } from '@/utils/id';
import { spacing } from '@/theme';
import { AbsenceType, RequestType, ShiftSlot } from '@/types';
import { daysInMonthKey, formatDateShort } from '@/utils/calendar';
import { shiftHasMember, SLOT_LABELS } from '@/utils/shift';

const TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: 'absence', label: '🌴 היעדרות' },
  { value: 'swap', label: '⇄ החלפה' },
];

const ABSENCE_TYPE_OPTIONS: { value: AbsenceType; label: string }[] = [
  { value: 'vacation', label: 'חופשה' },
  { value: 'sick', label: 'מחלה' },
  { value: 'personal', label: 'אישי' },
  { value: 'other', label: 'אחר' },
];

export default function NewRequestScreen() {
  const team = useAppStore((s) => s.team);
  const exemptions = useAppStore((s) => s.exemptions);
  const history = useAppStore((s) => s.history);
  const schedules = useAppStore((s) => s.schedules);
  const addRequest = useAppStore((s) => s.addRequest);
  const updateRequest = useAppStore((s) => s.updateRequest);

  const activeSchedule = useMemo(
    () =>
      [...schedules]
        .filter((s) => s.status === 'published')
        .sort((a, b) => b.month.localeCompare(a.month))[0],
    [schedules]
  );

  const [type, setType] = useState<RequestType>('absence');
  const [memberId, setMemberId] = useState<string | undefined>(team[0]?.id);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [absenceType, setAbsenceType] = useState<AbsenceType>('vacation');
  const [reason, setReason] = useState('');
  const [ownShiftKey, setOwnShiftKey] = useState<string | undefined>();
  const [partnerId, setPartnerId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const dayOptions = useMemo(() => {
    if (!activeSchedule) return [];
    const days = daysInMonthKey(activeSchedule.month);
    return Array.from({ length: days }, (_, i) => {
      const date = `${activeSchedule.month}-${String(i + 1).padStart(2, '0')}`;
      return { value: date, label: formatDateShort(date) };
    });
  }, [activeSchedule]);

  const ownShiftOptions = useMemo(() => {
    if (!activeSchedule || !memberId) return [];
    return activeSchedule.shifts
      .filter((s) => shiftHasMember(s, memberId))
      .map((s) => ({
        value: `${s.date}_${s.slot}`,
        label: `${formatDateShort(s.date)} · ${SLOT_LABELS[s.slot]}`,
      }));
  }, [activeSchedule, memberId]);

  const partnerOptions = useMemo(() => {
    const myRole = team.find((m) => m.id === memberId)?.role;
    return team
      .filter((m) => m.id !== memberId && m.role === myRole)
      .map((m) => ({ value: m.id, label: m.name }));
  }, [team, memberId]);

  const canSubmit =
    !!activeSchedule &&
    !!memberId &&
    (type === 'absence' ? !!startDate && !!endDate : !!ownShiftKey && !!partnerId);

  async function handleSubmit() {
    if (!canSubmit || !activeSchedule || !memberId) return;
    setSubmitting(true);
    try {
      const [swapDate, swapSlot] = (ownShiftKey ?? '').split('_') as [string, ShiftSlot];
      const request = {
        id: generateId('request'),
        type,
        memberId,
        startDate: type === 'absence' ? startDate! : swapDate,
        endDate: type === 'absence' ? endDate! : swapDate,
        absenceType: type === 'absence' ? absenceType : undefined,
        reason: reason.trim() || undefined,
        swapWithMemberId: type === 'swap' ? partnerId : undefined,
        swapDate: type === 'swap' ? swapDate : undefined,
        swapSlot: type === 'swap' ? swapSlot : undefined,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      addRequest(request);
      const { feedback } = await getAiEngine().evaluateRequest({
        request,
        schedule: activeSchedule,
        team,
        exemptions,
        history,
      });
      updateRequest(request.id, { aiFeedback: feedback });
      router.replace({ pathname: '/requests/[id]/feedback', params: { id: request.id } });
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeSchedule) {
    return (
      <Screen>
        <ScreenHeader title="בקשה חדשה" onClose={() => router.back()} />
        <AppText variant="body">אין סידור מפורסם עדיין. יש לפרסם סידור לפני שליחת בקשות.</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader title="בקשה חדשה" onClose={() => router.back()} />
      <View style={styles.form}>
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />

        <View style={styles.field}>
          <AppText variant="captionBold" style={styles.label}>
            איש צוות
          </AppText>
          <ChipGroup
            options={team.map((m) => ({ value: m.id, label: m.name }))}
            value={memberId}
            onChange={setMemberId}
          />
        </View>

        {type === 'absence' ? (
          <>
            <View style={styles.field}>
              <AppText variant="captionBold" style={styles.label}>
                מתאריך
              </AppText>
              <ChipGroup options={dayOptions} value={startDate} onChange={setStartDate} />
            </View>
            <View style={styles.field}>
              <AppText variant="captionBold" style={styles.label}>
                עד תאריך
              </AppText>
              <ChipGroup options={dayOptions} value={endDate} onChange={setEndDate} />
            </View>
            <View style={styles.field}>
              <AppText variant="captionBold" style={styles.label}>
                סוג
              </AppText>
              <ChipGroup options={ABSENCE_TYPE_OPTIONS} value={absenceType} onChange={setAbsenceType} />
            </View>
            <TextField
              label="סיבה"
              value={reason}
              onChangeText={setReason}
              placeholder="חופשה משפחתית שתוכננה מראש…"
              multiline
            />
          </>
        ) : (
          <>
            <View style={styles.field}>
              <AppText variant="captionBold" style={styles.label}>
                המשמרת שלי להחלפה
              </AppText>
              {ownShiftOptions.length === 0 ? (
                <AppText variant="caption">לאיש הצוות הזה אין משמרות בסידור הנוכחי.</AppText>
              ) : (
                <ChipGroup options={ownShiftOptions} value={ownShiftKey} onChange={setOwnShiftKey} />
              )}
            </View>
            <View style={styles.field}>
              <AppText variant="captionBold" style={styles.label}>
                להחליף עם
              </AppText>
              <ChipGroup options={partnerOptions} value={partnerId} onChange={setPartnerId} />
            </View>
          </>
        )}
      </View>
      <Button
        label={submitting ? '…' : 'שליחת הבקשה'}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      />
    </Screen>
  );
}

const styles = {
  form: { gap: spacing.md, marginBottom: spacing.lg },
  field: { gap: spacing.xs },
  label: { marginBottom: 2 },
} as const;
