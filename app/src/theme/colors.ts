export const colors = {
  bg: '#d9d6cc',
  surface: '#f4f1ea',
  surfaceMuted: '#efeae0',
  ink: '#2b2a27',
  inkSoft: '#3a3833',
  textMuted: '#6b6862',
  textFaint: '#9b988f',
  border: '#d2cec2',
  borderSoft: '#e2ded2',
  divider: '#ddd8cc',

  amber: '#c98a2e',
  amberBg: '#f7e7c4',
  amberText: '#8a5a12',

  green: '#6e8f5e',
  greenBg: '#e6efdd',
  greenText: '#3f5a30',

  red: '#c0573f',
  redBg: '#f6e0da',
  redText: '#8a3326',

  blue: '#3f6fb0',

  white: '#ffffff',
} as const;

export type AppColor = keyof typeof colors;
