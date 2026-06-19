import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';
import { fonts } from '@/theme/typography';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, multiline, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="captionBold" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, multiline && styles.multiline, style]}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        textAlign="right"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginRight: 2 },
  input: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 80, textAlign: 'right' },
});
