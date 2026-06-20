import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { AiNote } from '@/components/AiNote';
import { useAppStore } from '@/store/useAppStore';
import { getAiEngine } from '@/ai';
import { colors, radius, spacing } from '@/theme';
import { formatDateShort } from '@/utils/calendar';
import { ASSIGNMENT_ROLE_LABELS, SLOT_LABELS } from '@/utils/shift';
import { AbsenceType, RequestStatus } from '@/types';

const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'חופשה',
  sick: 'מחלה',
  personal: 'אישי',
  other: 'אחר',
};

const STATUS_BADGE: Record<RequestStatus, { label: string; tone: 'amber' | 'green' | 'red' }> = {
  pending: { label: 'ממתין', tone: 'amber' },
  approved: { label: 'אושר', tone: 'green' },
  rejected: { label: 'נדחה', tone: 'red' },
};

export default function RequestFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useAppStore((s) => s.requests.find((r) => r.id === id));
  const team = useAppStore((s) => s.team);
  const exemptions = useAppStore((s) => s.exemptions);
  const history = useAppStore((s) => s.history);
  const schedules = useAppStore((s) => s.schedules);
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);
  const updateRequest = useAppStore((s) => s.updateRequest);
  const [busy, setBusy] = useState(false);

  const schedule = [...schedules]
    .filter((sc) => sc.status === 'published')
    .sort((a, b) => b.month.localeCompare(a.month))[0];

  function nameOf(memberId?: string) {
    return team.find((m) => m.id === memberId)?.name ?? '—';
  }

  if (!request) {
    return (
      <Screen>
        <AppText variant="body">הבקשה לא נמצאה.</AppText>
      </Screen>
    );
  }

  async function handleApprove() {
    if (!schedule) return;
    setBusy(true);
    try {
      const { shifts, rebalance } = await getAiEngine().rebalance({
        request: request!,
        schedule,
        team,
        exemptions,
        history,
      });
      upsertSchedule({ ...schedule, shifts });
      updateRequest(request!.id, { status: 'approved', rebalance });
      router.replace({ pathname: '/requests/[id]/rebalance', params: { id: request!.id } });
    } finally {
      setBusy(false);
    }
  }

  function handleReject() {
    updateRequest(request!.id, { status: 'rejected' });
    router.replace('/requests');
  }

  const title =
    request.type === 'absence'
      ? `${nameOf(request.memberId)} · ${formatDateShort(request.startDate)}–${formatDateShort(request.endDate)}`
      : `${nameOf(request.memberId)} · ${formatDateShort(request.swapDate ?? request.startDate)} · ${
          request.swapSlot ? SLOT_LABELS[request.swapSlot] : ''
        }`;

  const subtitle =
    request.type === 'absence'
      ? `${request.absenceType ? ABSENCE_TYPE_LABELS[request.absenceType] : ''}${
          request.reason ? ` — “${request.reason}”` : ''
        }`
      : `החלפה עם ${nameOf(request.swapWithMemberId)}`;

  const feedback = request.aiFeedback;
  const statusBadge = STATUS_BADGE[request.status];

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
        <AppText variant="bodyMedium" style={{ color: colors.textMuted }}>
          › בקשות
        </AppText>
      </Pressable>

      <Badge label={request.type === 'absence' ? 'היעדרות' : 'החלפה'} />
      <AppText variant="display3" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.subtitle}>
        {subtitle}
      </AppText>

      {feedback ? (
        <View style={styles.section}>
          <AppText variant="micro" style={styles.sectionLabel}>
            משוב ה-AI
          </AppText>
          <View style={styles.impactList}>
            {feedback.impacts.map((impact) => (
              <View
                key={`${impact.date}_${impact.slot}`}
                style={[
                  styles.impactRow,
                  { borderColor: impact.ok ? colors.green : colors.red, backgroundColor: impact.ok ? colors.greenBg : colors.redBg },
                ]}>
                <AppText variant="caption" style={{ color: impact.ok ? colors.greenText : colors.redText }}>
                  {formatDateShort(impact.date)} · {SLOT_LABELS[impact.slot]} · {ASSIGNMENT_ROLE_LABELS[impact.role]}
                </AppText>
                <AppText variant="captionBold" style={{ color: impact.ok ? colors.greenText : colors.redText }}>
                  {impact.ok ? `תקין ${impact.covered}/${impact.required}` : `⚠ ${impact.covered}/${impact.required}`}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {feedback ? (
        <View style={styles.note}>
          <AiNote tone={feedback.recommendApprove ? 'green' : 'red'} message={feedback.suggestion} />
        </View>
      ) : null}

      {request.status === 'pending' ? (
        <View style={styles.actions}>
          <Button label="דחייה" variant="danger" onPress={handleReject} disabled={busy} style={styles.actionBtn} />
          <Button
            label={busy ? '…' : 'אישור + איזון'}
            onPress={handleApprove}
            disabled={busy || !schedule}
            style={styles.actionBtnWide}
          />
        </View>
      ) : (
        <View style={styles.statusWrap}>
          <Badge label={statusBadge.label} tone={statusBadge.tone} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { marginBottom: spacing.md },
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: 2, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.sm, textTransform: 'uppercase' },
  impactList: { gap: spacing.sm },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  note: { marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.4 },
  statusWrap: { marginTop: spacing.md, alignItems: 'flex-start' },
});
