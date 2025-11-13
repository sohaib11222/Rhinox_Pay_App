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

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleRegister = () => {
    // Navigate to register screen when implemented
    console.log('Navigate to Register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient Elements */}
      <View style={[styles.gradientCircle, styles.gradientTop]} />
      <View style={[styles.decorativeCircle, styles.circleTop]} />
      <View style={[styles.decorativeCircle, styles.circleBottom]} />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          Rhinox<Text style={styles.logoHighlight}>Pay</Text>
        </Text>
      </View>

      {/* Main Title */}
      <Text style={styles.mainTitle}>
        Transact Across Borders with{'\n'}
        RhinoxPay
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Send money from anywhere in Africa, via bank account , you can also trade various{'\n'}
        crypto and settle your bills easily
      </Text>

      {/* Currency/Wallet Illustration Container */}
      <View style={styles.illustrationContainer}>
        {/* Card Background Cards with rotation */}
        <View style={[styles.cardBg, { transform: [{ rotate: '-20deg' }], left: -30, top: 20 }]}>
          <Text style={styles.flagEmoji}>🇳🇬</Text>
        </View>
        
        <View style={[styles.cardBg, { transform: [{ rotate: '3deg' }], left: 60, top: 0 }]}>
          <Text style={styles.flagEmoji}>🇬🇭</Text>
        </View>
        
        <View style={[styles.cardBg, { transform: [{ rotate: '13deg' }], right: 70, top: 30 }]}>
          <Text style={styles.flagEmoji}>🇿🇦</Text>
        </View>
        
        <View style={[styles.cardBg, { transform: [{ rotate: '36deg' }], right: -30, top: 80 }]}>
          <Text style={styles.flagEmoji}>🇺🇬</Text>
        </View>

        {/* Central wallet/coins illustration */}
        <View style={styles.centralIllustration}>
          <View style={styles.coinContainer}>
            <Image
              source={require('../../assets/onboarding/welcome-coin-1.png')}
              style={[styles.coinImage, { transform: [{ translateY: 10 }] }]}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/onboarding/welcome-coin-2.png')}
              style={[styles.coinImage, { zIndex: 2 }]}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/onboarding/welcome-coin-3.png')}
              style={[styles.coinImage, { transform: [{ translateY: 10 }] }]}
              resizeMode="contain"
            />
          </View>
          <Image
            source={require('../../assets/onboarding/welcome-coin-4.png')}
            style={styles.walletImage}
            resizeMode="contain"
          />
        </View>

        {/* Decorative ellipse/wave at bottom */}
        <View style={styles.waveBottom} />
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>
          Get started on your journey with RhinoxPay
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative Stars */}
      <View style={[styles.star, { top: 130, left: 45 }]} />
      <View style={[styles.star, { top: 340, left: 85 }]} />
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  gradientTop: {
    position: 'absolute',
    top: -178,
    left: -70,
    width: 611,
    height: 611,
    borderRadius: 305.5,
    backgroundColor: '#1a3a7a',
    opacity: 0.3,
  },
  gradientCircle: {
    position: 'absolute',
    opacity: 0.4,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingVertical: 11,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoHighlight: {
    color: '#A9EF45',
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    marginTop: 20,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 20,
  },
  cardBg: {
    position: 'absolute',
    width: 124,
    height: 195,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15,
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 40,
  },
  centralIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  coinContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: -20,
    alignItems: 'center',
  },
  coinImage: {
    width: 100,
    height: 100,
  },
  walletImage: {
    width: 180,
    height: 180,
  },
  waveBottom: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(169, 239, 69, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  bottomContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  star: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#A9EF45',
    transform: [{ rotate: '45deg' }],
  },
});

