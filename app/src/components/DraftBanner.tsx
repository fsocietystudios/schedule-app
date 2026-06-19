import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { colors, radius, spacing } from '@/theme';

export function DraftBanner({ badge, text }: { badge: string; text: string }) {
  return (
    <View style={styles.wrap}>
      <Badge label={badge} tone="amber" />
      <AppText variant="caption" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  text: { color: colors.amberText, flex: 1 },
});
