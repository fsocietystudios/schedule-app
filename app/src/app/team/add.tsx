import { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/Button';
import { AiNote } from '@/components/AiNote';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/id';
import { Role } from '@/types';
import { spacing } from '@/theme';
import { View } from 'react-native';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'owner', label: 'בעלים' },
  { value: 'manager', label: 'מנהל' },
  { value: 'employee', label: 'עובד' },
];

export default function AddMemberScreen() {
  const addMember = useAppStore((s) => s.addMember);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [jobTitle, setJobTitle] = useState('');

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    addMember({
      id: generateId('member'),
      name: name.trim(),
      role,
      jobTitle: jobTitle.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    router.back();
  }

  return (
    <Screen scroll>
      <ScreenHeader title="הוספת איש צוות" subtitle="ללא דוא״ל וללא סיסמה" />
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
        <AiNote
          tone="green"
          label="ⓘ"
          message="הוספה ישירה — אין הזמנה ואין חשבון. אפשר להגדיר שחרורים מהסידור מיד אחר כך."
        />
      </View>
      <Button label="הוספה לצוות" onPress={handleSubmit} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = {
  form: { gap: spacing.md, marginBottom: spacing.lg },
  field: { marginTop: -spacing.xs },
} as const;
