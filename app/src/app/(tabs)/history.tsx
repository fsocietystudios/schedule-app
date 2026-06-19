import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { AiNote } from '@/components/AiNote';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { formatMonthLabel } from '@/utils/calendar';

export default function HistoryScreen() {
  const history = useAppStore((s) => s.history);
  const removeHistoryMonth = useAppStore((s) => s.removeHistoryMonth);
  const sorted = [...history].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <Screen scroll>
      <AppText variant="display2">היסטוריית סידורים</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        בסיס לאיזון הוגן בעתיד
      </AppText>

      <View style={styles.list}>
        {sorted.map((h) => (
          <Pressable
            key={h.id}
            style={styles.card}
            onLongPress={() => removeHistoryMonth(h.id)}>
            <View style={styles.cardInfo}>
              <AppText variant="bodyBold">{formatMonthLabel(h.month)}</AppText>
              <AppText variant="caption">
                {h.totalShifts} משמרות · {h.peopleCount} אנשים
              </AppText>
            </View>
            <Badge label={h.source === 'imported' ? 'נטען' : 'נוצר'} tone="green" />
          </Pressable>
        ))}

        {sorted.length === 0 ? (
          <AppText variant="body" style={styles.empty}>
            אין עדיין היסטוריה. אפשר להזין חודשים שקדמו לאפליקציה.
          </AppText>
        ) : null}
      </View>

      <AiNote
        message="נספרו משמרות לכל אדם — כדי שהסידור הבא יפזר עומס באופן הוגן."
        tone="green"
      />

      <Button
        label="+ הוספת חודש ידני"
        variant="outline"
        onPress={() => router.push('/history/add')}
        style={styles.addButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 2, marginBottom: spacing.lg },
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cardInfo: { flex: 1, gap: 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  addButton: { marginTop: spacing.md },
});
