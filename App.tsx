import React from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import RootNavigator from "./navigation/RootNavigator";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // SF Pro Display fonts
    SFPRODISPLAYREGULAR: require("./assets/fonts/SFPRODISPLAYREGULAR.OTF"),
    SFPRODISPLAYBOLD: require("./assets/fonts/SFPRODISPLAYBOLD.OTF"),
    SFPRODISPLAYMEDIUM: require("./assets/fonts/SFPRODISPLAYMEDIUM.OTF"),
    SFPRODISPLAYBLACKITALIC: require("./assets/fonts/SFPRODISPLAYBLACKITALIC.OTF"),
    SFPRODISPLAYHEAVYITALIC: require("./assets/fonts/SFPRODISPLAYHEAVYITALIC.OTF"),
    SFPRODISPLAYLIGHTITALIC: require("./assets/fonts/SFPRODISPLAYLIGHTITALIC.OTF"),
    SFPRODISPLAYSEMIBOLDITALIC: require("./assets/fonts/SFPRODISPLAYSEMIBOLDITALIC.OTF"),
    SFPRODISPLAYTHINITALIC: require("./assets/fonts/SFPRODISPLAYTHINITALIC.OTF"),
    SFPRODISPLAYULTRALIGHTITALIC: require("./assets/fonts/SFPRODISPLAYULTRALIGHTITALIC.OTF"),
    // Agbalumo
    "Agbalumo-Regular": require("./assets/fonts/Agbalumo-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <RootNavigator />;
}
