import React from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Updates from "expo-updates";
import RootNavigator from "./navigation/RootNavigator";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isUpdateChecking, setIsUpdateChecking] = useState(true);

  // Check for updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Only check for updates in production builds (Updates.isEnabled is false in dev)
        if (Updates.isEnabled) {
          const update = await Updates.checkForUpdateAsync();
          
          if (update.isAvailable) {
            // Download and apply the update
            await Updates.fetchUpdateAsync();
            // Reload the app to apply the update
            await Updates.reloadAsync();
          } else {
            setIsUpdateChecking(false);
          }
        } else {
          setIsUpdateChecking(false);
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
        setIsUpdateChecking(false);
      }
    }

    checkForUpdates();
  }, []);

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
    // Hide splash screen once fonts are loaded and update check is complete
    if ((fontsLoaded || fontError) && !isUpdateChecking) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isUpdateChecking]);

  // Show nothing while checking for updates or loading fonts
  if ((!fontsLoaded && !fontError) || isUpdateChecking) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
