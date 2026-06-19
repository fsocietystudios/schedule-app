import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AmaticSC_700Bold } from '@expo-google-fonts/amatic-sc';
import {
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useRtlEnforced() {
  const [ready, setReady] = useState(I18nManager.isRTL);

  useEffect(() => {
    if (I18nManager.isRTL) {
      setReady(true);
      return;
    }
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    (async () => {
      try {
        const Updates = await import('expo-updates');
        await Updates.reloadAsync();
      } catch {
        setReady(true);
      }
    })();
  }, []);

  return ready;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AmaticSC_700Bold,
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });
  const rtlReady = useRtlEnforced();
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    if (fontsLoaded && rtlReady && hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, rtlReady, hasHydrated]);

  if (!fontsLoaded || !rtlReady || !hasHydrated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="team/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="team/[id]/exemptions/index" />
      <Stack.Screen name="team/[id]/exemptions/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="schedule/generate" options={{ presentation: 'modal' }} />
      <Stack.Screen name="schedule/draft" />
      <Stack.Screen name="schedule/demo" />
      <Stack.Screen name="requests/index" />
      <Stack.Screen name="requests/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="requests/[id]/feedback" />
      <Stack.Screen name="requests/[id]/rebalance" />
      <Stack.Screen name="requests/[id]/published" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
