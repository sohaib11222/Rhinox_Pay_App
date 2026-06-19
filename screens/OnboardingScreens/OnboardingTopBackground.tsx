import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  ONBOARDING_BOTTOM_FLEX,
  ONBOARDING_COLORS,
  ONBOARDING_TOP_FLEX,
} from './onboardingStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type OnboardingTopBackgroundProps = {
  starsOnly?: boolean;
  topFlex?: number;
  bottomFlex?: number;
};

const OnboardingTopBackground = ({
  starsOnly = false,
  topFlex = ONBOARDING_TOP_FLEX,
  bottomFlex = ONBOARDING_BOTTOM_FLEX,
}: OnboardingTopBackgroundProps) => {
  const panelHeight = (screenHeight * topFlex) / (topFlex + bottomFlex);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width={screenWidth}
        height={panelHeight}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="onboardingTopGlow" cx="50%" cy="38%" rx="68%" ry="52%">
            <Stop offset="0%" stopColor="#3d8cc4" stopOpacity="0.45" />
            <Stop offset="35%" stopColor="#1a4a72" stopOpacity="0.28" />
            <Stop offset="65%" stopColor="#0a2038" stopOpacity="0.1" />
            <Stop offset="100%" stopColor={ONBOARDING_COLORS.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="onboardingIllustrationGlow" cx="50%" cy="48%" rx="42%" ry="28%">
            <Stop offset="0%" stopColor="#A9EF45" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#A9EF45" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={screenWidth} height={panelHeight} fill={ONBOARDING_COLORS.background} />
        <Rect x={0} y={0} width={screenWidth} height={panelHeight} fill="url(#onboardingTopGlow)" />
        <Rect x={0} y={0} width={screenWidth} height={panelHeight} fill="url(#onboardingIllustrationGlow)" />
      </Svg>

      <Image
        source={require('../../assets/onboarding/onboarding-star-skip-bg.png')}
        style={[styles.stars, starsOnly && styles.starsOnly]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  stars: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  starsOnly: {
    height: '108%',
  },
});

export default OnboardingTopBackground;
