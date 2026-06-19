import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingTopBackground from './OnboardingTopBackground';
import OnboardingGlowDivider from './OnboardingGlowDivider';
import { onboardingStyles } from './onboardingStyles';

type OnboardingScreenLayoutProps = {
  activeStep: 1 | 2 | 3;
  illustration: ImageSourcePropType;
  title: React.ReactNode;
  subtitle: string;
  onSkip: () => void;
  bottomAction: React.ReactNode;
};

const OnboardingScreenLayout = ({
  activeStep,
  illustration,
  title,
  subtitle,
  onSkip,
  bottomAction,
}: OnboardingScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={onboardingStyles.container}>
      <StatusBar barStyle="light-content" />

      <View style={onboardingStyles.topSection}>
        <OnboardingTopBackground starsOnly />

        <View style={[onboardingStyles.topContent, { paddingTop: insets.top }]}>
          <View style={onboardingStyles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  onboardingStyles.progressBar,
                  step === activeStep && onboardingStyles.progressActive,
                ]}
              />
            ))}
          </View>

          <View style={onboardingStyles.illustrationWrap}>
            <Image source={illustration} style={onboardingStyles.illustration} resizeMode="contain" />
          </View>

          <TouchableOpacity
            style={onboardingStyles.skipButton}
            onPress={onSkip}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={onboardingStyles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <OnboardingGlowDivider />

      <View style={onboardingStyles.bottomSection}>
        <View style={onboardingStyles.textSection}>
          <Text style={onboardingStyles.title}>{title}</Text>
          <Text style={onboardingStyles.subtitle}>{subtitle}</Text>
        </View>

        <View style={onboardingStyles.actionSection}>{bottomAction}</View>
      </View>
    </View>
  );
};

export default OnboardingScreenLayout;
