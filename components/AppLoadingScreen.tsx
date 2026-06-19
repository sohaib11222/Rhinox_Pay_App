import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

const AppLoadingScreen: React.FC = () => (
  <View style={styles.container}>
    <Image
      source={require('../assets/onboarding/welcome-logo-pill.png')}
      style={styles.logo}
      resizeMode="contain"
    />
    <ActivityIndicator size="large" color="#A9EF45" style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 48,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});

export default AppLoadingScreen;
