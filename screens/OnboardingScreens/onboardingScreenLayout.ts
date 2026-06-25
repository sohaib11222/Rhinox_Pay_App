/** Figma frame width — scale spacing from this, not screen height %. */
export const FIGMA_FRAME_WIDTH = 430;

export const ONBOARDING_SCREEN_LAYOUT = {
  /** Top hero panel — 58% of screen height (Figma cut line). */
  heroAreaRatio: 0.58,

  progressTop: 12,
  progressBarWidth: 110,
  progressBarHeight: 6,
  progressGap: 8,
  horizontalInset: 20,

  glowHeight: 56,

  contentPaddingTop: 28,
  contentPaddingHorizontal: 20,
  contentGap: 14,

  titleFontSize: 28,
  titleLineHeight: 34,
  subtitleFontSize: 13,
  subtitleLineHeight: 20,

  skipBottom: 22,
  skipPaddingH: 34,
  skipPaddingV: 7,

  buttonBottom: 40,
  buttonReservedHeight: 88,
} as const;

export const scaleFromFigma = (screenWidth: number, figmaPx: number) =>
  Math.round((screenWidth / FIGMA_FRAME_WIDTH) * figmaPx);
