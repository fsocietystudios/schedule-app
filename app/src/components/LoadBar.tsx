import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

export function LoadBar({ pct, targetPct }: { pct: number; targetPct?: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
      {targetPct !== undefined ? (
        <View style={[styles.target, { left: `${Math.min(100, Math.max(0, targetPct))}%` }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 13,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.green },
  target: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: colors.red,
  },
});
