import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import OnboardingCutGlow, { GLOW_HEIGHT } from './OnboardingCutGlow';
import OnboardingNextBarNative from './OnboardingNextBarNative';
import OnboardingStars from './OnboardingStars';
import { ONBOARDING_COLORS } from './onboardingStyles';
import { markOnboardingSeen } from '../../utils/onboardingPersistence';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/** Green cut sits below center — ~60% from top in Figma. */
const CUT_Y = screenHeight * 0.6;

const OnboardingScreen1 = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const goWelcome = async () => {
    await markOnboardingSeen();
    navigation.navigate('Welcome' as never);
  };
  const goNext = () => navigation.navigate('Onboarding2' as never);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Single continuous background (no panel seam) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={screenWidth} height={CUT_Y}>
          <Defs>
            {/* overall navy lift, brighter near top, fading toward the cut */}
            <SvgLinearGradient id="screen1BaseNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#123a5c" stopOpacity="1" />
              <Stop offset="50%" stopColor="#0d2840" stopOpacity="1" />
              <Stop offset="100%" stopColor={ONBOARDING_COLORS.background} stopOpacity="1" />
            </SvgLinearGradient>
            {/* central blue glow behind the illustration */}
            <RadialGradient id="screen1BlueGlow" cx="50%" cy="30%" rx="80%" ry="56%">
              <Stop offset="0%" stopColor="#4a9bd4" stopOpacity="0.5" />
              <Stop offset="42%" stopColor="#236496" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#0d2840" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={screenWidth} height={CUT_Y} fill="url(#screen1BaseNavy)" />
          <Rect x={0} y={0} width={screenWidth} height={CUT_Y} fill="url(#screen1BlueGlow)" />
        </Svg>

        <OnboardingStars width={screenWidth} height={CUT_Y} />
      </View>

      {/* Top half: illustration + skip */}
      <View style={[styles.topSection, { height: CUT_Y, paddingTop: insets.top + 6 }]}>
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>

        <View style={styles.heroWrap}>
          <Image
            source={require('../../assets/onboarding/main-illustration-1.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={goWelcome}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* The glowing cut */}
      <OnboardingCutGlow />

      {/* Bottom half: copy + actions */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>
            Send and Receive Money{'\n'}
            Across <Text style={styles.titleAccent}>Africa</Text>
          </Text>
          <Text style={styles.subtitle}>
            You can send money across Africa via different channels
          </Text>
        </View>

        <OnboardingNextBarNative variant="dual" onNext={goNext} onHome={goWelcome} />
      </View>
    </View>
  );
};

export default OnboardingScreen1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  topSection: {
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  progressActive: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  heroWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: screenWidth * 0.92,
    height: '100%',
  },
  skipButton: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 34,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '400',
    color: ONBOARDING_COLORS.white,
  },
  bottomSection: {
    flex: 1,
    marginTop: -GLOW_HEIGHT + 2,
    paddingTop: GLOW_HEIGHT * 0.5,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  copyBlock: {
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontFamily: 'SFPRODISPLAYBOLD',
    fontSize: 27,
    color: ONBOARDING_COLORS.white,
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  titleAccent: {
    fontFamily: 'SFPRODISPLAYBOLD',
    color: ONBOARDING_COLORS.primary,
  },
  subtitle: {
    fontFamily: 'SFPRODISPLAYREGULAR',
    fontSize: 13,
    color: ONBOARDING_COLORS.muted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
