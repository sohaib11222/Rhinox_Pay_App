import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ONBOARDING_COLORS } from './onboardingStyles';

const { width: screenWidth } = Dimensions.get('window');
const GLOW_HEIGHT = 120;

/**
 * Sharp green line with a soft spotlight glow fading downward. Drawn on a
 * transparent canvas so it overlays the page background without creating a seam.
 */
const OnboardingCutGlow = () => {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Svg width={screenWidth} height={GLOW_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="cutLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0" />
            <Stop offset="22%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.5" />
            <Stop offset="50%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="1" />
            <Stop offset="78%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0" />
          </SvgLinearGradient>

          <RadialGradient id="cutSpotlight" cx="50%" cy="0%" rx="46%" ry="100%">
            <Stop offset="0%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.34" />
            <Stop offset="30%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.13" />
            <Stop offset="65%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0.03" />
            <Stop offset="100%" stopColor={ONBOARDING_COLORS.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* soft glow fading down from the line */}
        <Rect x={0} y={2} width={screenWidth} height={GLOW_HEIGHT - 2} fill="url(#cutSpotlight)" />
        {/* the sharp line */}
        <Rect x={0} y={0} width={screenWidth} height={2} fill="url(#cutLine)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: GLOW_HEIGHT,
    width: '100%',
  },
});

export default OnboardingCutGlow;
export { GLOW_HEIGHT };
