import React, { useMemo, useEffect, useRef } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import OnboardingNavigator from "./OnboardingNavigator";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { CustomAlertProvider } from "../components";
import { useAuth } from "../hooks/useAuth";

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const hasNavigatedRef = useRef(false);

  // Determine initial route based on authentication state
  const initialRouteName = useMemo(() => {
    if (isLoading) {
      return "Onboarding"; // Default while loading
    }
    return isAuthenticated ? "Main" : "Onboarding";
  }, [isAuthenticated, isLoading]);

  // Navigate programmatically after auth check completes
  useEffect(() => {
    if (!isLoading && navigationRef.current && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      if (isAuthenticated) {
        console.log('[RootNavigator] ✅ Navigating to Main programmatically');
        // Use setTimeout to ensure Navigator is ready
        setTimeout(() => {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }, 100);
      } else {
        console.log('[RootNavigator] ❌ User not authenticated, staying on Onboarding');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Reset navigation flag when auth state changes
  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [isAuthenticated]);

  console.log('[RootNavigator] Render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'initialRouteName:', initialRouteName);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <CustomAlertProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020c19' }}>
          <ActivityIndicator size="large" color="#A9EF45" />
        </View>
      </CustomAlertProvider>
    );
  }

  // If authenticated, render Main navigator directly
  // Otherwise render full stack with Onboarding as initial
  if (isAuthenticated) {
    console.log('[RootNavigator] Rendering authenticated navigator (Main)');
    return (
      <CustomAlertProvider>
        <NavigationContainer ref={navigationRef}>
          <RootStack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Main"
          >
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
            <RootStack.Screen name="Auth" component={AuthNavigator} />
            <RootStack.Screen name="Main" component={MainNavigator} />
          </RootStack.Navigator>
        </NavigationContainer>
      </CustomAlertProvider>
    );
  }

  console.log('[RootNavigator] Rendering unauthenticated navigator (Onboarding)');
  return (
    <CustomAlertProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Onboarding"
        >
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          <RootStack.Screen name="Auth" component={AuthNavigator} />
          <RootStack.Screen name="Main" component={MainNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </CustomAlertProvider>
  );
}
