import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ONBOARDING_COLORS } from './onboardingStyles';

const OnboardingGlowDivider = () => {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(169, 239, 69, 0.28)',
          'rgba(169, 239, 69, 0.12)',
          'transparent',
        ]}
        style={styles.glowUp}
      />
      <LinearGradient
        colors={[
          'transparent',
          'rgba(169, 239, 69, 0.15)',
          'rgba(169, 239, 69, 0.55)',
          'rgba(169, 239, 69, 0.15)',
          'transparent',
        ]}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 22,
    justifyContent: 'center',
    backgroundColor: ONBOARDING_COLORS.background,
    zIndex: 5,
  },
  line: {
    height: 2,
    width: '100%',
  },
  glowUp: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: 20,
  },
});

export default OnboardingGlowDivider;
