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
import OnboardingStars from './OnboardingStars';
import { ONBOARDING_COLORS } from './onboardingStyles';
import { markOnboardingSeen } from '../../utils/onboardingPersistence';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/** Green cut sits below center — ~60% from top in Figma. */
const CUT_Y = screenHeight * 0.6;

const OnboardingScreen3 = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const goWelcome = async () => {
    await markOnboardingSeen();
    navigation.navigate('Welcome' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Single continuous background (no panel seam) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={screenWidth} height={CUT_Y}>
          <Defs>
            <SvgLinearGradient id="screen3BaseNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#123a5c" stopOpacity="1" />
              <Stop offset="50%" stopColor="#0d2840" stopOpacity="1" />
              <Stop offset="100%" stopColor={ONBOARDING_COLORS.background} stopOpacity="1" />
            </SvgLinearGradient>
            <RadialGradient id="screen3BlueGlow" cx="50%" cy="30%" rx="80%" ry="56%">
              <Stop offset="0%" stopColor="#4a9bd4" stopOpacity="0.5" />
              <Stop offset="42%" stopColor="#236496" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#0d2840" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={screenWidth} height={CUT_Y} fill="url(#screen3BaseNavy)" />
          <Rect x={0} y={0} width={screenWidth} height={CUT_Y} fill="url(#screen3BlueGlow)" />
        </Svg>

        <OnboardingStars width={screenWidth} height={CUT_Y} />
      </View>

      {/* Top half: illustration + skip */}
      <View style={[styles.topSection, { height: CUT_Y, paddingTop: insets.top + 6 }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={[styles.progressBar, styles.progressActive]} />
        </View>

        <View style={styles.heroWrap}>
          <Image
            source={require('../../assets/onboarding/main-illustration-3.png')}
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
            Convert Easily Between{'\n'}
            Different <Text style={styles.titleAccent}>African</Text> Currencies
          </Text>
          <Text style={styles.subtitle}>
            Once you register dedicated fiat wallets for currencies in Africa and crypto wallets
            will be created for you
          </Text>
        </View>

        <TouchableOpacity
          style={styles.proceedButton}
          onPress={goWelcome}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Proceed"
        >
          <Text style={styles.proceedText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen3;

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
  proceedButton: {
    height: 64,
    backgroundColor: ONBOARDING_COLORS.primary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginBottom: 4,
  },
  proceedText: {
    fontFamily: 'SFPRODISPLAYMEDIUM',
    fontSize: 16,
    color: ONBOARDING_COLORS.background,
  },
});
