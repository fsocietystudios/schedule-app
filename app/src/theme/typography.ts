import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fonts = {
  display: 'AmaticSC_700Bold',
  body: 'Rubik_400Regular',
  bodyMedium: 'Rubik_500Medium',
  bodyBold: 'Rubik_700Bold',
  bodyLight: 'Rubik_300Light',
};

type Variant =
  | 'display1'
  | 'display2'
  | 'display3'
  | 'title'
  | 'body'
  | 'bodyMedium'
  | 'bodyBold'
  | 'caption'
  | 'captionBold'
  | 'micro';

export const textVariants: Record<Variant, TextStyle> = {
  display1: { fontFamily: fonts.display, fontSize: 44, lineHeight: 44, color: colors.ink },
  display2: { fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: colors.ink },
  display3: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: colors.ink },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: colors.ink },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  captionBold: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  micro: { fontFamily: fonts.bodyMedium, fontSize: 10, lineHeight: 13, color: colors.textFaint },
};
