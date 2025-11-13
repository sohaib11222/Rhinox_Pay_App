import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen1 = () => {
  const navigation = useNavigation();

  const handleNext = () => {
    navigation.navigate('Onboarding2' as never);
  };

  const handleSkip = () => {
    navigation.navigate('Welcome' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.circleTop]} />
      <View style={[styles.decorativeCircle, styles.circleBottom]} />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/onboarding/main-illustration-1.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
        
        {/* Decorative Stars */}
        <View style={[styles.star, { top: 50, left: 20 }]} />
        <View style={[styles.star, { top: 260, left: 60 }]} />
        <View style={[styles.star, { top: 461, left: 17 }]} />
        <View style={[styles.starSmall, { top: 77, right: 100 }]} />
        <View style={[styles.starSmall, { top: 0, right: 50 }]} />
        
        {/* Decorative Dots */}
        <View style={[styles.dot, { top: 394, left: 75 }]} />
        <View style={[styles.dot, { top: 223, right: 67 }]} />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.topBorder} />
        
        <Text style={styles.title}>
          Send and Receive Money{'\n'}
          Across <Text style={styles.highlight}>Africa</Text>
        </Text>

        <Text style={styles.description}>
          You can send money across Africa via different channels
        </Text>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>

          {/* Navigation Dots */}
          <View style={styles.navDotsContainer}>
            <View style={styles.navDot} />
            <View style={styles.navDot} />
            <View style={styles.navDotHome} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    opacity: 0.5,
  },
  circleTop: {
    top: 119,
    right: -72,
  },
  circleBottom: {
    bottom: -50,
    left: -14,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 60,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 7,
    backgroundColor: '#D9D9D9',
    borderRadius: 100,
  },
  progressActive: {
    backgroundColor: '#A9EF45',
  },
  skipButton: {
    position: 'absolute',
    top: height * 0.6,
    alignSelf: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 10,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '300',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  illustration: {
    width: 380,
    height: 500,
    marginTop: -20,
  },
  star: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#A9EF45',
    transform: [{ rotate: '45deg' }],
  },
  starSmall: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#A9EF45',
    transform: [{ rotate: '45deg' }],
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopWidth: 3,
    borderTopColor: '#A9EF45',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  topBorder: {
    position: 'absolute',
    top: -31,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  highlight: {
    color: '#A9EF45',
  },
  description: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  navDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(169, 239, 69, 0.2)',
    borderWidth: 2,
    borderColor: '#A9EF45',
  },
  navDotHome: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(169, 239, 69, 0.2)',
    borderWidth: 2,
    borderColor: '#A9EF45',
  },
});

