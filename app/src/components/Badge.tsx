import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

type Tone = 'neutral' | 'amber' | 'green' | 'red';

const toneStyles = {
  neutral: { borderColor: colors.ink, backgroundColor: 'transparent', color: colors.ink },
  amber: { borderColor: colors.amber, backgroundColor: colors.amber, color: colors.surface },
  green: { borderColor: colors.green, backgroundColor: colors.greenBg, color: colors.greenText },
  red: { borderColor: colors.red, backgroundColor: colors.redBg, color: colors.redText },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.base, { borderColor: t.borderColor, backgroundColor: t.backgroundColor }]}>
      <AppText variant="captionBold" style={{ color: t.color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
});
