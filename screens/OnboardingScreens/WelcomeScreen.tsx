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
import { ONBOARDING_COLORS } from './onboardingStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PAGE_BACKGROUND = require('../../assets/onboarding/last-onboarding.png');

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

      <Image
        source={PAGE_BACKGROUND}
        style={styles.pageBackground}
        resizeMode="cover"
        fadeDuration={0}
      />

      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.topBlock}>
          <Image
            source={require('../../assets/onboarding/welcome-logo-pill.png')}
            style={styles.logoImage}
            resizeMode="contain"
            fadeDuration={0}
          />

          <Text style={styles.title}>Transact Across Borders with RhinoxPay</Text>
          <Text style={styles.subtitle}>
            Send money from anywhere in Africa, via bank account, you can also trade various crypto
            and settle your bills easily
          </Text>
        </View>

        <View style={styles.bottomBlock}>
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
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  pageBackground: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBlock: {
    alignItems: 'center',
  },
  logoImage: {
    width: screenWidth * 0.42,
    height: (screenWidth * 0.42) / 3.913,
    marginBottom: 18,
  },
  title: {
    fontFamily: 'SFProText_Bold',
    fontSize: 24,
    color: ONBOARDING_COLORS.white,
    lineHeight: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SFProText_Regular',
    fontSize: 13,
    color: ONBOARDING_COLORS.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomBlock: {
    alignItems: 'stretch',
  },
  welcomeTitle: {
    fontFamily: 'SFProText_Bold',
    fontSize: 22,
    color: ONBOARDING_COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: 'SFProText_Regular',
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
    fontFamily: 'SFProText_Medium',
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
    fontFamily: 'SFProText_Medium',
    fontSize: 15,
    color: ONBOARDING_COLORS.background,
  },
});
