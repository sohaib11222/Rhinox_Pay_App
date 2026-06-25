import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingBackground from './OnboardingBackground';
import OnboardingCutGlow from './OnboardingCutGlow';
import OnboardingNextBarNative from './OnboardingNextBarNative';
import { ONBOARDING_COLORS } from './onboardingStyles';
import {
  ONBOARDING_SCREEN_LAYOUT,
  scaleFromFigma,
} from './onboardingScreenLayout';
import { markOnboardingSeen } from '../../utils/onboardingPersistence';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const HERO_IMAGE = require('../../assets/onboarding/Group 117.png');
const HERO_AREA_RATIO = 0.58;

const OnboardingScreen2 = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const layout = useMemo(() => {
    const heroHeight = Math.round(screenHeight * HERO_AREA_RATIO);
    const progressBarWidth = Math.min(
      ONBOARDING_SCREEN_LAYOUT.progressBarWidth,
      Math.floor(
        (screenWidth -
          ONBOARDING_SCREEN_LAYOUT.horizontalInset * 2 -
          ONBOARDING_SCREEN_LAYOUT.progressGap * 2) /
          3
      )
    );

    return {
      heroHeight,
      progressBarWidth,
      titleSize: scaleFromFigma(screenWidth, ONBOARDING_SCREEN_LAYOUT.titleFontSize),
      titleLineHeight: scaleFromFigma(screenWidth, ONBOARDING_SCREEN_LAYOUT.titleLineHeight),
      subtitleSize: scaleFromFigma(screenWidth, ONBOARDING_SCREEN_LAYOUT.subtitleFontSize),
      subtitleLineHeight: scaleFromFigma(screenWidth, ONBOARDING_SCREEN_LAYOUT.subtitleLineHeight),
      skipBottom: scaleFromFigma(screenWidth, 16),
      contentPaddingTop: scaleFromFigma(screenWidth, ONBOARDING_SCREEN_LAYOUT.contentPaddingTop),
      heroImageHeight: Math.round(heroHeight * 0.94),
    };
  }, []);

  const goWelcome = async () => {
    await markOnboardingSeen();
    navigation.navigate('Welcome' as never);
  };
  const goNext = () => navigation.navigate('Onboarding3' as never);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <OnboardingBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.heroStack, { height: layout.heroHeight }]}>
          <Image
            source={HERO_IMAGE}
            style={[styles.heroImage, { height: layout.heroImageHeight }]}
            resizeMode="contain"
            fadeDuration={0}
          />

          <View style={[styles.progressRow, { top: ONBOARDING_SCREEN_LAYOUT.progressTop }]}>
            <View style={[styles.progressBar, { width: layout.progressBarWidth }]} />
            <View style={[styles.progressBar, styles.progressActive, { width: layout.progressBarWidth }]} />
            <View style={[styles.progressBar, { width: layout.progressBarWidth }]} />
          </View>

          <TouchableOpacity
            style={[styles.skipButton, { bottom: layout.skipBottom }]}
            onPress={goWelcome}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lowerPanel}>
          <View style={styles.cutHeader}>
            <View style={styles.cutLine} />
            <OnboardingCutGlow />
          </View>

          <View
            style={[
              styles.copyBlock,
              {
                paddingTop: layout.contentPaddingTop,
                paddingBottom: ONBOARDING_SCREEN_LAYOUT.buttonReservedHeight,
              },
            ]}
          >
            <Text style={[styles.title, { fontSize: layout.titleSize, lineHeight: layout.titleLineHeight }]}>
              Get Dedicated <Text style={styles.titleAccent}>Crypto</Text> and{'\n'}
              <Text style={styles.titleAccent}>Fiat</Text> Wallets
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: layout.subtitleSize, lineHeight: layout.subtitleLineHeight },
              ]}
            >
              Once you register dedicated fiat wallets for currencies in Africa and crypto wallets
              will be created for you
            </Text>
          </View>

          <View style={[styles.buttonBlock, { bottom: insets.bottom + ONBOARDING_SCREEN_LAYOUT.buttonBottom }]}>
            <OnboardingNextBarNative variant="single" onNext={goNext} onHome={goWelcome} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingScreen2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ONBOARDING_COLORS.background },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  heroStack: {
    width: screenWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: screenWidth,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  progressRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: ONBOARDING_SCREEN_LAYOUT.progressGap,
    paddingHorizontal: ONBOARDING_SCREEN_LAYOUT.horizontalInset,
    zIndex: 2,
  },
  progressBar: {
    height: ONBOARDING_SCREEN_LAYOUT.progressBarHeight,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  progressActive: { backgroundColor: ONBOARDING_COLORS.primary },
  skipButton: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: ONBOARDING_SCREEN_LAYOUT.skipPaddingH,
    paddingVertical: ONBOARDING_SCREEN_LAYOUT.skipPaddingV,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border,
    backgroundColor: 'rgba(2, 12, 25, 0.45)',
    zIndex: 3,
  },
  skipText: {
    fontFamily: 'SFProText_Regular',
    fontSize: 13,
    fontWeight: '400',
    color: ONBOARDING_COLORS.white,
    includeFontPadding: false,
  },
  lowerPanel: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
    paddingHorizontal: ONBOARDING_SCREEN_LAYOUT.contentPaddingHorizontal,
    overflow: 'hidden',
  },
  cutHeader: {
    backgroundColor: ONBOARDING_COLORS.background,
    marginHorizontal: -ONBOARDING_SCREEN_LAYOUT.contentPaddingHorizontal,
  },
  cutLine: { height: 1.5, backgroundColor: ONBOARDING_COLORS.primary, width: '100%' },
  copyBlock: { alignItems: 'center' },
  title: {
    fontFamily: 'SFProText_Bold',
    color: ONBOARDING_COLORS.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: ONBOARDING_SCREEN_LAYOUT.contentGap,
  },
  titleAccent: { fontFamily: 'SFProText_Bold', color: ONBOARDING_COLORS.primary },
  subtitle: {
    fontFamily: 'SFProText_Regular',
    color: ONBOARDING_COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonBlock: {
    position: 'absolute',
    left: ONBOARDING_SCREEN_LAYOUT.contentPaddingHorizontal,
    right: ONBOARDING_SCREEN_LAYOUT.contentPaddingHorizontal,
  },
});
