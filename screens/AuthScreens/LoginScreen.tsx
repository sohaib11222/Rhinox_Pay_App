import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { ThemedText, KeyboardSafeScreen, KeyboardAwareTextInput } from '../../components';
import { useLogin, useForgotPassword, useVerifyPasswordResetOtp, useResetPassword, useVerifyDeviceLogin } from '../../mutations/auth.mutations';
import { getBiometricEnabled, hasStoredAuthSession, setAccessToken, setRefreshToken, clearTokens, setBiometricLocked } from '../../utils/apiClient';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import OtpInput from '../../components/OtpInput';
import KeyboardSafeModal, { useKeyboardSafeModalInput, KeyboardAwareModalTextInput } from '../../components/KeyboardSafeModal';
import { OTP_LENGTH } from '../../constants/otp';
import {
  getBiometricCapability,
  getBiometricPromptMessage,
  hasStoredBiometricSession,
  promptBiometricAuth,
  restoreSessionFromStorage,
} from '../../utils/biometricAuth';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert } from '../../utils/customAlert';
import { useAuth } from '../../hooks/useAuth';
import { getAuthHeroHeight, getAuthHeroImageWidth } from '../../utils/responsiveAuth';

function ModalOtpInput(props: React.ComponentProps<typeof OtpInput>) {
  const { onFocus } = useKeyboardSafeModalInput(40);
  return <OtpInput {...props} onInputFocus={onFocus} />;
}

