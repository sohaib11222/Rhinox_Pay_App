import React from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const H_PADDING = 16;
const BAR_WIDTH = Math.round(screenWidth - H_PADDING * 2);
const BAR_HEIGHT = Math.round(PixelRatio.roundToNearestPixel(64));

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
  const barSource = isDual
    ? require('../../assets/onboarding/buttons.png')
    : require('../../assets/onboarding/next-button-single.png');

  return (
    <View style={styles.wrap}>
      <Image
        source={barSource}
        style={styles.barImage}
        resizeMode="contain"
        fadeDuration={0}
      />

      <View style={styles.hitRow} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.hitZone, styles.nextHit]}
          onPress={onNext}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Next"
        />
        {isDual ? (
          <TouchableOpacity
            style={[styles.hitZone, styles.arrowHit]}
            onPress={onNext}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Next"
          />
        ) : null}
        <TouchableOpacity
          style={[styles.hitZone, isDual ? styles.homeHit : styles.homeHitSingle]}
          onPress={onHome}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Go to welcome"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    alignSelf: 'center',
    marginBottom: 4,
  },
  barImage: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    backgroundColor: 'transparent',
  },
  hitRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hitZone: {
    height: '100%',
  },
  nextHit: {
    width: '58%',
  },
  arrowHit: {
    width: '21%',
  },
  homeHit: {
    width: '21%',
  },
  homeHitSingle: {
    width: '42%',
    marginLeft: 'auto',
  },
});

export default OnboardingNextBarNative;
