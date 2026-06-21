import React, { useEffect, useRef } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "./OnboardingNavigator";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { CustomAlertProvider } from "../components";
import AppLoadingScreen from "../components/AppLoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { markSplashReady } from "../utils/splashReady";

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const prevAuthenticatedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      markSplashReady("auth");
    }
  }, [isLoading]);

  // Switch stacks when auth state changes (login/logout). Skip first paint — initialRouteName handles it.
  useEffect(() => {
    if (isLoading || !navigationRef.current) {
      return;
    }

    if (prevAuthenticatedRef.current === null) {
      prevAuthenticatedRef.current = isAuthenticated;
      return;
    }

    if (prevAuthenticatedRef.current === isAuthenticated) {
      return;
    }

    prevAuthenticatedRef.current = isAuthenticated;

    navigationRef.current.reset({
      index: 0,
      routes: [{ name: isAuthenticated ? "Main" : "Onboarding" }],
    });
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <CustomAlertProvider>
        <AppLoadingScreen />
      </CustomAlertProvider>
    );
  }

  return (
    <CustomAlertProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={isAuthenticated ? "Main" : "Onboarding"}
        >
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          <RootStack.Screen name="Auth" component={AuthNavigator} />
          <RootStack.Screen name="Main" component={MainNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </CustomAlertProvider>
  );
}
