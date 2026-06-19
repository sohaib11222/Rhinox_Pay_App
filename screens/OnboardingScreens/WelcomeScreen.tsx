import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HAS_SEEN_ONBOARDING_KEY, HAS_SEEN_WELCOME_KEY } from '../../constants/onboarding';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import OnboardingStars from './OnboardingStars';
import { ONBOARDING_COLORS } from './onboardingStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CURVE_HEIGHT = 44;

/** Concave "bowl" cut at the top of the bottom section that cradles the coins. */
const WelcomeCurve = () => (
  <Svg width={screenWidth} height={CURVE_HEIGHT} style={styles.curve}>
    <Path
      d={`M0,0 Q${screenWidth / 2},${CURVE_HEIGHT * 1.7} ${screenWidth},0 L${screenWidth},${CURVE_HEIGHT} L0,${CURVE_HEIGHT} Z`}
      fill={ONBOARDING_COLORS.background}
    />
    <Path
      d={`M0,0 Q${screenWidth / 2},${CURVE_HEIGHT * 1.7} ${screenWidth},0`}
      stroke="rgba(255, 255, 255, 0.1)"
      strokeWidth={1.5}
      fill="none"
    />
  </Svg>
);

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Mark intro + welcome as seen so next launch goes straight to Login
  useEffect(() => {
    AsyncStorage.multiSet([
      [HAS_SEEN_ONBOARDING_KEY, 'true'],
      [HAS_SEEN_WELCOME_KEY, 'true'],
    ]).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={screenWidth} height={screenHeight}>
          <Defs>
            <SvgLinearGradient id="welcomeBaseNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#16456b" stopOpacity="1" />
              <Stop offset="38%" stopColor="#0d2840" stopOpacity="1" />
              <Stop offset="72%" stopColor={ONBOARDING_COLORS.background} stopOpacity="1" />
              <Stop offset="100%" stopColor={ONBOARDING_COLORS.background} stopOpacity="1" />
            </SvgLinearGradient>
            <RadialGradient id="welcomeBlueGlow" cx="50%" cy="16%" rx="85%" ry="34%">
              <Stop offset="0%" stopColor="#4f9fd6" stopOpacity="0.5" />
              <Stop offset="45%" stopColor="#236496" stopOpacity="0.24" />
              <Stop offset="100%" stopColor="#0d2840" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="welcomeSpotlight" cx="50%" cy="50%" rx="42%" ry="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#welcomeBaseNavy)" />
          <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="url(#welcomeBlueGlow)" />
          {/* white spotlight under the coins */}
          <Rect
            x={0}
            y={screenHeight * 0.5}
            width={screenWidth}
            height={screenHeight * 0.22}
            fill="url(#welcomeSpotlight)"
          />
        </Svg>

        <OnboardingStars width={screenWidth} height={screenHeight * 0.55} />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 14 }]}>
        <Image
          source={require('../../assets/onboarding/welcome-logo-pill.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Transact Across Borders with RhinoxPay</Text>
        <Text style={styles.subtitle}>
          Send money from anywhere in Africa, via bank account, you can also trade various crypto
          and settle your bills easily
        </Text>

        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/onboarding/welcome-hero-coins.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Concave cut + bottom actions */}
      <WelcomeCurve />
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>Get started on your journey with RhinoxPay</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() =>
            navigation.navigate('Auth' as never, { screen: 'Login' } as never)
          }
          activeOpacity={0.88}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() =>
            navigation.navigate('Auth' as never, { screen: 'Register' } as never)
          }
          activeOpacity={0.88}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: screenWidth * 0.42,
    height: (screenWidth * 0.42) / 3.913,
    marginBottom: 18,
  },
  title: {
    fontFamily: 'SFPRODISPLAYBOLD',
    fontSize: 24,
    color: ONBOARDING_COLORS.white,
    lineHeight: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SFPRODISPLAYREGULAR',
    fontSize: 13,
    color: ONBOARDING_COLORS.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
  heroSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: screenWidth * 0.92,
    height: (screenWidth * 0.92) / 1.502,
    maxHeight: '92%',
  },
  curve: {
    marginBottom: -1,
    zIndex: 2,
  },
  bottomSection: {
    backgroundColor: ONBOARDING_COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 4,
    zIndex: 2,
  },
  welcomeTitle: {
    fontFamily: 'SFPRODISPLAYBOLD',
    fontSize: 22,
    color: ONBOARDING_COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: 'SFPRODISPLAYREGULAR',
    fontSize: 13,
    color: ONBOARDING_COLORS.muted,
    textAlign: 'center',
    marginBottom: 22,
  },
  loginButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    fontFamily: 'SFPRODISPLAYMEDIUM',
    fontSize: 15,
    color: ONBOARDING_COLORS.background,
  },
  registerButton: {
    backgroundColor: ONBOARDING_COLORS.white,
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontFamily: 'SFPRODISPLAYMEDIUM',
    fontSize: 15,
    color: ONBOARDING_COLORS.background,
  },
});
