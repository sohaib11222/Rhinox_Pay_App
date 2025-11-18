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
      
      {/* Background Image */}
      <Image
        source={require('../../assets/onboarding1_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
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

      {/* Bottom Section with Next Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.nextButtonContainer} onPress={handleNext}>
          <Image
            source={require('../../assets/testing_12.png')}
            style={styles.nextButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 60,
    gap: 10,
    zIndex: 10,
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 10,
   
  },
  nextButtonContainer: {
    width: '100%',
    alignItems: 'center',
 
    justifyContent: 'center',
  },
  nextButtonImage: {
    // width: 500,
    height: 65,
  },
});

