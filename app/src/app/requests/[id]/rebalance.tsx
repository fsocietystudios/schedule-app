import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LoadBar } from '@/components/LoadBar';
import { AiNote } from '@/components/AiNote';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

export default function RebalanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useAppStore((s) => s.requests.find((r) => r.id === id));
  const schedule = useAppStore((s) =>
    s.schedules.find((sc) => sc.id === request?.rebalance?.scheduleId)
  );
  const upsertSchedule = useAppStore((s) => s.upsertSchedule);

  if (!request || !request.rebalance) {
    return (
      <Screen>
        <AppText variant="body">לא נמצא מידע על האיזון.</AppText>
      </Screen>
    );
  }

  const { rebalance } = request;

  function handlePublish() {
    if (!schedule) return;
    upsertSchedule({ ...schedule, publishedAt: new Date().toISOString() });
    router.replace({ pathname: '/requests/[id]/published', params: { id: request!.id } });
  }

  return (
    <Screen scroll>
      <AppText variant="display3" style={{ color: colors.greenText }}>
        איזון מחדש
      </AppText>
      <AppText variant="caption" style={styles.subtitle}>
        הבקשה אושרה · הסידור עודכן
      </AppText>

      <AppText variant="micro" style={styles.sectionLabel}>
        עומס לאדם — לפני / אחרי
      </AppText>
      <View style={styles.loadList}>
        {rebalance.load.map((entry) => (
          <View key={entry.memberId}>
            <View style={styles.loadRow}>
              <AppText variant="captionBold">{entry.name}</AppText>
              <AppText variant="caption">
                {entry.before} → {entry.after}
              </AppText>
            </View>
            <LoadBar pct={entry.pct} targetPct={entry.targetPct} />
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <AiNote tone="green" message={rebalance.summary} />
      </View>

      <View style={styles.actions}>
        <Button
          label="תצוגת השינויים"
          variant="outline"
          onPress={() => router.push('/')}
          style={styles.actionBtn}
        />
        <Button label="פרסום העדכון" onPress={handlePublish} disabled={!schedule} style={styles.actionBtnWide} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 2, marginBottom: spacing.lg },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.sm, textTransform: 'uppercase' },
  loadList: { gap: spacing.md, marginBottom: spacing.lg },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  note: { marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.3 },
});
