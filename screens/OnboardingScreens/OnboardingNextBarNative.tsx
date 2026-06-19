import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ONBOARDING_COLORS } from './onboardingStyles';

const { width: screenWidth } = Dimensions.get('window');
const H_PADDING = 16;
const BAR_WIDTH = screenWidth - H_PADDING * 2;
const BAR_HEIGHT = 64;
const CIRCLE = 56;
const INNER_DOT = 30;

type OnboardingNextBarNativeProps = {
  variant: 'dual' | 'single';
  onNext: () => void;
  onHome: () => void;
};

const OnboardingNextBarNative = ({
  variant,
  onNext,
  onHome,
}: OnboardingNextBarNativeProps) => {
  const isDual = variant === 'dual';

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.nextPill}
        onPress={onNext}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Next"
      >
        <Text style={styles.nextLabel}>Next</Text>
      </TouchableOpacity>

      <View style={styles.cluster}>
        {isDual ? (
          <TouchableOpacity
            style={[styles.circle, styles.circleOverlap]}
            onPress={onNext}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Next"
          >
            <View style={styles.innerDot}>
              <Ionicons name="arrow-forward" size={16} color={ONBOARDING_COLORS.background} />
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.circle, isDual && styles.circleOverlap]}
          onPress={onHome}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Go to welcome"
        >
          <Ionicons name="home" size={22} color={ONBOARDING_COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  nextPill: {
    flex: 1,
    height: BAR_HEIGHT,
    backgroundColor: ONBOARDING_COLORS.primary,
    borderRadius: BAR_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -14,
    zIndex: 1,
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: ONBOARDING_COLORS.background,
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 1.5,
    borderColor: ONBOARDING_COLORS.primary,
    backgroundColor: ONBOARDING_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOverlap: {
    marginLeft: -10,
  },
  innerDot: {
    width: INNER_DOT,
    height: INNER_DOT,
    borderRadius: INNER_DOT / 2,
    backgroundColor: ONBOARDING_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingNextBarNative;
