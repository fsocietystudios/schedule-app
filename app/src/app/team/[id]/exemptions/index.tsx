import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import { Exemption, ExemptionType } from '@/types';
import { formatDateShort } from '@/utils/calendar';

const TYPE_META: Record<ExemptionType, { icon: string; label: string }> = {
  no_nights: { icon: '🚫', label: 'אסור משמרות לילה' },
  unavailable: { icon: '🌴', label: 'לא זמין' },
  sick: { icon: '🤒', label: 'מחלה' },
  fixed_days: { icon: '📌', label: 'ימים קבועים' },
};

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function exemptionSubtitle(e: Exemption): string {
  if (e.permanent) return 'אילוץ קבוע · ללא תאריך סיום';
  if (e.type === 'fixed_days') {
    return (e.daysOfWeek ?? []).map((d) => WEEKDAY_LETTERS[d]).join(', ');
  }
  if (e.startDate && e.endDate) {
    return `${formatDateShort(e.startDate)} – ${formatDateShort(e.endDate)}`;
  }
  return e.reason ?? '';
}

export default function ExemptionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const member = useAppStore((s) => s.team.find((m) => m.id === id));
  const allExemptions = useAppStore((s) => s.exemptions);
  const removeExemption = useAppStore((s) => s.removeExemption);
  const removeMember = useAppStore((s) => s.removeMember);
  const exemptions = useMemo(
    () => allExemptions.filter((e) => e.memberId === id),
    [allExemptions, id],
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!member) {
    return (
      <Screen>
        <AppText variant="body">איש הצוות לא נמצא.</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()}>
          <AppText variant="bodyMedium" style={{ color: colors.textMuted }}>
            › צוות
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/team/[id]/edit', params: { id: member.id } })}>
          <AppText variant="bodyMedium" style={{ color: colors.ink }}>
            ✎ עריכה
          </AppText>
        </Pressable>
      </View>
      <AppText variant="display3">שחרורים מהסידור</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        {member.name} · {exemptions.length} פעילים
      </AppText>

      <View style={styles.list}>
        {exemptions.map((e) => {
          const meta = TYPE_META[e.type];
          return (
            <View
              key={e.id}
              style={[styles.card, e.type === 'no_nights' && styles.cardWarning]}>
              <View style={styles.cardTop}>
                <AppText
                  variant="bodyBold"
                  style={e.type === 'no_nights' ? { color: colors.redText } : undefined}>
                  {meta.icon} {meta.label}
                </AppText>
                <Badge label={e.permanent ? 'קבוע' : 'טווח'} tone={e.permanent ? 'red' : 'neutral'} />
              </View>
              <AppText
                variant="caption"
                style={e.type === 'no_nights' ? { color: colors.redText } : undefined}>
                {exemptionSubtitle(e)}
              </AppText>
              <Pressable onPress={() => removeExemption(e.id)} style={styles.removeBtn}>
                <AppText variant="caption" style={{ color: colors.red }}>
                  הסרה
                </AppText>
              </Pressable>
            </View>
          );
        })}

        {exemptions.length === 0 ? (
          <AppText variant="body" style={styles.empty}>
            אין שחרורים פעילים. אפשר להוסיף: אסור לילה · לא זמין · מחלה · ימים קבועים.
          </AppText>
        ) : null}
      </View>

      <Button
        label="+ הוספת שחרור"
        onPress={() =>
          router.push({ pathname: '/team/[id]/exemptions/add', params: { id: member.id } })
        }
        style={styles.addButton}
      />

      <View style={styles.dangerZone}>
        {confirmingDelete ? (
          <>
            <AppText variant="caption" style={styles.dangerWarning}>
              למחוק את {member.name} מהצוות? הפעולה תמחק גם את כל השחרורים שלו ולא ניתן לבטל אותה.
            </AppText>
            <View style={styles.dangerButtons}>
              <Button
                label="ביטול"
                variant="outline"
                onPress={() => setConfirmingDelete(false)}
                style={styles.dangerButton}
              />
              <Button
                label="אישור מחיקה"
                variant="danger"
                onPress={() => {
                  removeMember(member.id);
                  router.back();
                }}
                style={styles.dangerButton}
              />
            </View>
          </>
        ) : (
          <Button
            label="מחיקת איש צוות"
            variant="danger"
            onPress={() => setConfirmingDelete(true)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: { marginBottom: spacing.lg, marginTop: 2 },
  list: { gap: spacing.sm },
  card: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  cardWarning: { borderColor: colors.red, backgroundColor: colors.redBg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { alignSelf: 'flex-start', marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  addButton: { marginTop: spacing.xl },
  dangerZone: { marginTop: spacing.xl, gap: spacing.sm },
  dangerWarning: { color: colors.redText, textAlign: 'center' },
  dangerButtons: { flexDirection: 'row', gap: spacing.sm },
  dangerButton: { flex: 1 },
});
