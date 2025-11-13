import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen1 from "../screens/OnboardingScreens/OnboardingScreen1";
import OnboardingScreen2 from "../screens/OnboardingScreens/OnboardingScreen2";
import OnboardingScreen3 from "../screens/OnboardingScreens/OnboardingScreen3";
import WelcomeScreen from "../screens/OnboardingScreens/WelcomeScreen";
import LoginScreen from "../screens/AuthScreens/LoginScreen";
import RegisterScreen from "../screens/AuthScreens/RegisterScreen";
import SetBiometrics from "../screens/AuthScreens/SetBiometrics";
import Verification from "../screens/AuthScreens/Verification";
import KYC from "../screens/AuthScreens/KYC";
import FacialRegister from "../screens/AuthScreens/FacialRegister";

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
      <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
      <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SetBiometrics" component={SetBiometrics} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="KYC" component={KYC} />
      <Stack.Screen name="FacialRegister" component={FacialRegister} />
    </Stack.Navigator>
  );
}

