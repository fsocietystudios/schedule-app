import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { ShiftRequest } from '@/types';
import { formatDateShort } from '@/utils/calendar';

const STATUS_BADGE: Record<ShiftRequest['status'], { label: string; tone: 'amber' | 'green' | 'red' }> = {
  pending: { label: 'ממתין', tone: 'amber' },
  approved: { label: 'אושר', tone: 'green' },
  rejected: { label: 'נדחה', tone: 'red' },
};

export default function RequestsScreen() {
  const requests = useAppStore((s) => s.requests);
  const team = useAppStore((s) => s.team);
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function nameOf(memberId: string) {
    return team.find((m) => m.id === memberId)?.name ?? '—';
  }

  function openRequest(request: ShiftRequest) {
    if (request.status === 'approved') {
      router.push({ pathname: '/requests/[id]/rebalance', params: { id: request.id } });
    } else {
      router.push({ pathname: '/requests/[id]/feedback', params: { id: request.id } });
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title="בקשות" subtitle="היעדרות והחלפות · משוב AI ואיזון הוגן" />

      <Button label="+ בקשה חדשה" onPress={() => router.push('/requests/new')} style={styles.addButton} />

      <View style={styles.list}>
        {sorted.map((r) => {
          const badge = STATUS_BADGE[r.status];
          return (
            <Pressable key={r.id} style={styles.card} onPress={() => openRequest(r)}>
              <View style={styles.cardTop}>
                <Badge label={r.type === 'absence' ? 'היעדרות' : 'החלפה'} />
                <Badge label={badge.label} tone={badge.tone} />
              </View>
              <AppText variant="bodyBold">{nameOf(r.memberId)}</AppText>
              <AppText variant="caption">
                {r.type === 'absence'
                  ? `${formatDateShort(r.startDate)} – ${formatDateShort(r.endDate)}`
                  : `${formatDateShort(r.swapDate ?? r.startDate)} · עם ${nameOf(r.swapWithMemberId ?? '')}`}
              </AppText>
            </Pressable>
          );
        })}

        {sorted.length === 0 ? (
          <AppText variant="body" style={styles.empty}>
            אין עדיין בקשות. אפשר לפתוח בקשת היעדרות או החלפה חדשה.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: { marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  card: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
