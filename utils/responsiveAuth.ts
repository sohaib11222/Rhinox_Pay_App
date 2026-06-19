import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Scale auth hero height for smaller/larger phones (reference: 844pt iPhone 14). */
export function getAuthHeroHeight(baseHeight = 426): number {
  const scale = Math.min(Math.max(SCREEN_HEIGHT / 844, 0.72), 1);
  return Math.round(baseHeight * scale);
}

export function getAuthHeroImageWidth(baseWidth = 440): number {
  const scale = Math.min(Math.max(SCREEN_HEIGHT / 844, 0.72), 1);
  return Math.round(baseWidth * scale);
}
