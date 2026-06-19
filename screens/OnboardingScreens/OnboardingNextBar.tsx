import React from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const HORIZONTAL_PADDING = 16;
const BAR_WIDTH = screenWidth - HORIZONTAL_PADDING * 2;

type OnboardingNextBarProps = {
  source: ImageSourcePropType;
  /** width / height aspect ratio of the (already cropped) asset */
  aspectRatio: number;
  onPress: () => void;
  onHomePress?: () => void;
};

const OnboardingNextBar = ({
  source,
  aspectRatio,
  onPress,
  onHomePress,
}: OnboardingNextBarProps) => {
  const barHeight = BAR_WIDTH / aspectRatio;

  return (
    <View style={[styles.row, { height: barHeight }]}>
      <Image source={source} style={styles.image} resizeMode="contain" />

      <TouchableOpacity
        style={styles.nextTouch}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Next"
      />

      {onHomePress ? (
        <TouchableOpacity
          style={styles.homeTouch}
          onPress={onHomePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go to welcome"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: BAR_WIDTH,
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nextTouch: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '74%',
    height: '100%',
  },
  homeTouch: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '14%',
    height: '100%',
  },
});

export default OnboardingNextBar;
