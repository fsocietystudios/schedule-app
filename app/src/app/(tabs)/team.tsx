import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { Role } from '@/types';

const ROLE_LABELS: Record<Role, string> = {
  owner: 'בעלים',
  manager: 'מנהל',
  employee: 'עובד',
};

export default function TeamScreen() {
  const team = useAppStore((s) => s.team);
  const exemptions = useAppStore((s) => s.exemptions);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <AppText variant="display2">צוות</AppText>
          <AppText variant="caption">{team.length} אנשים</AppText>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/team/add')}>
          <AppText variant="title" style={{ color: colors.surface }}>
            +
          </AppText>
        </Pressable>
      </View>

      {team.length === 0 ? (
        <AppText variant="body" style={styles.empty}>
          עדיין אין אנשי צוות. הוסיפו את האדם הראשון בלחיצה על +.
        </AppText>
      ) : (
        <View style={styles.list}>
          {team.map((member) => {
            const activeExemptions = exemptions.filter((e) => e.memberId === member.id).length;
            return (
              <Pressable
                key={member.id}
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/team/[id]/exemptions', params: { id: member.id } })
                }>
                <View style={styles.avatar} />
                <View style={styles.rowInfo}>
                  <AppText variant="bodyBold">{member.name}</AppText>
                  <AppText variant="caption">
                    {member.jobTitle ?? '—'}
                    {activeExemptions > 0 ? ` · ${activeExemptions} שחרורים` : ''}
                  </AppText>
                </View>
                <Badge label={ROLE_LABELS[member.role]} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderSoft,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surfaceMuted,
  },
  rowInfo: { flex: 1, gap: 2 },
});
