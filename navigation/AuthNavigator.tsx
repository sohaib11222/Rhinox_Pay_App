import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/AuthScreens/LoginScreen";
import RegisterScreen from "../screens/AuthScreens/RegisterScreen";
import SetBiometrics from "../screens/AuthScreens/SetBiometrics";
import Verification from "../screens/AuthScreens/Verification";
import KYC from "../screens/AuthScreens/KYC";
import FacialRegister from "../screens/AuthScreens/FacialRegister";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SetBiometrics" component={SetBiometrics} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="KYC" component={KYC} />
      <Stack.Screen name="FacialRegister" component={FacialRegister} />
    </Stack.Navigator>
  );
}
