import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';
import { AssignmentRole, Shift, TeamMember } from '@/types';
import { ASSIGNMENT_ROLE_LABELS, ROLE_REQUIRED, SLOT_LABELS, SLOT_TIME_LABELS } from '@/utils/shift';
import { formatDateShort, weekdayOf } from '@/utils/calendar';

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function namesForRole(shift: Shift | undefined, role: AssignmentRole, team: TeamMember[]): string[] {
  if (!shift) return [];
  return shift.assignments
    .filter((a) => a.role === role)
    .map((a) => team.find((m) => m.id === a.memberId)?.name ?? '—');
}

function RoleSlot({ role, names, required }: { role: AssignmentRole; names: string[]; required: number }) {
  const missing = Math.max(0, required - names.length);
  return (
    <View style={styles.roleSlot}>
      <AppText variant="caption" style={styles.roleLabel}>
        {ASSIGNMENT_ROLE_LABELS[role]}
      </AppText>
      <AppText variant="bodyMedium" style={styles.roleNames}>
        {names.length ? names.join(', ') : '—'}
      </AppText>
      {missing > 0 ? (
        <AppText variant="captionBold" style={styles.missing}>
          ⚠ חסר {missing}
        </AppText>
      ) : null}
    </View>
  );
}

export function ShiftDayCard({
  date,
  day,
  night,
  team,
  weekend,
}: {
  date: string;
  day?: Shift;
  night?: Shift;
  team: TeamMember[];
  weekend: boolean;
}) {
  return (
    <View style={[styles.card, weekend && styles.cardWeekend]}>
      <View style={styles.header}>
        <AppText variant="bodyBold">
          {WEEKDAY_LETTERS[weekdayOf(date)]} · {formatDateShort(date)}
        </AppText>
        {weekend ? (
          <AppText variant="captionBold" style={{ color: colors.amberText }}>
            סוף שבוע
          </AppText>
        ) : null}
      </View>

      <View style={styles.slotBlock}>
        <View style={styles.slotHeader}>
          <AppText variant="captionBold">{SLOT_LABELS.day}</AppText>
          <AppText variant="micro">{SLOT_TIME_LABELS.day}</AppText>
        </View>
        <RoleSlot role="manager" names={namesForRole(day, 'manager', team)} required={ROLE_REQUIRED.day.manager ?? 0} />
        <RoleSlot
          role="employee"
          names={namesForRole(day, 'employee', team)}
          required={ROLE_REQUIRED.day.employee ?? 0}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.slotBlock}>
        <View style={styles.slotHeader}>
          <AppText variant="captionBold">{SLOT_LABELS.night}</AppText>
          <AppText variant="micro">{SLOT_TIME_LABELS.night}</AppText>
        </View>
        <RoleSlot
          role="employee"
          names={namesForRole(night, 'employee', team)}
          required={ROLE_REQUIRED.night.employee ?? 0}
        />
        <RoleSlot
          role="on_call_manager"
          names={namesForRole(night, 'on_call_manager', team)}
          required={ROLE_REQUIRED.night.on_call_manager ?? 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  cardWeekend: { borderColor: colors.amber, backgroundColor: colors.amberBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotBlock: { gap: 4 },
  slotHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: 2 },
  divider: { height: 1, backgroundColor: colors.divider },
  roleSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  roleLabel: { width: 40 },
  roleNames: { flex: 1 },
  missing: { color: colors.redText },
});
