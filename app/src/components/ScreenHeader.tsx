import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  closeLabel?: string;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onClose, closeLabel = '✕ ביטול', rightSlot }: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {onClose ? (
          <Pressable onPress={onClose ?? (() => router.back())} hitSlop={8}>
            <AppText variant="bodyMedium" style={{ color: colors.textMuted }}>
              {closeLabel}
            </AppText>
          </Pressable>
        ) : (
          <View />
        )}
        {rightSlot}
      </View>
      <AppText variant="display2">{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    minHeight: 22,
  },
  subtitle: { marginTop: spacing.xs },
});
