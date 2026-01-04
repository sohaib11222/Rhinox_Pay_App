import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
import { useRegister, useVerifyEmail, useResendVerification } from '../../mutations/auth.mutations';
import { useGetCountries } from '../../queries/country.queries';
import { API_BASE_URL } from '../../utils/apiConfig';

interface Country {
  id: number;
  name: string;
  code: string;
  flag: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [country, setCountry] = useState('');
  const [countryId, setCountryId] = useState<string>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [emailCode, setEmailCode] = useState(['', '', '', '', '']);
  const [phoneCode, setPhoneCode] = useState(['', '', '', '', '']);
  const [userId, setUserId] = useState<string>(''); // Store user ID from registration
  
  // Refs for auto-focus
  const emailCodeRefs = useRef<(TextInput | null)[]>([]);
  const phoneCodeRefs = useRef<(TextInput | null)[]>([]);

  // Resend timer states
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [emailResendClicked, setEmailResendClicked] = useState(false);
  const [phoneResendClicked, setPhoneResendClicked] = useState(false);

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValid, setPasswordValid] = useState({
    noNameEmail: false,
    minLength: false,
    hasLetterOrSymbol: false,
  });

  // Fetch countries from API
  const { 
    data: countriesData, 
    isLoading: countriesLoading, 
    error: countriesError,
    refetch: refetchCountries 
  } = useGetCountries();
  
  // Extract countries array from API response
  // API response structure: { success: true, data: [...] }
  // The query returns response.data which is the ApiResponse object
  const countries: Country[] = React.useMemo(() => {
    if (!countriesData) return [];
    
    // Handle both possible response structures
    if (Array.isArray(countriesData)) {
      return countriesData;
    }
    
    if (countriesData.data && Array.isArray(countriesData.data)) {
      return countriesData.data;
    }
    
    return [];
  }, [countriesData]);
  
  // Debug logging (remove in production)
  React.useEffect(() => {
    if (countriesData) {
      console.log('Countries Data:', JSON.stringify(countriesData, null, 2));
      console.log('Extracted Countries:', countries.length);
    }
    if (countriesError) {
      console.error('Countries Error:', countriesError);
    }
  }, [countriesData, countriesError, countries.length]);

  // Register mutation
  const registerMutation = useRegister({
    onSuccess: (data) => {
      // Registration successful - OTP sent to email
      // Store user ID from response
      const user = data?.data?.user;
      if (user?.id) {
        setUserId(user.id);
        // Open email verification modal
        setShowEmailVerifyModal(true);
      } else {
        Alert.alert(
          'Registration Successful',
          'A 5-digit OTP code has been sent to your email address. Please verify your email to continue.',
          [{ text: 'OK' }]
        );
      }
    },
    onError: (error: any) => {
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to register. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Verify email mutation
  const verifyEmailMutation = useVerifyEmail({
    onSuccess: async (data) => {
      console.log('[RegisterScreen] Email verification successful');
      console.log('[RegisterScreen] Response data:', JSON.stringify(data, null, 2));
      
      // Wait longer to ensure tokens are fully stored and persisted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify token was stored
      const apiClientModule = await import('../../utils/apiClient');
      const storedToken = await apiClientModule.getAccessToken();
      if (storedToken) {
        console.log('[RegisterScreen] Token verified after storage (preview):', storedToken.substring(0, 50) + '...');
      } else {
        console.error('[RegisterScreen] ERROR: Token not found after storage!');
      }
      
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully. Crypto wallets have been initialized.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowEmailVerifyModal(false);
              // Navigate to SetBiometrics screen
              navigation.navigate('SetBiometrics' as never);
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid or expired OTP code. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Resend verification mutation
  const resendVerificationMutation = useResendVerification({
    onSuccess: () => {
      setEmailResendTimer(60);
      setEmailResendClicked(true);
    },
    onError: (error: any) => {
      Alert.alert(
        'Resend Failed',
        error.message || 'Failed to resend OTP. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      countryId.trim() !== '' &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== '' &&
      password.trim() !== '' &&
      passwordValid.noNameEmail &&
      passwordValid.minLength &&
      passwordValid.hasLetterOrSymbol &&
      agreeTerms
    );
  };

  const handleRegister = () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields and accept the terms.');
      return;
    }

    // Call register API
    registerMutation.mutate({
      email: email.trim(),
      phone: phone.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      countryId: countryId,
      termsAccepted: agreeTerms,
    });
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country.id);
    setCountry(country.name);
    // Convert numeric ID to string for the register API
    setCountryId(String(country.id));
  };

  const handleApplyCountry = () => {
    setShowCountryModal(false);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setShowPasswordRequirements(text.length > 0);

    setPasswordValid({
      noNameEmail: !text.toLowerCase().includes(firstName.toLowerCase()) && !text.toLowerCase().includes(email.toLowerCase()),
      minLength: text.length >= 8,
      hasLetterOrSymbol: /[a-zA-Z]/.test(text) || /[^a-zA-Z0-9]/.test(text),
    });
  };

  const handleVerifyEmail = () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please try registering again.');
      return;
    }

    const code = emailCode.join('');
    if (code.length !== 5) {
      Alert.alert('Validation Error', 'Please enter the complete 5-digit code.');
      return;
    }

    // Call verify email API
    verifyEmailMutation.mutate({
      userId: userId,
      code: code,
    });
  };

  // Handle email resend
  const handleEmailResend = () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please try registering again.');
      return;
    }

    // Call resend verification API
    resendVerificationMutation.mutate({
      userId: userId,
    });
  };

  // Phone verification handlers (commented out for now)
  // const handleVerifyPhone = () => {
  //   setShowPhoneVerifyModal(false);
  // };

  // const handlePhoneResend = () => {
  //   setPhoneResendTimer(60); // 1 minute = 60 seconds
  //   setPhoneResendClicked(true);
  //   // TODO: Call API to resend phone OTP
  //   console.log('Resending phone OTP...');
  // };

  // Auto-focus first input when email modal opens
  useEffect(() => {
    if (showEmailVerifyModal) {
      setTimeout(() => {
        emailCodeRefs.current[0]?.focus();
      }, 100);
    } else {
      // Reset email code when modal closes
      setEmailCode(['', '', '', '', '']);
      setEmailResendTimer(0);
      setEmailResendClicked(false);
    }
  }, [showEmailVerifyModal]);

  // Auto-focus first input when phone modal opens
  useEffect(() => {
    if (showPhoneVerifyModal) {
      setTimeout(() => {
        phoneCodeRefs.current[0]?.focus();
      }, 100);
    } else {
      // Reset phone code when modal closes
      setPhoneCode(['', '', '', '', '']);
      setPhoneResendTimer(0);
      setPhoneResendClicked(false);
    }
  }, [showPhoneVerifyModal]);

  // Email resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailResendTimer > 0) {
      interval = setInterval(() => {
        setEmailResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [emailResendTimer]);

  // Phone resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneResendTimer > 0) {
      interval = setInterval(() => {
        setPhoneResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [phoneResendTimer]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#00010C" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/login/hero-image.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.circularGradient} />
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

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../assets/login/memoji.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.titleSection}>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Create a free account today</ThemedText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formInner}>
              {/* Country Selector */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Country</ThemedText>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowCountryModal(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <ThemedText 
                    style={[styles.input, !country && styles.placeholderStyle]}
                    pointerEvents="none"
                  >
                    {country || 'Select your country'}
                  </ThemedText>
                  <View pointerEvents="none">
                    <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>First Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Input your first name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Input your last name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Email</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Input your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Phone number</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Input your phone number"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Input your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Password Requirements */}
            {showPasswordRequirements && (
              <View style={styles.passwordRequirements}>
                <View style={styles.requirementRow}>
                  <MaterialCommunityIcons
                    name={passwordValid.noNameEmail ? 'check-circle' : 'close-circle'}
                    size={11.2}
                    color={passwordValid.noNameEmail ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                  <ThemedText style={styles.requirementText}>Must not contain your name or email</ThemedText>
                </View>
                <View style={styles.requirementRow}>
                  <MaterialCommunityIcons
                    name={passwordValid.minLength ? 'check-circle' : 'close-circle'}
                    size={11.2}
                    color={passwordValid.minLength ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                  <ThemedText style={styles.requirementText}>Must be at least 8 characters</ThemedText>
                </View>
                <View style={styles.requirementRow}>
                  <MaterialCommunityIcons
                    name={passwordValid.hasLetterOrSymbol ? 'check-circle' : 'close-circle'}
                    size={11.2}
                    color={passwordValid.hasLetterOrSymbol ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                  <ThemedText style={styles.requirementText}>Must have a letter or symbol</ThemedText>
                </View>
              </View>
            )}

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && (
                  <MaterialCommunityIcons name="check" size={16} color="#000" />
                )}
              </View>
              <ThemedText style={styles.termsText}>
                By checking this box you agree to our Terms & Conditions of service and Privacy
                Policy including verification of your identity through a third party
              </ThemedText>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                (!isFormValid() || registerMutation.isPending) && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={!isFormValid() || registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.registerButtonText}>Register</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginContainer}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <ThemedText style={styles.loginText}>
              Already have an account ?{' '}
              <ThemedText style={styles.loginLink}>Login</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {countriesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#A9EF45" />
                  <ThemedText style={styles.loadingText}>Loading countries...</ThemedText>
                </View>
              ) : countriesError ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.errorText}>
                    Error loading countries. Please try again.
                  </ThemedText>
                  <ThemedText style={styles.errorSubtext}>
                    {countriesError instanceof Error ? countriesError.message : 'Unknown error'}
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => refetchCountries()}
                  >
                    <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : countries.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.loadingText}>No countries available</ThemedText>
                </View>
              ) : (
                countries.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => handleCountrySelect(c)}
                  >
                    {c.flag ? (
                      <Image
                        source={{ uri: `${API_BASE_URL.replace('/api', '')}${c.flag}` }}
                        style={styles.countryFlagImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <ThemedText style={styles.countryFlagEmoji}>🏳️</ThemedText>
                    )}
                    <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCountry}>
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={showEmailVerifyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Email Verification</ThemedText>
              <TouchableOpacity onPress={() => setShowEmailVerifyModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.verifyIcon}>
              <Image
                source={require('../../assets/Group 49.png')}
                style={{ width: 105, height: 105 }}
                resizeMode="contain"
              />
            </View>
            <ThemedText style={styles.verifyTitle}>Verify your email address</ThemedText>
            <View style={styles.verifySubtitleContainer}>
              <ThemedText style={styles.verifySubtitle}>
                {emailResendClicked
                  ? 'A 5 digit code has been sent again to your registered email address'
                  : 'A 5 digit code has been sent to your registered email address'}
                {' '}
              </ThemedText>
              {emailResendTimer > 0 ? (
                <ThemedText style={styles.resendTextDisabled}>
                  Resend ({emailResendTimer}s)
                </ThemedText>
              ) : (
                <TouchableOpacity 
                  onPress={handleEmailResend} 
                  activeOpacity={0.7}
                  disabled={resendVerificationMutation.isPending}
                >
                  {resendVerificationMutation.isPending ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <ThemedText style={styles.resendText}>Resend</ThemedText>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4].map((index) => (
                <View key={index} style={styles.codeInput}>
                  <TextInput
                    ref={(ref) => {
                      emailCodeRefs.current[index] = ref;
                    }}
                    style={styles.codeText}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={emailCode[index]}
                    onChangeText={(text) => {
                      const newCode = [...emailCode];
                      newCode[index] = text;
                      setEmailCode(newCode);
                      
                      // Auto-focus to next input if digit entered
                      if (text && index < 4) {
                        emailCodeRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      // Handle backspace to go to previous input
                      if (nativeEvent.key === 'Backspace' && !emailCode[index] && index > 0) {
                        emailCodeRefs.current[index - 1]?.focus();
                      }
                    }}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={[
                styles.verifyButton,
                (emailCode.every(digit => digit !== '') && !verifyEmailMutation.isPending) ? {} : styles.verifyButtonDisabled
              ]} 
              onPress={handleVerifyEmail}
              disabled={!emailCode.every(digit => digit !== '') || verifyEmailMutation.isPending}
            >
              {verifyEmailMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.verifyButtonText}>Proceed</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phone Verification Modal - Commented out for now */}
      {/* <Modal
        visible={showPhoneVerifyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Phone number Verification</ThemedText>
              <TouchableOpacity onPress={() => setShowPhoneVerifyModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.verifyIcon}>
              <Image
                source={require('../../assets/Group 49.png')}
                style={{ width: 105, height: 105 }}
                resizeMode="contain"
              /> 
            </View>
            <ThemedText style={styles.verifyTitle}>Verify your phone number</ThemedText>
            <View style={styles.verifySubtitleContainer}>
              <ThemedText style={styles.verifySubtitle}>
                {phoneResendClicked
                  ? 'A 5 digit code has been sent again to your registered phone number'
                  : 'A 5 digit code has been sent to your registered phone number'}
                {' '}
              </ThemedText>
              {phoneResendTimer > 0 ? (
                <ThemedText style={styles.resendTextDisabled}>
                  Resend ({phoneResendTimer}s)
                </ThemedText>
              ) : (
                <TouchableOpacity onPress={handlePhoneResend} activeOpacity={0.7}>
                  <ThemedText style={styles.resendText}>Resend</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4].map((index) => (
                <View key={index} style={styles.codeInput}>
                  <TextInput
                    ref={(ref) => {
                      phoneCodeRefs.current[index] = ref;
                    }}
                    style={styles.codeText}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={phoneCode[index]}
                    onChangeText={(text) => {
                      const newCode = [...phoneCode];
                      newCode[index] = text;
                      setPhoneCode(newCode);
                      
                      // Auto-focus to next input if digit entered
                      if (text && index < 4) {
                        phoneCodeRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      // Handle backspace to go to previous input
                      if (nativeEvent.key === 'Backspace' && !phoneCode[index] && index > 0) {
                        phoneCodeRefs.current[index - 1]?.focus();
                      }
                    }}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={[
                styles.verifyButton,
                phoneCode.every(digit => digit !== '') ? {} : styles.verifyButtonDisabled
              ]} 
              onPress={handleVerifyPhone}
              disabled={!phoneCode.every(digit => digit !== '')}
            >
              <ThemedText style={styles.verifyButtonText}>Login</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      <View style={[styles.decorativeCircle, styles.circleTop]} />
      <View style={[styles.decorativeCircle, styles.circleBottom]} />
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

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
    height: 119,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: 440,
    height: 142,
    position: 'absolute',
    top: -14,
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
  },
  nigeriaFlag: {
    top: 61,
    right: 22,
    width: 25,
    height: 25,
  },
  southAfricaFlag: {
    top: 17,
    left: 96,
    width: 29,
    height: 29,
  },
  avatarContainer: {
    position: 'absolute',
    top: 139,
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
    marginTop: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 30, // 30 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14, // 14 * 0.8
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
  formInner: {
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 21,
  },
  inputLabel: {
    fontSize: 14, // 14 * 0.8
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
  placeholderStyle: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  verifyText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#A9EF45',
    paddingHorizontal: 8,
  },
  passwordRequirements: {
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 11,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 9.6, // 12 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#A9EF45',
    borderColor: '#A9EF45',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  registerButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  loginLink: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    padding: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 15.2, // 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,



  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    // borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryFlagEmoji: {
    fontSize: 20,
    marginRight: 15,
  },
  countryFlagImage: {
    width: 24,
    height: 18,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
  verifyModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: 464,
  },
  verifyIcon: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  verifySubtitleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  verifySubtitle: {
    fontSize: 9.8,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  resendText: {
    color: '#A9EF45',
  },
  resendTextDisabled: {
    color: 'rgba(169, 239, 69, 0.5)',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 30,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 60,
    height: 74,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 38.4, // 48 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  registerButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#A9EF45',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
});

