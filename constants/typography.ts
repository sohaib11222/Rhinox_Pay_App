export const TYPOGRAPHY = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 18,
  heading: 20,
  display: 24,
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
