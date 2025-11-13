import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countdown timer for resend code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showForgotPasswordModal && emailVerified && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showForgotPasswordModal, emailVerified, countdown]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (showForgotPasswordModal) {
      setCountdown(59);
      setEmailVerified(false);
      setForgotEmail('');
      setVerificationCode('');
    }
  }, [showForgotPasswordModal]);

  const handleLogin = () => {
    // Add login logic here
    console.log('Login pressed', { email, password });
    // Navigate to the Main (Home) tab stack
    // We register all stacks in RootNavigator, so this route is always available
    // Optionally, use reset to prevent going back to auth screens
    // @ts-ignore - stack names from parent
    // navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    // Simple navigate is enough for now
    // @ts-ignore - allow parent route name
    navigation.navigate('Main' as never);
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handleEmailChange = (text: string) => {
    setForgotEmail(text);
    // Simulate email verification when email is entered
    if (text.includes('@') && text.includes('.')) {
      setTimeout(() => {
        setEmailVerified(true);
      }, 500);
    } else {
      setEmailVerified(false);
    }
  };

  const handleProceed = () => {
    if (emailVerified && verificationCode.length > 0) {
      setShowForgotPasswordModal(false);
      setShowChangePasswordModal(true);
    }
  };

  const handleSavePassword = () => {
    // Add password change logic here
    console.log('Password changed');
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section with Decorative Elements */}
        <View style={styles.heroSection}>
          {/* Background Image */}
          <Image
            source={require('../../assets/login/hero-image.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Circular Gradient Center */}
          <View style={styles.circularGradient} />

          {/* Floating Decorative Elements */}
          <Image
            source={require('../../assets/login/usdt-coin.png')}
            style={[styles.floatingCoin, styles.usdtCoin]}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/login/bitcoin-coin.png')}
            style={[styles.floatingCoin, styles.bitcoinCoin]}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/login/nigeria-flag.png')}
            style={[styles.floatingFlag, styles.nigeriaFlag]}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/login/south-africa-flag.png')}
            style={[styles.floatingFlag, styles.southAfricaFlag]}
            resizeMode="contain"
          />
        </View>

        {/* Avatar/Memoji */}
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../assets/login/memoji.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={24}
                  color="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account ?{' '}
              <Text style={styles.registerLink} onPress={handleRegister}>
                Register
              </Text>
            </Text>
          </View>
        </View>

        {/* Background Decorative Circles */}
        <View style={[styles.decorativeCircle, styles.circleTop]} />
        <View style={[styles.decorativeCircle, styles.circleBottom]} />
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotPasswordModalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Forgot Password</Text>
              <TouchableOpacity
                onPress={() => setShowForgotPasswordModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Enter Email Address Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Enter Email Addresss</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Input your email address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={forgotEmail}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailVerified && (
                <View style={styles.verificationMessage}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#A9EF45" />
                  <Text style={styles.verificationText}>Email Address Verified</Text>
                </View>
              )}
              {emailVerified && (
                <Text style={styles.countdownText}>
                  A 5 digit code has been sent to your registered email. Resend in{' '}
                  <Text style={styles.countdownTimer}>
                    {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')} Sec
                  </Text>
                </Text>
              )}
            </View>

            {/* Input Code Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Input Code</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Input code sent to email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Proceed Button */}
            <TouchableOpacity
              style={[
                styles.modalProceedButton,
                (!emailVerified || verificationCode.length === 0) && styles.modalButtonDisabled,
              ]}
              onPress={handleProceed}
              disabled={!emailVerified || verificationCode.length === 0}
            >
              <Text style={styles.modalProceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changePasswordModalContent}>
            {/* Header */}
            <View style={styles.changePasswordHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setShowForgotPasswordModal(true);
                }}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.changePasswordTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setShowChangePasswordModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* New Password Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>New Password</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.modalEyeButton}
                >
                  <MaterialCommunityIcons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Re-enter Password Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Re-enter new Password</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Re-enter new Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.modalEyeButton}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                (newPassword.length === 0 || confirmPassword.length === 0) && styles.modalButtonDisabled,
              ]}
              onPress={handleSavePassword}
              disabled={newPassword.length === 0 || confirmPassword.length === 0}
            >
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    width: '100%',
    height: 426,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: 440,
    height: 469,
    position: 'absolute',
    top: -18,
    left: 0,
  },
  circularGradient: {
    position: 'absolute',
    width: 151,
    height: 151,
    borderRadius: 75.5,
    backgroundColor: '#1a2f4a',
    top: 141,
    left: '33%',
    opacity: 0.8,
  },
  floatingCoin: {
    position: 'absolute',
    width: 48,
    height: 48,
  },
  usdtCoin: {
    top: 62,
    left: 35,
    opacity: 0.9,
  },
  bitcoinCoin: {
    top: 328,
    left: 59,
    width: 51,
    height: 51,
  },
  floatingFlag: {
    position: 'absolute',
    width: 42,
    height: 42,
  },
  nigeriaFlag: {
    top: 348,
    right: 34,
  },
  southAfricaFlag: {
    top: 54,
    right: 13,
    opacity: 0.8,
  },
  avatarContainer: {
    position: 'absolute',
    top: 448,
    right: 17,
    width: 57,
    height: 57,
    borderRadius: 28.5,
    backgroundColor: '#A9EF45',
    overflow: 'hidden',
    zIndex: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 21,
  },
  titleSection: {
    marginTop: 17,
    marginBottom: 32,
  },
  title: {
    fontSize: 24, // 30 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 14,
  },
  inputGroup: {
    marginBottom: 21,
  },
  inputLabel: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  input: {
    flex: 1,
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '400',
    color: '#A9EF45',
  },
  loginButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '400',
    color: '#000000',
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 30,
  },
  registerText: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
  },
  registerLink: {
    color: '#A9EF45',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    opacity: 0.5,
  },
  circleTop: {
    top: 119,
    right: -72,
  },
  circleBottom: {
    bottom: -50,
    left: -14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  forgotPasswordModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 21,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: '50%',
  },
  changePasswordModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 21,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  changePasswordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  changePasswordTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 16,
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  modalEyeButton: {
    padding: 4,
  },
  verificationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A9EF45',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: 8,
  },
  countdownTimer: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  modalProceedButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalProceedButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  modalSaveButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
