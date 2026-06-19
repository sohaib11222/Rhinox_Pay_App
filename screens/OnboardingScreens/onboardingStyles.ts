import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export const ONBOARDING_TOP_FLEX = 53;
export const ONBOARDING_BOTTOM_FLEX = 47;

export const ONBOARDING_COLORS = {
  background: '#020C19',
  primary: '#A9EF45',
  white: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.55)',
  border: 'rgba(255, 255, 255, 0.28)',
};

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  topSection: {
    flex: ONBOARDING_TOP_FLEX,
    overflow: 'hidden',
  },
  topContent: {
    flex: 1,
    zIndex: 2,
  },
  bottomSection: {
    flex: ONBOARDING_BOTTOM_FLEX,
    backgroundColor: ONBOARDING_COLORS.background,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 6,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 100,
  },
  progressActive: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  illustration: {
    width: width * 0.68,
    height: height * 0.27,
    maxWidth: 300,
    maxHeight: height * 0.3,
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '400',
    color: ONBOARDING_COLORS.white,
  },
  textSection: {
    alignItems: 'center',
    paddingTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: ONBOARDING_COLORS.white,
    lineHeight: 34,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: ONBOARDING_COLORS.primary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '300',
    color: ONBOARDING_COLORS.muted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  actionSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  proceedButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: ONBOARDING_COLORS.background,
  },
});
