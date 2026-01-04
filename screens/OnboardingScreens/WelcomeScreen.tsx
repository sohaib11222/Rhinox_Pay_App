import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/welcome_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Bottom Section with Two Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 10,
  },
  loginButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
});

