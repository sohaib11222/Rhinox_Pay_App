import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemedText } from '../../components';

const SetBiometrics = () => {
  const navigation = useNavigation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'setup' | 'confirm'>('setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setIsBiometricAvailable(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setIsBiometricAvailable(false);
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsBiometricAvailable(true);
      
      // Determine biometric type
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  const handleSetupBiometrics = async () => {
    if (!isBiometricAvailable) {
      // If biometrics not available, go directly to PIN setup
      setShowPinModal(true);
      return;
    }

    setIsScanning(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${biometricType}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        // Biometric setup successful
        Alert.alert(
          'Biometrics Setup Successful',
          `You can now use ${biometricType} to login.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // TODO: Save biometric preference to backend/AsyncStorage
                navigation.navigate('Verification' as never);
              },
            },
          ]
        );
      } else {
        // User cancelled or authentication failed
        if (result.error === 'user_cancel') {
          // User cancelled - do nothing
        } else if (result.error === 'user_fallback') {
          // User chose to use PIN instead
          setShowPinModal(true);
        } else {
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication failed. Please try again or set up a PIN.',
            [
              {
                text: 'Try Again',
                onPress: handleSetupBiometrics,
              },
              {
                text: 'Setup PIN',
                onPress: () => setShowPinModal(true),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during biometric authentication. Please try again or set up a PIN.',
        [
          {
            text: 'Setup PIN',
            onPress: () => setShowPinModal(true),
          },
          {
            text: 'Skip',
            onPress: handleSkip,
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Verification' as never);
  };

  const handlePinPress = (num: string) => {
    // Highlight the pressed button
    setLastPressedButton(num);
    setTimeout(() => {
      setLastPressedButton(null);
    }, 200);

    if (pinStep === 'setup') {
      if (pin.length < 5) {
        const newPin = pin + num;
        setPin(newPin);

        if (newPin.length === 5) {
          setTimeout(() => {
            setPinStep('confirm');
          }, 300);
        }
      }
    } else {
      if (confirmPin.length < 5) {
        const newConfirmPin = confirmPin + num;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === 5) {
          setTimeout(() => {
            setShowPinModal(false);
            navigation.navigate('Verification' as never);
          }, 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (pinStep === 'setup') {
      if (pin.length > 0) {
        setPin(pin.slice(0, -1));
      }
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <ThemedText style={styles.headerTitle}>Setup Biometrics</ThemedText>
        </View>
      </View>

      {/* Fingerprint Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="fingerprint" size={84} color="#A9EF45" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.contentTitle}>Setup Biometrics</ThemedText>
        <ThemedText style={styles.contentSubtitle}>
          Once setup you can login with biometrics
        </ThemedText>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {isBiometricAvailable && (
          <TouchableOpacity
            style={[styles.proceedButton, isScanning && styles.proceedButtonDisabled]}
            onPress={handleSetupBiometrics}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <ThemedText style={styles.proceedButtonText}>
                Use {biometricType}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.pinButton,
            isBiometricAvailable && styles.pinButtonWithBiometric,
          ]}
          onPress={() => setShowPinModal(true)}
          disabled={isScanning}
        >
          <ThemedText style={styles.pinButtonText}>Setup PIN</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isScanning}
        >
          <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.pinContainer}>
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowPinModal(false)}
            >
              <View style={styles.backCircle}>
                <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.headerTitleWrapper}>
              <ThemedText style={styles.headerTitle}>Setup Pin</ThemedText>
            </View>
          </View>

          {/* Shield Icon */}
          <View style={styles.pinIconContainer}>
            <Image
              source={require('../../assets/Group 49.png')}
              style={{ width: 105, height: 105 }}
              resizeMode="contain"
            />
          </View>

          {/* Content */}
          <View style={styles.pinContent}>
            <ThemedText style={styles.contentTitle}>
              {pinStep === 'setup' ? 'Setup Pin' : 'Re-enter Pin'}
            </ThemedText>
            <ThemedText style={styles.contentSubtitle}>
              Setup your pin to use for your transactions
            </ThemedText>
          </View>

          {/* PIN Display - pill input bar with 5 fields */}
          <View style={styles.pinBar}>
            <View style={styles.pinBarInner}>
              {[0, 1, 2, 3, 4].map((index) => {
                const currentPin = pinStep === 'setup' ? pin : confirmPin;
                const hasValue = index < currentPin.length;
                const digit = hasValue ? currentPin[index] : null;
                return (
                  <View key={index} style={styles.pinSlot}>
                    {hasValue ? (
                      <ThemedText style={styles.pinSlotText}>{digit}</ThemedText>
                    ) : (
                      <ThemedText style={styles.pinSlotAsterisk}>*</ThemedText>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Numpad */}
          <View style={styles.numpad}>
            <View style={styles.numpadRow}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numpadButton}
                  onPress={() => handlePinPress(num.toString())}
                >
                  <View
                    style={[
                      styles.numpadCircle,
                      lastPressedButton === num.toString() && styles.numpadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.numpadText,
                        lastPressedButton === num.toString() && styles.numpadTextPressed,
                      ]}
                    >
                      {num}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.numpadRow}>
              {[4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numpadButton}
                  onPress={() => handlePinPress(num.toString())}
                >
                  <View
                    style={[
                      styles.numpadCircle,
                      lastPressedButton === num.toString() && styles.numpadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.numpadText,
                        lastPressedButton === num.toString() && styles.numpadTextPressed,
                      ]}
                    >
                      {num}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.numpadRow}>
              {[7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numpadButton}
                  onPress={() => handlePinPress(num.toString())}
                >
                  <View
                    style={[
                      styles.numpadCircle,
                      lastPressedButton === num.toString() && styles.numpadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.numpadText,
                        lastPressedButton === num.toString() && styles.numpadTextPressed,
                      ]}
                    >
                      {num}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.numpadRow}>
              <View style={styles.numpadButton}>
                <View style={styles.ghostCircle} />
              </View>
              <TouchableOpacity
                style={styles.numpadButton}
                onPress={() => handlePinPress('0')}
              >
                <View
                  style={[
                    styles.numpadCircle,
                    lastPressedButton === '0' && styles.numpadCirclePressed,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.numpadText,
                      lastPressedButton === '0' && styles.numpadTextPressed,
                    ]}
                  >
                    0
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numpadButton}
                onPress={handleBackspace}
              >
                <View style={styles.backspaceSquare}>
                  <MaterialCommunityIcons name="backspace-outline" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.pinButtonContainer}>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                (pinStep === 'setup' ? pin.length !== 5 : confirmPin.length !== 5) &&
                  styles.proceedButtonDisabled,
              ]}
              onPress={() => {
                if (pinStep === 'setup' && pin.length === 5) {
                  // PIN setup complete, move to confirm
                  setPinStep('confirm');
                  setConfirmPin('');
                } else if (pinStep === 'confirm' && confirmPin.length === 5) {
                  // Verify PINs match
                  if (pin === confirmPin) {
                    // TODO: Save PIN to backend/secure storage
                    setShowPinModal(false);
                    navigation.navigate('Verification' as never);
                  } else {
                    Alert.alert(
                      'PIN Mismatch',
                      'The PINs do not match. Please try again.',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            setPinStep('setup');
                            setPin('');
                            setConfirmPin('');
                          },
                        },
                      ]
                    );
                  }
                }
              }}
              disabled={
                pinStep === 'setup' ? pin.length !== 5 : confirmPin.length !== 5
              }
            >
              <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SetBiometrics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,// 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 20,
  },
  headerTitleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#031020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  contentTitle: {
    fontSize: 20, // 24 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 18,
  },
  contentSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 17,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  pinButton: {
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pinButtonWithBiometric: {
    marginTop: 12,
  },
  pinButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  skipButton: {
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  pinContainer: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  pinIconContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  pinContent: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
  pinBar: {
    alignItems: 'center',
    marginTop: 22,
  },
  pinBarInner: {
    height: 60,
    width: 248,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 100,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pinSlot: {
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSlotText: {
    fontSize: 20, // 24 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
  },
  pinSlotAsterisk: {
    fontSize: 19.2, // 24 * 0.8
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  numpad: {
    marginTop: 35,
    paddingHorizontal: 20,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numpadButton: {
    width: 117,
    alignItems: 'center',
  },
  numpadCircle: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    backgroundColor: '#081729',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadText: {
    fontSize: 19.2, // 24 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
  },
  numpadCirclePressed: {
    backgroundColor: '#A9EF45',
  },
  numpadTextPressed: {
    color: '#000000',
  },
  ghostCircle: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backspaceSquare: {
    width: 53,
    height: 53,

    borderRadius: 26.5,
    backgroundColor: '#081729',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonContainer: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    right: 20,

  },
});

