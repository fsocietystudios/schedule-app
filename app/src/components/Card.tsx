import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface CardProps extends PropsWithChildren {
  style?: ViewStyle;
  tone?: 'default' | 'amber' | 'green' | 'red';
}

const toneStyles = {
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  amber: { backgroundColor: colors.amberBg, borderColor: colors.amber },
  green: { backgroundColor: colors.greenBg, borderColor: colors.green },
  red: { backgroundColor: colors.redBg, borderColor: colors.red },
};

export function Card({ children, style, tone = 'default' }: CardProps) {
  return <View style={[styles.base, toneStyles[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});
