import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { formatMonthLabel } from '@/utils/calendar';

export default function RequestPublishedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useAppStore((s) => s.requests.find((r) => r.id === id));
  const team = useAppStore((s) => s.team);
  const schedule = useAppStore((s) =>
    s.schedules.find((sc) => sc.id === request?.rebalance?.scheduleId)
  );

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.check}>
          <AppText variant="display2" style={{ color: colors.surface }}>
            ✓
          </AppText>
        </View>
        <AppText variant="display3" style={styles.title}>
          הסידור עודכן
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          {schedule ? `${formatMonthLabel(schedule.month)} מאוזן מחדש · ${team.length} אנשים` : ''}
        </AppText>
      </View>

      <View style={styles.notification}>
        <View style={styles.notificationTop}>
          <View style={styles.notificationBrand}>
            <View style={styles.notificationIcon}>
              <AppText variant="caption" style={{ color: colors.surface }}>
                ◧
              </AppText>
            </View>
            <AppText variant="captionBold">ShiftMind</AppText>
          </View>
          <AppText variant="micro">עכשיו</AppText>
        </View>
        <AppText variant="bodyBold">הסידור שלך עודכן</AppText>
        <AppText variant="caption">בקשתך אושרה והמשמרות אוזנו מחדש — הקש לצפייה.</AppText>
      </View>

      <AppText variant="micro" style={styles.hint}>
        ↑ ניתן גם לייצא ולשמור בהיסטוריה
      </AppText>

      <Button label="חזרה לסידור" onPress={() => router.replace('/')} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.xxl },
  check: {
    width: 78,
    height: 78,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.lg },
  subtitle: { marginTop: 2 },
  notification: {
    marginTop: spacing.xxl,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 2,
  },
  notificationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { textAlign: 'center', marginTop: spacing.md },
  button: { marginTop: 'auto' },
});
