import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen1 from "../screens/OnboardingScreens/OnboardingScreen1";
import OnboardingScreen2 from "../screens/OnboardingScreens/OnboardingScreen2";
import OnboardingScreen3 from "../screens/OnboardingScreens/OnboardingScreen3";
import WelcomeScreen from "../screens/OnboardingScreens/WelcomeScreen";
import AuthNavigator from "./AuthNavigator";
import AppLoadingScreen from "../components/AppLoadingScreen";
import { HAS_SEEN_ONBOARDING_KEY, HAS_SEEN_WELCOME_KEY, FORCE_ONBOARDING_ON_LAUNCH } from "../constants/onboarding";
import { markSplashReady } from "../utils/splashReady";

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(
    FORCE_ONBOARDING_ON_LAUNCH ? "Onboarding1" : null
  );

  useEffect(() => {
    if (FORCE_ONBOARDING_ON_LAUNCH) {
      markSplashReady("onboarding");
      return;
    }

    Promise.all([
      AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY),
      AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY),
    ])
      .then(([seenWelcome, seenOnboarding]) => {
        if (seenWelcome === "true") {
          setInitialRoute("Auth");
        } else if (seenOnboarding === "true") {
          setInitialRoute("Welcome");
        } else {
          setInitialRoute("Onboarding1");
        }
      })
      .catch(() => setInitialRoute("Onboarding1"))
      .finally(() => markSplashReady("onboarding"));
  }, []);

  if (!initialRoute) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
      <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
      <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
    </Stack.Navigator>
  );
}
