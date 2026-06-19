import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { Stepper } from '@/components/Stepper';
import { AppText } from '@/components/AppText';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { AiEngineMode } from '@/types';

const ENGINE_OPTIONS: { value: AiEngineMode; label: string }[] = [
  { value: 'local', label: 'מקומי' },
  { value: 'remote', label: 'שרת בית' },
];

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <Screen scroll>
      <ScreenHeader title="הגדרות" onClose={() => router.back()} />

      <View style={styles.field}>
        <AppText variant="captionBold" style={styles.label}>
          מנוע AI
        </AppText>
        <SegmentedControl
          options={ENGINE_OPTIONS}
          value={settings.aiEngine}
          onChange={(aiEngine) => updateSettings({ aiEngine })}
        />
        <AppText variant="caption" style={styles.hint}>
          {settings.aiEngine === 'local'
            ? 'חישוב הוגנות ושיבוץ נעשה על המכשיר, בלי תלות באינטרנט.'
            : 'הבקשות נשלחות לשרת הבית שלכם, שמריץ מודל AI מקומי.'}
        </AppText>
      </View>

      {settings.aiEngine === 'remote' ? (
        <View style={styles.form}>
          <TextField
            label="כתובת שרת"
            value={settings.serverUrl}
            onChangeText={(serverUrl) => updateSettings({ serverUrl })}
            placeholder="https://my-server.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextField
            label="טוקן גישה"
            value={settings.serverToken}
            onChangeText={(serverToken) => updateSettings({ serverToken })}
            placeholder="אופציונלי"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>
      ) : null}

      <View style={styles.field}>
        <AppText variant="captionBold" style={styles.label}>
          איוש מינימלי למשמרת
        </AppText>
        <Stepper
          label="אנשים"
          value={settings.minCoveragePerShift}
          min={1}
          max={10}
          onChange={(minCoveragePerShift) => updateSettings({ minCoveragePerShift })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginBottom: spacing.lg },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  label: { marginBottom: 2 },
  hint: { marginTop: spacing.xs },
});
