import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '../../../components';
import { useValidateRecipient } from '../../../queries/transfer.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { showErrorAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const SendToRhinoxPayUser = () => {
  const navigation = useNavigation();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [validatedRecipient, setValidatedRecipient] = useState<any>(null);

  // Hide bottom tab bar when this screen is focused
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

  // Validate recipient query
  const {
    data: recipientData,
    isLoading: isValidating,
    isError: isValidatingError,
    error: validationError,
    refetch: validateRecipient,
  } = useValidateRecipient(recipientEmail, {
    enabled: false, // Don't auto-fetch, only on button press
  });

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalance,
  } = useGetWalletBalances();

  // Update validated recipient when data is fetched
  React.useEffect(() => {
    if (recipientData?.data) {
      setValidatedRecipient(recipientData.data);
    } else if (isValidatingError) {
      setValidatedRecipient(null);
    }
  }, [recipientData, isValidatingError]);

  const handleValidate = async () => {
    if (!recipientEmail.trim()) {
      showErrorAlert('Error', 'Please enter a Rhinox Pay user email or ID');
      return;
    }

    if (!recipientEmail.includes('@')) {
      // If it's not an email, treat it as user ID and convert to email format
      // Or you might want to use a different API endpoint for user ID
      showErrorAlert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await validateRecipient();
    } catch (error: any) {
      console.error('[SendToRhinoxPayUser] Validation error:', error);
      showErrorAlert('Error', error?.message || 'Failed to validate recipient');
    }
  };

  const handleContinue = () => {
    if (!validatedRecipient) {
      showErrorAlert('Error', 'Please validate the recipient first');
      return;
    }

    // Navigate to SendFundsDirectScreen with recipient data
    (navigation as any).navigate('Settings', {
      screen: 'SendFundsDirect',
      params: {
        recipient: validatedRecipient,
        recipientEmail: recipientEmail,
      },
    });
  };

  const formatBalance = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get balance for default currency (NGN)
  const balance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) return '0';
    const wallet = balancesData.data.fiat.find((w: any) => w.currency === 'NGN');
    return wallet?.balance || '0';
  }, [balancesData?.data?.fiat]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Send to Rhinox Pay User</ThemedText>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSectionContainer}>
          <LinearGradient
            colors={['#A9EF4533', '#FFFFFF0D']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardContent}>
              <ThemedText style={styles.balanceLabel}>My Balance</ThemedText>
              <View style={styles.balanceRow}>
                <Image
                  source={require('../../../assets/Vector (34).png')}
                  style={styles.walletIcon}
                  resizeMode="cover"
                />
                {isLoadingBalance ? (
                  <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                ) : (
                  <ThemedText style={styles.balanceAmount}>
                    NGN{formatBalance(balance)}
                  </ThemedText>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Recipient Input Section */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.sectionTitle}>Enter Rhinox Pay User Email</ThemedText>
            <View style={styles.inputField}>
              <MaterialCommunityIcons name="email-outline" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
              <TextInput
                style={styles.textInput}
                placeholder="user@example.com"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={recipientEmail}
                onChangeText={(text) => {
                  setRecipientEmail(text);
                  setValidatedRecipient(null); // Clear validation when email changes
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.validateButton, (!recipientEmail.trim() || isValidating) && styles.validateButtonDisabled]}
              onPress={handleValidate}
              disabled={!recipientEmail.trim() || isValidating}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.validateButtonText}>Validate Recipient</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Recipient Details Section */}
          {validatedRecipient && (
            <View style={styles.recipientDetailsSection}>
              <ThemedText style={styles.sectionTitle}>Recipient Details</ThemedText>
              <View style={styles.recipientCard}>
                <View style={styles.recipientAvatarContainer}>
                  <View style={styles.recipientAvatar}>
                    <ThemedText style={styles.recipientAvatarText}>
                      {validatedRecipient.name?.charAt(0)?.toUpperCase() || validatedRecipient.email?.charAt(0)?.toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.recipientInfo}>
                  <ThemedText style={styles.recipientName}>
                    {validatedRecipient.name || validatedRecipient.email || 'Unknown User'}
                  </ThemedText>
                  <ThemedText style={styles.recipientEmail}>
                    {validatedRecipient.email || recipientEmail}
                  </ThemedText>
                  {validatedRecipient.phoneNumber && (
                    <ThemedText style={styles.recipientPhone}>
                      {validatedRecipient.phoneNumber}
                    </ThemedText>
                  )}
                  {validatedRecipient.rhinoxPayId && (
                    <View style={styles.rhinoxPayIdContainer}>
                      <MaterialCommunityIcons name="account-check" size={16 * SCALE} color="#A9EF45" />
                      <ThemedText style={styles.rhinoxPayIdText}>
                        Rhinox Pay ID: {validatedRecipient.rhinoxPayId}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Error Message */}
          {isValidatingError && !validatedRecipient && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20 * SCALE} color="#ff0000" />
              <ThemedText style={styles.errorText}>
                {validationError?.message || 'User not found. Please check the email and try again.'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Continue Button */}
        {validatedRecipient && (
          <View style={styles.continueButtonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 100 * SCALE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  balanceSectionContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  balanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 84 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceCardContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  walletIcon: {
    width: 18 * SCALE,
    height: 16 * SCALE,
    marginBottom: -1,
  },
  balanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  inputSection: {
    marginBottom: 20 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 12 * SCALE,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 18 * SCALE,
    marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  validateButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  validateButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  recipientDetailsSection: {
    marginTop: 20 * SCALE,
    paddingTop: 20 * SCALE,
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  recipientCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recipientAvatarContainer: {
    marginRight: 12 * SCALE,
  },
  recipientAvatar: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    borderRadius: 25 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: {
    fontSize: 20 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  recipientEmail: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4 * SCALE,
  },
  recipientPhone: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8 * SCALE,
  },
  rhinoxPayIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * SCALE,
    marginTop: 4 * SCALE,
  },
  rhinoxPayIdText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff00001A',
    borderRadius: 10 * SCALE,
    padding: 12 * SCALE,
    marginTop: 15 * SCALE,
    gap: 8 * SCALE,
  },
  errorText: {
    flex: 1,
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#ff0000',
  },
  continueButtonContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 20 * SCALE,
  },
  continueButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
});

export default SendToRhinoxPayUser;