const LoginScreen = () => {
  const navigation = useNavigation();
  const { height: windowHeight } = useWindowDimensions();
  const heroHeight = useMemo(() => getAuthHeroHeight(), [windowHeight]);
  const heroImageWidth = useMemo(() => getAuthHeroImageWidth(), [windowHeight]);
  const { setAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [canUseBiometricLogin, setCanUseBiometricLogin] = useState(false);
  const [showDeviceVerifyModal, setShowDeviceVerifyModal] = useState(false);
  const [pendingLoginToken, setPendingLoginToken] = useState('');
  const [deviceOtpCode, setDeviceOtpCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId).catch(() => {});
  }, []);

  const navigateToMain = () => {
    const rootNavigation = navigation.getParent()?.getParent();
    if (rootNavigation) {
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        })
      );
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      })
    );
  };

  const completeLoginSuccess = async (data: any) => {
    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;
    await clearTokens();
    await setBiometricLocked(false);
    if (accessToken) {
      await setAccessToken(accessToken);
      if (refreshToken) await setRefreshToken(refreshToken);
      await setAuthenticated(accessToken);
    }
    await checkBiometricSession();
    navigateToMain();
  };

  const verifyDeviceMutation = useVerifyDeviceLogin({
    onSuccess: async (data) => {
      setShowDeviceVerifyModal(false);
      showSuccessAlert(
        'Device Verified',
        'You can enable biometric login from the fingerprint icon after signing in.',
        () => completeLoginSuccess(data)
      );
    },
    onError: (error: any) => {
      showErrorAlert('Verification Failed', error.message || 'Invalid or expired code.');
    },
  });

  // Login mutation
  const loginMutation = useLogin({
    onSuccess: async (data) => {
      if (data?.data?.requiresDeviceVerification) {
        setPendingLoginToken(data.data.pendingLoginToken);
        setDeviceOtpCode(Array(OTP_LENGTH).fill(''));
        setShowDeviceVerifyModal(true);
        showInfoAlert(
          'Verify New Device',
          data.data.message || 'Enter the code sent to your email to continue.'
        );
        return;
      }
      await completeLoginSuccess(data);
    },
    onError: (error: any) => {
      if (error?.code === 'EMAIL_NOT_VERIFIED' && error?.data?.userId) {
        showWarningAlert(
          'Email Verification Required',
          error.message || 'Please verify your email before logging in.',
          () => {
            navigation.navigate(
              'Register' as never,
              {
                verifyUserId: String(error.data.userId),
                verifyEmail: email.trim(),
              } as never
            );
          }
        );
        return;
      }
      showErrorAlert(
        !error?.status ? 'Connection Problem' : 'Login Failed',
        error.message || 'Invalid email or password. Please try again.'
      );
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: (data) => {
      setEmailVerified(true);
      setForgotPasswordStep('otp');
      setCountdown(59); // Start countdown
      showSuccessAlert(
        'OTP Sent',
        'A 6-digit code has been sent to your email address.'
      );
    },
    onError: (error: any) => {
      console.error('[LoginScreen] Forgot password error:', error);
      showErrorAlert(
        'Error',
        error.message || 'Failed to send password reset code. Please try again.'
      );
    },
  });

  // Verify password reset OTP mutation
  const verifyOtpMutation = useVerifyPasswordResetOtp({
    onSuccess: (data) => {
      setOtpVerified(true);
      setForgotPasswordStep('reset');
      setShowForgotPasswordModal(false);
      setShowChangePasswordModal(true);
      showSuccessAlert(
        'OTP Verified',
        'OTP verified successfully. You can now reset your password.'
      );
    },
    onError: (error: any) => {
      console.error('[LoginScreen] OTP verification error:', error);
      showErrorAlert(
        'Verification Failed',
        error.message || 'Invalid or expired OTP code. Please try again.'
      );
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      showSuccessAlert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please login with your new password.',
        () => {
          // Reset all states
          setShowForgotPasswordModal(false);
          setShowChangePasswordModal(false);
          setForgotEmail('');
          setVerificationCode(Array(OTP_LENGTH).fill(''));
          setEmailVerified(false);
          setOtpVerified(false);
          setNewPassword('');
          setConfirmPassword('');
          setForgotPasswordStep('email');
          setCountdown(59);
        }
      );
    },
    onError: (error: any) => {
      console.error('[LoginScreen] Password reset error:', error);
      showErrorAlert(
        'Reset Failed',
        error.message || 'Failed to reset password. Please try again.'
      );
    },
  });

  // Countdown timer for resend code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showForgotPasswordModal && emailVerified && forgotPasswordStep === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showForgotPasswordModal, emailVerified, forgotPasswordStep, countdown]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (showForgotPasswordModal && forgotPasswordStep === 'email') {
      setCountdown(59);
      setEmailVerified(false);
      setOtpVerified(false);
    }
  }, [showForgotPasswordModal, forgotPasswordStep]);

  // Check token availability
  const checkBiometricSession = async () => {
    try {
      const [hasSession, biometricEnabled] = await Promise.all([
        hasStoredAuthSession(),
        getBiometricEnabled(),
      ]);
      setCanUseBiometricLogin(biometricEnabled && hasSession);
    } catch (error) {
      console.error('[LoginScreen] Error checking biometric session:', error);
      setCanUseBiometricLogin(false);
    }
  };

  // Check biometric availability and preference on mount
  useEffect(() => {
    checkBiometrics();
    loadBiometricPreference();
    checkBiometricSession();
  }, []);

  // Re-check session when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadBiometricPreference();
      checkBiometricSession();
    }, [])
  );

  const loadBiometricPreference = async () => {
    try {
      const enabled = await getBiometricEnabled();
      setBiometricLoginEnabled(enabled);
      console.log('[LoginScreen] Biometric login enabled:', enabled);
    } catch (error) {
      console.error('[LoginScreen] Error loading biometric preference:', error);
      setBiometricLoginEnabled(false);
    }
  };

  const checkBiometrics = async () => {
    const capability = await getBiometricCapability();
    setIsBiometricAvailable(capability.isAvailable);
    setBiometricType(capability.type);
  };

  const handleBiometricLogin = async () => {
    if (!biometricLoginEnabled) {
      showWarningAlert(
        'Biometric Login Disabled',
        'Enable Login with biometrics in Settings > Security, or sign in with email and password.'
      );
      return;
    }

    if (!isBiometricAvailable) {
      showWarningAlert(
        'Biometrics Not Available',
        'Your device does not support biometrics or fingerprint is not set up. Please use email and password to login.'
      );
      return;
    }

    const hasSession = await hasStoredBiometricSession();
    if (!hasSession) {
      showWarningAlert(
        'Sign In Required',
        'Please login with email and password once. After that, biometric login will work when you return.'
      );
      setCanUseBiometricLogin(false);
      return;
    }

    setIsScanning(true);
    try {
      const capability = await getBiometricCapability();
      const authResult = await promptBiometricAuth({
        promptMessage: getBiometricPromptMessage(capability, 'login'),
      });

      if (!authResult.success) {
        if (authResult.error !== 'user_cancel') {
          showErrorAlert(
            'Authentication Failed',
            'Biometric authentication failed. Please try again or use email and password.'
          );
        }
        return;
      }

      const activeToken = await restoreSessionFromStorage();
      if (!activeToken) {
        showErrorAlert(
          'Authentication Failed',
          'Could not restore your session. Please login with email and password.'
        );
        setCanUseBiometricLogin(false);
        return;
      }

      await setAuthenticated(activeToken);
      navigateToMain();
    } catch (error) {
      console.error('Biometric authentication error:', error);
      showErrorAlert(
        'Error',
        'An error occurred during biometric authentication. Please try again or use email and password.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showWarningAlert('Validation Error', 'Please enter both email and password.');
      return;
    }

    const resolvedDeviceId = deviceId || (await getOrCreateDeviceId());
    setDeviceId(resolvedDeviceId);

    loginMutation.mutate({
      email: email.trim(),
      password: password,
      deviceId: resolvedDeviceId,
      deviceName:
        Platform.OS === 'ios'
          ? `iPhone (${Platform.Version})`
          : `Android Device (${Platform.Version})`,
    });
  };

  const handleVerifyDeviceOtp = () => {
    const code = deviceOtpCode.join('');
    if (code.length !== OTP_LENGTH) {
      showWarningAlert('Validation Error', `Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    verifyDeviceMutation.mutate({
      pendingLoginToken,
      code,
      deviceId,
      deviceName:
        Platform.OS === 'ios'
          ? `iPhone (${Platform.Version})`
          : `Android Device (${Platform.Version})`,
    });
  };

  // Check if login button should be enabled
  const isLoginButtonEnabled = email.trim().length > 0 && password.trim().length > 0 && !loginMutation.isPending;

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setForgotPasswordStep('email');
    setForgotEmail('');
    setVerificationCode(Array(OTP_LENGTH).fill(''));
    setEmailVerified(false);
    setOtpVerified(false);
    setNewPassword('');
    setConfirmPassword('');
    setCountdown(59);
  };

  const handleEmailChange = (text: string) => {
    setForgotEmail(text);
    setEmailVerified(false);
  };

  const handleSendOtp = () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@') || !forgotEmail.includes('.')) {
      showWarningAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    forgotPasswordMutation.mutate({ email: forgotEmail.trim() });
  };

  const handleVerifyOtp = () => {
    const otp = verificationCode.join('');
    if (otp.length !== OTP_LENGTH) {
      showWarningAlert('Validation Error', `Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }

    verifyOtpMutation.mutate({
      email: forgotEmail.trim(),
      otp,
    });
  };

  const handleSavePassword = () => {
    if (newPassword.length === 0 || confirmPassword.length === 0) {
      showWarningAlert('Validation Error', 'Please enter both new password and confirmation.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarningAlert('Validation Error', 'Passwords do not match. Please try again.');
      return;
    }

    if (newPassword.length < 8) {
      showWarningAlert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }

    resetPasswordMutation.mutate({
      email: forgotEmail.trim(),
      otp: verificationCode.join(''),
      newPassword: newPassword,
    });
  };

const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <>
      <KeyboardSafeScreen>
      <StatusBar barStyle="dark-content" backgroundColor="#020c19" />
        {/* Hero Section with Decorative Elements */}
        <View style={[styles.heroSection, { height: heroHeight }]}>
          {/* Background Image */}
          <Image
            source={require('../../assets/login/hero-image.png')}
            style={[styles.heroImage, { width: heroImageWidth, height: heroHeight * 1.1 }]}
            resizeMode="cover"
          />

          {/* Circular Gradient Center */}
          <View style={styles.circularGradient}>
            <Image
              source={require('../../assets/login/rhinox-logo.png')}
              style={styles.circularLogo}
              resizeMode="contain"
            />
          </View>

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
            <ThemedText style={styles.title}>Login</ThemedText>
            <ThemedText style={styles.subtitle}>Login to your account</ThemedText>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <View style={styles.inputWrapper}>
                <KeyboardAwareTextInput
                  style={styles.input}
                  placeholder="Input Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={isScanning || !isBiometricAvailable || !biometricLoginEnabled}
                  style={styles.fingerprintButton}
                  accessibilityLabel="Login with fingerprint"
                  accessibilityRole="button"
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={24}
                      color={isBiometricAvailable && biometricLoginEnabled && canUseBiometricLogin ? "#A9EF45" : "rgba(255, 255, 255, 0.5)"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <KeyboardAwareTextInput
                  style={styles.input}
                  placeholder="Input Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  extraOffset={60}
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
              <ThemedText style={styles.forgotPasswordText}>Forgot Password ?</ThemedText>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (!isLoginButtonEnabled || loginMutation.isPending) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isLoginButtonEnabled || loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Login</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <ThemedText style={styles.registerText}>
              Don't have an account ?{' '}
              <ThemedText style={styles.registerLink} onPress={handleRegister}>
                Register
              </ThemedText>
            </ThemedText>
          </View>
        </View>

        <View style={[styles.decorativeCircle, styles.circleTop]} />
        <View style={[styles.decorativeCircle, styles.circleBottom]} />
      </KeyboardSafeScreen>

      {/* Forgot Password Modal */}
      <KeyboardSafeModal
        visible={showForgotPasswordModal}
        presentation="sheet"
        onRequestClose={() => setShowForgotPasswordModal(false)}
        contentStyle={styles.forgotPasswordModalContent}
      >
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Forgot Password</ThemedText>
              <TouchableOpacity
                onPress={() => setShowForgotPasswordModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Enter Email Address */}
            {forgotPasswordStep === 'email' && (
              <>
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Enter Email Address</ThemedText>
                  <View style={styles.modalInputWrapper}>
                    <KeyboardAwareModalTextInput
                      style={styles.modalInput}
                      placeholder="Input your email address"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={forgotEmail}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!forgotPasswordMutation.isPending}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalProceedButton,
                    (!forgotEmail.trim() || !forgotEmail.includes('@') || !forgotEmail.includes('.') || forgotPasswordMutation.isPending) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={!forgotEmail.trim() || !forgotEmail.includes('@') || !forgotEmail.includes('.') || forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <ThemedText style={styles.modalProceedButtonText}>Next</ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Verify OTP */}
            {forgotPasswordStep === 'otp' && (
              <>
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Enter Email Address</ThemedText>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Input your email address"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={forgotEmail}
                      editable={false}
                    />
                  </View>
                  {emailVerified && (
                    <View style={styles.verificationMessage}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#A9EF45" />
                      <ThemedText style={styles.verificationText}>Email Address Verified</ThemedText>
                    </View>
                  )}
                  {emailVerified && (
                    <ThemedText style={styles.countdownText}>
                      A {OTP_LENGTH}-digit code has been sent to your registered email. Resend in{' '}
                      <ThemedText style={styles.countdownTimer}>
                        {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')} Sec
                      </ThemedText>
                    </ThemedText>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Input Code</ThemedText>
                  <ModalOtpInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    onComplete={() => handleVerifyOtp()}
                    disabled={verifyOtpMutation.isPending}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalProceedButton,
                    (!verificationCode.every((d) => d !== '') || verifyOtpMutation.isPending) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={!verificationCode.every((d) => d !== '') || verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <ThemedText style={styles.modalProceedButtonText}>Verify</ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}
      </KeyboardSafeModal>

      {/* Change Password Modal */}
      <KeyboardSafeModal
        visible={showChangePasswordModal}
        presentation="sheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
        contentStyle={styles.changePasswordModalContent}
      >
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
              <ThemedText style={styles.changePasswordTitle}>Change Password</ThemedText>
              <TouchableOpacity
                onPress={() => setShowChangePasswordModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <ThemedText style={styles.modalSectionTitle}>New Password</ThemedText>
              <View style={styles.modalInputWrapper}>
                <KeyboardAwareModalTextInput
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

            <View style={styles.modalSection}>
              <ThemedText style={styles.modalSectionTitle}>Re-enter new Password</ThemedText>
              <View style={styles.modalInputWrapper}>
                <KeyboardAwareModalTextInput
                  style={styles.modalInput}
                  placeholder="Re-enter new Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  extraOffset={50}
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

            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                (newPassword.length === 0 || confirmPassword.length === 0 || newPassword !== confirmPassword || resetPasswordMutation.isPending) && styles.modalButtonDisabled,
              ]}
              onPress={handleSavePassword}
              disabled={newPassword.length === 0 || confirmPassword.length === 0 || newPassword !== confirmPassword || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.modalSaveButtonText}>Save</ThemedText>
              )}
            </TouchableOpacity>
      </KeyboardSafeModal>

      {/* New Device Verification Modal */}
      <KeyboardSafeModal
        visible={showDeviceVerifyModal}
        onRequestClose={() => setShowDeviceVerifyModal(false)}
        contentStyle={styles.forgotPasswordModalContent}
      >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Verify New Device</ThemedText>
              <TouchableOpacity
                onPress={() => setShowDeviceVerifyModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.countdownText}>
              Enter the {OTP_LENGTH}-digit code sent to your email to sign in from this device.
            </ThemedText>
            <View style={styles.modalSection}>
              <ModalOtpInput
                value={deviceOtpCode}
                onChange={setDeviceOtpCode}
                onComplete={() => handleVerifyDeviceOtp()}
                disabled={verifyDeviceMutation.isPending}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.modalProceedButton,
                (!deviceOtpCode.every((d) => d !== '') || verifyDeviceMutation.isPending) && styles.modalButtonDisabled,
              ]}
              onPress={handleVerifyDeviceOtp}
              disabled={!deviceOtpCode.every((d) => d !== '') || verifyDeviceMutation.isPending}
            >
              {verifyDeviceMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.modalProceedButtonText}>Verify Device</ThemedText>
              )}
            </TouchableOpacity>
      </KeyboardSafeModal>
    </>
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
    backgroundColor: '#020c19',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circularLogo: {
    width: 90,
    height: 90,
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
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  fingerprintButton: {
    padding: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 30,
  },
  registerText: {
    fontSize: 14,
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
  loginButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
});
