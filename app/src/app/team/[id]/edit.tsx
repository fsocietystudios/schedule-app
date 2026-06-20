import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { Role } from '@/types';
import { spacing } from '@/theme';
import { View } from 'react-native';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'owner', label: 'בעלים' },
  { value: 'manager', label: 'מנהל' },
  { value: 'employee', label: 'עובד' },
];

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const member = useAppStore((s) => s.team.find((m) => m.id === id));
  const updateMember = useAppStore((s) => s.updateMember);

  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<Role>(member?.role ?? 'employee');
  const [jobTitle, setJobTitle] = useState(member?.jobTitle ?? '');

  const canSubmit = name.trim().length > 0;

  if (!member) {
    return (
      <Screen>
        <ScreenHeader title="עריכת איש צוות" />
      </Screen>
    );
  }

  function handleSubmit() {
    if (!canSubmit) return;
    updateMember(member!.id, {
      name: name.trim(),
      role,
      jobTitle: jobTitle.trim() || undefined,
    });
    router.back();
  }

  return (
    <Screen scroll>
      <ScreenHeader title="עריכת איש צוות" />
      <View style={styles.form}>
        <TextField label="שם" value={name} onChangeText={setName} placeholder="לדוגמה: כריס דיאז" />
        <View style={styles.field}>
          <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} />
        </View>
        <TextField
          label="תפקיד בעבודה (לא חובה)"
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="לדוגמה: בריסטה"
        />
      </View>
      <Button label="שמירת שינויים" onPress={handleSubmit} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = {
  form: { gap: spacing.md, marginBottom: spacing.lg },
  field: { marginTop: -spacing.xs },
} as const;
