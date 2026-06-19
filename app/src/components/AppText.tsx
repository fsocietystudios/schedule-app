import { Text, TextProps } from 'react-native';
import { textVariants } from '@/theme';

type Variant = keyof typeof textVariants;

export function AppText({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: Variant }) {
  return <Text style={[textVariants[variant], style]} {...rest} />;
}
