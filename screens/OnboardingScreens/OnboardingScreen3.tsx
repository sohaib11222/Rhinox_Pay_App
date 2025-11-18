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

const OnboardingScreen3 = () => {
  const navigation = useNavigation();

  const handleProceed = () => {
    navigation.navigate('Welcome' as never);
  };

  const handleSkip = () => {
    navigation.navigate('Welcome' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/onboarding3_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
        <View style={[styles.progressBar, styles.progressActive]} />
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Bottom Section with Proceed Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen3;

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
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 10,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 20,
    marginTop:100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
});

