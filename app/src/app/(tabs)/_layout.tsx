import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router/tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

const TAB_LABELS: Record<string, string> = {
  index: 'סידור',
  history: 'היסטוריה',
  team: 'צוות',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}>
              <View style={[styles.dot, focused && styles.dotActive]} />
              <AppText
                variant="captionBold"
                style={{ color: focused ? colors.ink : colors.textFaint }}>
                {TAB_LABELS[route.name] ?? route.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surfaceMuted, borderTopWidth: 2, borderTopColor: colors.divider },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tab: { alignItems: 'center', gap: 3, paddingHorizontal: spacing.md },
  dot: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.textFaint },
  dotActive: { borderColor: colors.ink, backgroundColor: colors.ink },
});
