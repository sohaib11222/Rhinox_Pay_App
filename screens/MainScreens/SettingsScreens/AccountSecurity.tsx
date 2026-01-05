import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useForgotPassword, useVerifyPasswordResetOtp, useResetPassword, useSetPin, useVerifyPasswordForPin } from '../../../mutations/auth.mutations';
import { 
  getSecurityConfirmationSettings, 
  setVerifyWithPin, 
  setVerifyWithEmail, 
  setVerifyWith2FA 
} from '../../../utils/apiClient';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1; // Reduced scale for big phone design

// Types for API integration
interface SecurityItem {
  id: string;
  title: string;
  icon: any;
  hasToggle?: boolean;
  onPress?: () => void;
}

interface SecuritySection {
  id: string;
  title: string;
  items: SecurityItem[];
}

const AccountSecurity = () => {
  const navigation = useNavigation();
  const [verifyWithPin, setVerifyWithPin] = useState(false);
  const [verifyWithEmail, setVerifyWithEmail] = useState(false);
  const [verifyWith2FA, setVerifyWith2FA] = useState(false);
  
  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  
  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Password reset mutations
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: (data) => {
      console.log('[AccountSecurity] Password reset OTP sent:', JSON.stringify(data, null, 2));
      setEmailVerified(true);
      setForgotPasswordStep('otp');
      setCountdown(59);
      showInfoAlert(
        'Code Sent',
        'If an account with this email exists, a password reset code has been sent.'
      );
    },
    onError: (error: any) => {
      console.error('[AccountSecurity] Forgot password error:', error);
      showErrorAlert(
        'Error',
        error.message || 'Failed to send password reset code. Please try again.'
      );
    },
  });

  const verifyOtpMutation = useVerifyPasswordResetOtp({
    onSuccess: (data) => {
      console.log('[AccountSecurity] OTP verified:', JSON.stringify(data, null, 2));
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
      console.error('[AccountSecurity] OTP verification error:', error);
      showErrorAlert(
        'Verification Failed',
        error.message || 'Invalid or expired OTP code. Please try again.'
      );
    },
  });

  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      console.log('[AccountSecurity] Password reset successful:', JSON.stringify(data, null, 2));
      setPasswordChanged(true);
      showSuccessAlert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please login with your new password.',
        () => {
          // Reset all states
          setTimeout(() => {
            setShowChangePasswordModal(false);
            setShowForgotPasswordModal(false);
            setForgotEmail('');
            setVerificationCode('');
            setEmailVerified(false);
            setOtpVerified(false);
            setNewPassword('');
            setConfirmPassword('');
            setForgotPasswordStep('email');
            setCountdown(59);
            setPasswordChanged(false);
          }, 2000);
        }
      );
    },
    onError: (error: any) => {
      console.error('[AccountSecurity] Password reset error:', error);
      showErrorAlert(
        'Reset Failed',
        error.message || 'Failed to reset password. Please try again.'
      );
    },
  });

  // 2FA Authenticator Modal States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const authenticatorSetupCode = 'ADF1235678'; // TODO: Replace with API call

  // Setup Pin Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'setup' | 'confirm'>('setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);

  // Verify password for PIN mutation
  const verifyPasswordForPinMutation = useVerifyPasswordForPin({
    onSuccess: (data) => {
      console.log('[AccountSecurity] Password verified successfully:', JSON.stringify(data, null, 2));
      setPasswordVerified(true);
      setShowPasswordModal(false);
      setShowPinModal(true);
      setPinStep('setup');
      setPin('');
      setConfirmPin('');
      showSuccessAlert(
        'Password Verified',
        data?.data?.message || 'Password verified successfully. You can now set your PIN.'
      );
    },
    onError: (error: any) => {
      console.error('[AccountSecurity] Password verification error:', error);
      showErrorAlert(
        'Verification Failed',
        error?.message || 'Invalid password. Please try again.',
        () => {
          setAccountPassword('');
        }
      );
    },
  });

  // Set PIN mutation
  const setPinMutation = useSetPin({
    onSuccess: (data) => {
      console.log('[AccountSecurity] PIN set successfully:', JSON.stringify(data, null, 2));
      showSuccessAlert(
        'Success',
        data?.data?.message || 'PIN setup completed successfully',
        () => {
          setShowPinModal(false);
          setPinStep('setup');
          setPin('');
          setConfirmPin('');
          setPasswordVerified(false);
          setAccountPassword('');
        }
      );
    },
    onError: (error: any) => {
      console.error('[AccountSecurity] Error setting PIN:', error);
      showErrorAlert(
        'Error',
        error?.message || 'Failed to set PIN. Please try again.',
        () => {
          // Reset PIN entry on error
          setPinStep('setup');
          setPin('');
          setConfirmPin('');
        }
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
      setForgotEmail('');
      setVerificationCode('');
    }
  }, [showForgotPasswordModal, forgotPasswordStep]);

  // Load security confirmation settings on mount
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const settings = await getSecurityConfirmationSettings();
      setVerifyWithPin(settings.verifyWithPin);
      setVerifyWithEmail(settings.verifyWithEmail);
      setVerifyWith2FA(settings.verifyWith2FA);
      console.log('[AccountSecurity] Loaded security settings:', settings);
    } catch (error) {
      console.error('[AccountSecurity] Error loading security settings:', error);
    }
  };

  const handleSecurityToggle = async (type: 'pin' | 'email' | '2fa', value: boolean) => {
    try {
      if (type === 'pin') {
        setVerifyWithPin(value);
        await setVerifyWithPin(value);
      } else if (type === 'email') {
        setVerifyWithEmail(value);
        await setVerifyWithEmail(value);
      } else if (type === '2fa') {
        setVerifyWith2FA(value);
        await setVerifyWith2FA(value);
      }
      console.log(`[AccountSecurity] ${type} verification preference updated:`, value);
    } catch (error) {
      console.error(`[AccountSecurity] Error saving ${type} preference:`, error);
      // Revert state on error
      if (type === 'pin') {
        setVerifyWithPin(!value);
      } else if (type === 'email') {
        setVerifyWithEmail(!value);
      } else if (type === '2fa') {
        setVerifyWith2FA(!value);
      }
      showErrorAlert('Error', `Failed to save ${type} preference. Please try again.`);
    }
  };

  // Hide bottom tab bar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderTopWidth: 0,
              height: 75 * 0.8,
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * 0.8,
              borderRadius: 100,
              overflow: 'hidden',
              elevation: 0,
              width: SCREEN_WIDTH * 0.86,
              marginLeft: 30,
              shadowOpacity: 0,
            },
          });
        }
      };
    }, [navigation])
  );

  // Security sections - Replace with API call
  const securitySections: SecuritySection[] = [
    {
      id: 'security-settings',
      title: 'Security Settings',
      items: [
        {
          id: 'setup-pin',
          title: 'Setup Pin',
          icon: require('../../../assets/security-check.png'),
        },
        {
          id: 'setup-2fa',
          title: 'Set up 2FA Authenticator',
          icon: require('../../../assets/security-check.png'),
        },
        {
          id: 'reset-password',
          title: 'Reset Password',
          icon: require('../../../assets/lock-password.png'), // Using lock-password icon placeholder
        },
        {
          id: 'devices-sessions',
          title: 'Devices & Sessions',
          icon: require('../../../assets/monitor.png'),
        },
      ],
    },
    {
      id: 'security-confirmations',
      title: 'Security Confirmations',
      items: [
        {
          id: 'verify-pin',
          title: 'Verify Transactions with PIN',
          icon: require('../../../assets/security-check.png'),
          hasToggle: true,
        },
        {
          id: 'verify-email',
          title: 'Verify Transaction with Email',
          icon: require('../../../assets/security-check.png'),
          hasToggle: true,
        },
        {
          id: 'verify-2fa',
          title: 'Verify Transaction with 2FA',
          icon: require('../../../assets/security-check.png'),
          hasToggle: true,
        },
      ],
    },
  ];

  const handleItemPress = (item: SecurityItem) => {
    if (item.id === 'reset-password') {
      setShowForgotPasswordModal(true);
    } else if (item.id === 'setup-2fa') {
      setShow2FAModal(true);
    } else if (item.id === 'setup-pin') {
      setShowPasswordModal(true);
    } else if (item.id === 'devices-sessions') {
      (navigation as any).navigate('Settings', {
        screen: 'DevicesAndSessions',
      });
    } else {
      console.log('Pressed:', item.id);
      // TODO: Implement navigation or actions for other items
    }
  };

  const handleSendCode = () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showErrorAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    forgotPasswordMutation.mutate({ email: forgotEmail });
  };

  const handleResendCode = () => {
    if (countdown > 0) {
      showWarningAlert('Please Wait', `Please wait ${formatCountdown(countdown)} before resending code.`);
      return;
    }
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showErrorAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    forgotPasswordMutation.mutate({ email: forgotEmail });
    setCountdown(59);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 5) {
      showErrorAlert('Invalid Code', 'Please enter the 5-digit code');
      return;
    }
    verifyOtpMutation.mutate({
      email: forgotEmail,
      otp: verificationCode,
    });
  };

  const handleSavePassword = () => {
    if (newPassword.length < 8) {
      showErrorAlert('Invalid Password', 'Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorAlert('Password Mismatch', 'New password and confirm password do not match');
      return;
    }
    resetPasswordMutation.mutate({
      email: forgotEmail,
      otp: verificationCode,
      newPassword: newPassword,
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(authenticatorSetupCode);
      showSuccessAlert('Copied', 'Authenticator code copied to clipboard');
    } catch (error) {
      showErrorAlert('Error', 'Failed to copy code');
    }
  };

  const handleProceed2FA = () => {
    // TODO: Implement API call to verify and save 2FA
    console.log('Proceed with 2FA setup:', authenticatorCode);
    if (authenticatorCode.length > 0) {
      showSuccessAlert('Success', '2FA Authenticator setup completed');
      setShow2FAModal(false);
      setAuthenticatorCode('');
    }
  };

  const handleVerifyPassword = () => {
    if (!accountPassword || accountPassword.length === 0) {
      showErrorAlert('Error', 'Please enter your password');
      return;
    }

    // Call API to verify password
    console.log('[AccountSecurity] Verifying password for PIN setup...');
    verifyPasswordForPinMutation.mutate({ password: accountPassword });
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
            setConfirmPin('');
          }, 300);
        }
      }
    } else {
      if (confirmPin.length < 5) {
        const newConfirmPin = confirmPin + num;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === 5) {
          // Auto-verify when 5 digits are entered
          setTimeout(() => {
            // Verify PINs match
            if (newConfirmPin === pin) {
              // Call API to set PIN
              setPinMutation.mutate({ pin: pin });
            } else {
              showErrorAlert('Error', 'PINs do not match. Please try again.');
              setPinStep('setup');
              setPin('');
              setConfirmPin('');
            }
          }, 300);
        }
      }
    }
  };

  const handlePinBackspace = () => {
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

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[AccountSecurity] Refreshing security settings data...');
    try {
      // Reload security confirmation settings
      await loadSecuritySettings();
      console.log('[AccountSecurity] Security settings refreshed successfully');
    } catch (error) {
      console.error('[AccountSecurity] Error refreshing security settings:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A9EF45"
            colors={['#A9EF45']}
            progressBackgroundColor="#020c19"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonCircle}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={24 * SCALE}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Security Settings</ThemedText>
          </View>
        </View>

        {/* Security Sections */}
        <View style={styles.sectionsContainer}>
          {securitySections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              <View style={styles.sectionItems}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.securityItem}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.itemIconContainer}>
                      <Image
                        source={item.icon}
                        style={styles.itemIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                    {item.hasToggle && (
                      <Switch
                        value={
                          item.id === 'verify-pin'
                            ? verifyWithPin
                            : item.id === 'verify-email'
                            ? verifyWithEmail
                            : verifyWith2FA
                        }
                        onValueChange={(value) => {
                          if (item.id === 'verify-pin') {
                            handleSecurityToggle('pin', value);
                          } else if (item.id === 'verify-email') {
                            handleSecurityToggle('email', value);
                          } else if (item.id === 'verify-2fa') {
                            handleSecurityToggle('2fa', value);
                          }
                        }}
                        trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#A9EF45' }}
                        thumbColor="#FFFFFF"
                        style={styles.toggle}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowForgotPasswordModal(false);
          // Reset state when modal closes
          setForgotEmail('');
          setVerificationCode('');
          setEmailVerified(false);
          setOtpVerified(false);
          setForgotPasswordStep('email');
          setCountdown(59);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Forgot Password</ThemedText>
              <TouchableOpacity 
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  // Reset state when modal closes
                  setForgotEmail('');
                  setVerificationCode('');
                  setEmailVerified(false);
                  setOtpVerified(false);
                  setForgotPasswordStep('email');
                  setCountdown(59);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Email Input */}
              <View style={styles.modalSection}>
              <ThemedText style={styles.modalSectionTitle}>Enter Email Addresss</ThemedText>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Input your email address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <MaterialCommunityIcons
                  name="eye"
                  size={24 * SCALE}
                  color="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>

            {/* Verification Code Section */}
            {emailVerified && forgotPasswordStep === 'otp' && (
              <>
                <View style={styles.verifiedSection}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14 * SCALE}
                    color="#008000"
                  />
                  <ThemedText style={styles.verifiedText}>Email Address Verified</ThemedText>
                </View>
                <ThemedText style={styles.resendText}>
                  {countdown > 0 
                    ? `A 5 digit code has been sent to your registered email. Resend in ${formatCountdown(countdown)} Sec`
                    : 'A 5 digit code has been sent to your registered email.'}
                </ThemedText>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Input Code</ThemedText>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Input code sent to email"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                      maxLength={5}
                      autoFocus={emailVerified}
                    />
                    <MaterialCommunityIcons
                      name="eye"
                      size={24 * SCALE}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Resend Code Button */}
            {emailVerified && forgotPasswordStep === 'otp' && countdown === 0 && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={forgotPasswordMutation.isPending}
              >
                <ThemedText style={styles.resendButtonText}>Resend Code</ThemedText>
              </TouchableOpacity>
            )}

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  (!emailVerified && (!forgotEmail || !forgotEmail.includes('@'))) ||
                  (emailVerified && verificationCode.length !== 5) ||
                  forgotPasswordMutation.isPending ||
                  verifyOtpMutation.isPending
                    ? styles.modalButtonDisabled
                    : null,
                ]}
                onPress={emailVerified ? handleVerifyCode : handleSendCode}
                disabled={
                  (!emailVerified && (!forgotEmail || !forgotEmail.includes('@'))) ||
                  (emailVerified && verificationCode.length !== 5) ||
                  forgotPasswordMutation.isPending ||
                  verifyOtpMutation.isPending
                }
              >
                {forgotPasswordMutation.isPending || verifyOtpMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalActionButtonText}>
                    {emailVerified ? 'Verify Code' : 'Send Code'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
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
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setShowForgotPasswordModal(true);
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24 * SCALE}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { marginLeft: 10 }]}>Change Password</ThemedText>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Success Message */}
              {passwordChanged && (
                <View style={styles.successMessage}>
                  <View style={styles.successIconContainer}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24 * SCALE}
                      color="#A9EF45"
                    />
                  </View>
                  <ThemedText style={styles.successText}>
                    Your password has been changed successfully
                  </ThemedText>
                </View>
              )}

              {/* New Password */}
              <View style={styles.modalSection}>
              <ThemedText style={styles.modalSectionTitle}>New Password</ThemedText>
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
                    size={24 * SCALE}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Re-enter new Password */}
            <View style={styles.modalSection}>
              <ThemedText style={styles.modalSectionTitle}>Re-enter new Password</ThemedText>
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
                    size={24 * SCALE}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <ThemedText style={styles.passwordErrorText}>
                  Passwords do not match
                </ThemedText>
              )}
            </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  (newPassword.length === 0 || 
                   confirmPassword.length === 0 || 
                   newPassword !== confirmPassword ||
                   newPassword.length < 8 ||
                   resetPasswordMutation.isPending) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleSavePassword}
                disabled={
                  newPassword.length === 0 || 
                  confirmPassword.length === 0 || 
                  newPassword !== confirmPassword ||
                  newPassword.length < 8 ||
                  resetPasswordMutation.isPending
                }
              >
                {resetPasswordMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalActionButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2FA Authenticator Setup Modal */}
      <Modal
        visible={show2FAModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header - Fixed at top */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Setup Authenticator</ThemedText>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Authenticator Icon */}
              <View style={styles.authenticatorIconContainer}>
                <View style={styles.authenticatorIconCircle}>
                <Image
                  source={require('../../../assets/Group 49.png')}
                  style={[{ marginBottom: -1, width: 120, height: 120 }]}
                  resizeMode="cover"
                />
                </View>
              </View>

              {/* Authenticator Setup Section */}
              <View style={styles.authenticatorSetupSection}>
                <ThemedText style={styles.authenticatorSetupTitle}>Authenticator Setup</ThemedText>
                <ThemedText style={styles.authenticatorSetupSubtitle}>
                  Paste the code below in your authenticator app
                </ThemedText>

                {/* Code Display Box */}
                <View style={styles.codeDisplayBox}>
                  <ThemedText style={styles.codeDisplayText}>{authenticatorSetupCode}</ThemedText>
                  <TouchableOpacity
                    style={styles.copyCodeButton}
                    onPress={handleCopyCode}
                  >
                    <ThemedText style={styles.copyCodeButtonText}>Copy Code</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Authenticator Code Input */}
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalSectionTitle, {marginTop:-20}]}>Authenticator Code</ThemedText>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Input Code from your authenticator app"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={authenticatorCode}
                    onChangeText={setAuthenticatorCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Proceed Button */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  authenticatorCode.length === 0 && styles.modalButtonDisabled,
                ]}
                onPress={handleProceed2FA}
                disabled={authenticatorCode.length === 0}
              >
                <ThemedText style={styles.modalActionButtonText}>Proceed</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Entry Modal for Setup Pin */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header - Fixed at top */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Set Pin</ThemedText>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Shield Icon */}
              <View style={styles.authenticatorIconContainer}>
                <View style={styles.authenticatorIconCircle}>
                  <Image
                    source={require('../../../assets/Group 49.png')}
                    style={[{ marginBottom: -1, width: 120, height: 120 }]}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Content */}
              <View style={styles.passwordModalContent}>
                <ThemedText style={styles.passwordModalTitle}>Enter Password</ThemedText>
                <ThemedText style={styles.passwordModalSubtitle}>
                  Enter your account Password.
                </ThemedText>
              </View>

              {/* Password Input */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalSectionTitle}>Password</ThemedText>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={accountPassword}
                    onChangeText={setAccountPassword}
                    secureTextEntry={!showAccountPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowAccountPassword(!showAccountPassword)}
                    style={styles.modalEyeButton}
                  >
                    <MaterialCommunityIcons
                      name={showAccountPassword ? 'eye-off' : 'eye'}
                      size={24 * SCALE}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Proceed Button */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  (accountPassword.length === 0 || verifyPasswordForPinMutation.isPending) && styles.modalButtonDisabled,
                ]}
                onPress={handleVerifyPassword}
                disabled={accountPassword.length === 0 || verifyPasswordForPinMutation.isPending}
              >
                {verifyPasswordForPinMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalActionButtonText}>Proceed</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPinModal(false);
          setPinStep('setup');
          setPin('');
          setConfirmPin('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.pinModalContent]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pinModalScrollContent}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Verification</ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setShowPinModal(false);
                    setPinStep('setup');
                    setPin('');
                    setConfirmPin('');
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Shield Icon */}
              <View style={styles.authenticatorIconContainer}>
                <View style={styles.authenticatorIconCircle}>
                  <Image
                    source={require('../../../assets/Group 49.png')}
                    style={[{ marginBottom: -1, width: 120, height: 120 }]}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Content */}
              <View style={styles.passwordModalContent}>
                <ThemedText style={styles.passwordModalTitle}>
                  {pinStep === 'setup' ? 'Enter Pin' : 'Re- Enter Pin'}
                </ThemedText>
                <ThemedText style={styles.passwordModalSubtitle}>
                  Setup your pin to use for your transactions
                </ThemedText>
              </View>

              {/* PIN Display */}
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
                  onPress={handlePinBackspace}
                >
                  <View style={styles.backspaceSquare}>
                    <MaterialCommunityIcons name="backspace-outline" size={18 * SCALE} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

              {/* Proceed Button */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  (pinStep === 'setup' ? pin.length !== 5 : confirmPin.length !== 5) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={() => {
                  if (pinStep === 'setup' && pin.length === 5) {
                    setPinStep('confirm');
                    setConfirmPin('');
                  } else if (pinStep === 'confirm' && confirmPin.length === 5) {
                    if (confirmPin === pin) {
                      // Call API to set PIN
                      setPinMutation.mutate({ pin: pin });
                    } else {
                      showErrorAlert('Error', 'PINs do not match. Please try again.');
                      setPinStep('setup');
                      setPin('');
                      setConfirmPin('');
                    }
                  }
                }}
                disabled={
                  (pinStep === 'setup' ? pin.length !== 5 : confirmPin.length !== 5) ||
                  setPinMutation.isPending
                }
              >
                {setPinMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalActionButtonText}>Proceed</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020C19',
  },
  scrollContent: {
    paddingBottom: 100 * SCALE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
  },
  backButtonCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -40 * SCALE,
  },
  sectionsContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 16 * SCALE,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
  },
  sectionTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 25 * SCALE,
  },
  sectionItems: {
    gap: 10 * SCALE,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    paddingVertical: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    minHeight: 60 * SCALE,
  },
  itemIconContainer: {
    width: 45 * SCALE,
    height: 44 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 5 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14 * SCALE,
  },
  itemIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    // tintColor: '#FFFFFF',
  },
  itemTitle: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  toggle: {
    marginRight: 8 * SCALE,
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingTop: 10 * SCALE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  modalSection: {
    marginTop: 20 * SCALE,
  },
  modalSectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
  },
  modalInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  modalEyeButton: {
    padding: 4 * SCALE,
  },
  verifiedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
    marginTop: 20 * SCALE,
    marginBottom: 4 * SCALE,
  },
  verifiedText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#008000',

  },
  resendText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4 * SCALE,
  },
  resendButton: {
    marginTop: 10 * SCALE,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
    textDecorationLine: 'underline',
  },
  passwordErrorText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    marginTop: 4 * SCALE,
  },
  modalActionButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
    minHeight: 60 * SCALE,
    marginBottom: 10 * SCALE,
  },
  modalButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  modalActionButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    borderWidth: 0.3,
    borderColor: '#A9EF45',
    borderRadius: 10 * SCALE,
    padding: 17 * SCALE,
    marginTop: 20 * SCALE,
    gap: 12 * SCALE,
  },
  successIconContainer: {
    width: 30 * SCALE,
    height: 30 * SCALE,
    borderRadius: 15 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  authenticatorIconContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  authenticatorIconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authenticatorSetupSection: {
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  authenticatorSetupTitle: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8 * SCALE,
  },
  authenticatorSetupSubtitle: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 20 * SCALE,
  },
  codeDisplayBox: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    padding: 20 * SCALE,
    marginHorizontal:10,
    alignItems: 'center',
    // marginBottom: 20 * SCALE,
  },
  codeDisplayText: {
    fontSize: 40 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2 * SCALE,
    marginBottom: 12 * SCALE,
  },
  copyCodeButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 10 * SCALE,
    minWidth: 120 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyCodeButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  passwordModalContent: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
    paddingHorizontal: 10 * SCALE,
  },
  passwordModalTitle: {
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  passwordModalSubtitle: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pinModalContent: {
    maxHeight: '95%',
  },
  pinModalScrollContent: {
    paddingBottom: 20 * SCALE,
  },
  pinBar: {
    alignItems: 'center',
    marginTop: 22 * SCALE,
    marginBottom: 35 * SCALE,
  },
  pinBarInner: {
    height: 60 * SCALE,
    width: 248 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24 * SCALE,
  },
  pinSlot: {
    width: 28 * SCALE,
    height: 28 * SCALE,
    borderRadius: 18 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSlotText: {
    fontSize: 20 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  pinSlotAsterisk: {
    fontSize: 19.2 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  numpad: {
    marginTop: 0,
    paddingHorizontal: 20 * SCALE,
    marginBottom: 15 * SCALE,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12 * SCALE,
  },
  numpadButton: {
    width: 117 * SCALE,
    alignItems: 'center',
  },
  numpadCircle: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadText: {
    fontSize: 19.2 * SCALE,
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
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
  },
  backspaceSquare: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AccountSecurity;

