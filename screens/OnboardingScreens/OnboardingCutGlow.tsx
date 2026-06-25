import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ONBOARDING_COLORS } from './onboardingStyles';
import { ONBOARDING_SCREEN_LAYOUT } from './onboardingScreenLayout';

const { width: screenWidth } = Dimensions.get('window');

export const BEAM_HEIGHT = ONBOARDING_SCREEN_LAYOUT.glowHeight;

/** SVG beam — no opaque PNG background, blends into both panels. */
const OnboardingCutGlow = () => {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Svg width={screenWidth} height={BEAM_HEIGHT}>
        <Defs>
          <RadialGradient id="beamGlow" cx="50%" cy="0%" rx="50%" ry="100%">
            <Stop offset="0%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.38" />
            <Stop offset="35%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.14" />
            <Stop offset="70%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.04" />
            <Stop offset="100%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={screenWidth} height={BEAM_HEIGHT} fill="url(#beamGlow)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: screenWidth,
    height: BEAM_HEIGHT,
    overflow: 'visible',
  },
});

export default OnboardingCutGlow;
export { BEAM_HEIGHT as GLOW_HEIGHT };
