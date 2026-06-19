import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

type Tone = 'green' | 'red' | 'amber';

const toneStyles = {
  green: { bg: colors.greenBg, border: colors.green, text: colors.greenText },
  red: { bg: colors.redBg, border: colors.red, text: colors.redText },
  amber: { bg: colors.amberBg, border: colors.amber, text: colors.amberText },
};

export function AiNote({
  message,
  tone = 'green',
  label = 'AI',
}: {
  message: string;
  tone?: Tone;
  label?: string;
}) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      <AppText variant="captionBold" style={{ color: t.text }}>
        {label}
      </AppText>
      <AppText variant="caption" style={[styles.message, { color: t.text }]}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  message: { flex: 1 },
});
