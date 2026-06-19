import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'outline' | 'danger' | 'success';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, style, icon }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {icon ? <AppText style={[styles.label, textColor[variant]]}>{icon}</AppText> : null}
        <AppText variant="bodyBold" style={[styles.label, textColor[variant]]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});

const variantStyles: Record<Variant, ViewStyle> = StyleSheet.create({
  primary: {
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.red,
  },
  success: {
    backgroundColor: colors.green,
  },
});

const textColor: Record<Variant, { color: string }> = {
  primary: { color: colors.surface },
  outline: { color: colors.ink },
  danger: { color: colors.red },
  success: { color: colors.surface },
};
