import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Deep navy background matching the design PNG. Colors sampled directly from
 * onboarding-screens-background.png so the blue tone is accurate and consistent
 * (PNG renders too dark / banded on Android, so we redraw it as a gradient).
 */
const OnboardingBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight}>
        <Defs>
          {/* base vertical navy */}
          <SvgLinearGradient id="obBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#071425" stopOpacity="1" />
            <Stop offset="32%" stopColor="#091A2E" stopOpacity="1" />
            <Stop offset="60%" stopColor="#081728" stopOpacity="1" />
            <Stop offset="100%" stopColor="#06121F" stopOpacity="1" />
          </SvgLinearGradient>
          {/* faint highlight, upper-right */}
          <RadialGradient id="obGlowTop" cx="78%" cy="9%" rx="60%" ry="36%">
            <Stop offset="0%" stopColor="#0E2138" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#0A1A2E" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#071425" stopOpacity="0" />
          </RadialGradient>
          {/* faint highlight, lower-left */}
          <RadialGradient id="obGlowBottom" cx="16%" cy="86%" rx="52%" ry="34%">
            <Stop offset="0%" stopColor="#0D1D34" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#0A1830" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#06121F" stopOpacity="0" />
          </RadialGradient>
          {/* edge vignette (darker left/right + corners) */}
          <SvgLinearGradient id="obEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#030F1D" stopOpacity="0.85" />
            <Stop offset="18%" stopColor="#040F1E" stopOpacity="0" />
            <Stop offset="82%" stopColor="#040F1E" stopOpacity="0" />
            <Stop offset="100%" stopColor="#030F1D" stopOpacity="0.85" />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#obBase)" />
        <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#obGlowTop)" />
        <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#obGlowBottom)" />
        <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#obEdge)" />
      </Svg>
    </View>
  );
};

export default OnboardingBackground;
