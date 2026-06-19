import React from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./navigation/RootNavigator";
import { AuthProvider } from "./hooks/useAuth";
import { checkAndApplyOtaUpdate } from "./utils/otaUpdates";
import { markSplashReady, registerSplashHide } from "./utils/splashReady";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    SFPRODISPLAYREGULAR: require("./assets/fonts/SFPRODISPLAYREGULAR.OTF"),
    SFPRODISPLAYBOLD: require("./assets/fonts/SFPRODISPLAYBOLD.OTF"),
    SFPRODISPLAYMEDIUM: require("./assets/fonts/SFPRODISPLAYMEDIUM.OTF"),
    SFPRODISPLAYBLACKITALIC: require("./assets/fonts/SFPRODISPLAYBLACKITALIC.OTF"),
    SFPRODISPLAYHEAVYITALIC: require("./assets/fonts/SFPRODISPLAYHEAVYITALIC.OTF"),
    SFPRODISPLAYLIGHTITALIC: require("./assets/fonts/SFPRODISPLAYLIGHTITALIC.OTF"),
    SFPRODISPLAYSEMIBOLDITALIC: require("./assets/fonts/SFPRODISPLAYSEMIBOLDITALIC.OTF"),
    SFPRODISPLAYTHINITALIC: require("./assets/fonts/SFPRODISPLAYTHINITALIC.OTF"),
    SFPRODISPLAYULTRALIGHTITALIC: require("./assets/fonts/SFPRODISPLAYULTRALIGHTITALIC.OTF"),
    "Agbalumo-Regular": require("./assets/fonts/Agbalumo-Regular.ttf"),
  });

  useEffect(() => {
    registerSplashHide(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
    if (fontsLoaded || fontError) {
      markSplashReady("fonts");
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    checkAndApplyOtaUpdate();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
