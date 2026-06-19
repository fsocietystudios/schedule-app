import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Stepper({ value, onChange, min = 1, max = 30, label }: StepperProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.button, value <= min && styles.disabled]}>
        <AppText variant="title">−</AppText>
      </Pressable>
      <View style={styles.center}>
        <AppText variant="display3">{value}</AppText>
        <AppText variant="micro">{label}</AppText>
      </View>
      <Pressable
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.button, value >= max && styles.disabled]}>
        <AppText variant="title">+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  button: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  center: { alignItems: 'center', gap: 2 },
});
