import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetTransferEligibility, useGetTransferReceipt } from '../../../queries/transfer.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { useGetPaymentMethods } from '../../../queries/paymentSettings.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { showErrorAlert, showWarningAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Fallback countries data
const FALLBACK_COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: require('../../../assets/login/nigeria-flag.png'), code: 'NG' },
  { id: 2, name: 'Botswana', flag: require('../../../assets/login/nigeria-flag.png'), code: 'BW' },
  { id: 3, name: 'Ghana', flag: require('../../../assets/login/nigeria-flag.png'), code: 'GH' },
  { id: 4, name: 'Kenya', flag: require('../../../assets/login/nigeria-flag.png'), code: 'KE' },
  { id: 5, name: 'South Africa', flag: require('../../../assets/login/south-africa-flag.png'), code: 'ZA' },
  { id: 6, name: 'Tanzania', flag: require('../../../assets/login/nigeria-flag.png'), code: 'TZ' },
  { id: 7, name: 'Uganda', flag: require('../../../assets/login/nigeria-flag.png'), code: 'UG' },
];

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  paymentMethodId?: number;
}

// Currency mapping based on country code
const getCurrencyFromCountryCode = (countryCode: string): string => {
  const currencyMap: { [key: string]: string } = {
    'NG': 'NGN',
    'KE': 'KES',
    'GH': 'GHS',
    'ZA': 'ZAR',
    'BW': 'BWP',
    'TZ': 'TZS',
    'UG': 'UGX',
  };
  return currencyMap[countryCode] || 'NGN';
};

const Withdrawal = () => {
  const navigation = useNavigation();

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

  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Get currency from country code
  const currency = useMemo(() => getCurrencyFromCountryCode(selectedCountry), [selectedCountry]);

  // Fetch transfer eligibility
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
  } = useGetTransferEligibility();

  const isEligible = eligibilityData?.data?.eligible ?? true;

  // Fetch payment methods (bank accounts)
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPaymentMethods,
    refetch: refetchPaymentMethods,
  } = useGetPaymentMethods({ type: 'bank_account' });

  // Transform payment methods to bank accounts
  const bankAccounts = useMemo(() => {
    if (!paymentMethodsData?.data || !Array.isArray(paymentMethodsData.data)) {
      return [];
    }
    return paymentMethodsData.data
      .filter((method: any) => method.type === 'bank_account' || method.type === 'Bank Transfer')
      .map((method: any) => ({
        id: String(method.id),
        bankName: method.bankName || method.bank_name || 'Unknown Bank',
        accountNumber: method.accountNumber || method.account_number || '',
        accountName: method.accountName || method.account_name || '',
        paymentMethodId: method.id,
      }));
  }, [paymentMethodsData?.data]);

  // Fetch countries
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data with currency info
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return FALLBACK_COUNTRIES;
    }
    return countriesData.data.map((country: any) => {
      const code = country.code || country.countryCode || '';
      
      // Handle flag - can be URL from backend or use fallback
      let flagSource: any = require('../../../assets/login/nigeria-flag.png'); // Default fallback
      if (country.flag) {
        if (typeof country.flag === 'string') {
          // If it's a URL path from backend
          if (country.flag.startsWith('/') || country.flag.startsWith('http')) {
            flagSource = { uri: country.flag.startsWith('/') 
              ? `${API_BASE_URL.replace('/api', '')}${country.flag}`
              : country.flag };
          } else {
            // Try to match with fallback countries
            const fallback = FALLBACK_COUNTRIES.find(fc => fc.code === code);
            flagSource = fallback?.flag || flagSource;
          }
        } else {
          flagSource = country.flag;
        }
      } else {
        // Try to match with fallback countries by code
        const fallback = FALLBACK_COUNTRIES.find(fc => fc.code === code);
        flagSource = fallback?.flag || flagSource;
      }

      return {
        id: country.id,
        name: country.name,
        code: code,
        flag: flagSource,
      };
    });
  }, [countriesData?.data]);

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalance,
    refetch: refetchBalances,
  } = useGetWalletBalances();

  // Get balance for selected currency
  const balance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) return '0';
    const wallet = balancesData.data.fiat.find((w: any) => w.currency === currency);
    return wallet?.balance || '0';
  }, [balancesData?.data?.fiat, currency]);

  // Format balance for display
  const formatBalance = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Fetch receipt when transaction ID is available
  const {
    data: receiptDataResponse,
    isLoading: isLoadingReceipt,
  } = useGetTransferReceipt(
    pendingTransactionId ? String(pendingTransactionId) : '',
    { enabled: !!pendingTransactionId && showReceiptModal }
  );

  // Update receipt data when fetched
  useEffect(() => {
    if (receiptDataResponse?.data) {
      setReceiptData(receiptDataResponse.data);
    }
  }, [receiptDataResponse]);

  // Initiate transfer mutation
  const initiateMutation = useInitiateTransfer({
    onSuccess: (response) => {
      const transactionData = response.data;
      setPendingTransactionId(transactionData.id);
      setPendingTransactionData(transactionData);
      setShowSummaryModal(false);
      setShowPinModal(true);
    },
    onError: (error: any) => {
      showErrorAlert('Error', error.message || 'Failed to initiate transfer. Please try again.');
    },
  });

  // Verify transfer mutation
  const verifyMutation = useVerifyTransfer({
    onSuccess: () => {
      setShowSecurityModal(false);
      setShowSuccessModal(true);
      // Fetch receipt
      if (pendingTransactionId) {
        // Receipt will be fetched automatically via the query hook
      }
    },
    onError: (error: any) => {
      showErrorAlert('Error', error.message || 'Failed to verify transfer. Please try again.');
    },
  });

  const quickAmounts = ['N100', 'N200', 'N500', 'N1,000'];

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace(/[N,]/g, '');
    setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  };

  const handleBankSelect = (bank: BankAccount) => {
    setSelectedBank(bank);
  };

  const handleApplyBank = () => {
    if (selectedBank) {
      setShowBankModal(false);
      setShowFilterDropdown(false);
      setSearchQuery('');
    }
  };

  const handleProceed = () => {
    if (selectedBank && amount) {
      setShowSummaryModal(true);
    }
  };

  const handleCompleteWithdrawal = () => {
    if (!selectedBank || !amount) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isEligible) {
      showWarningAlert('Not Eligible', eligibilityData?.data?.message || 'You are not eligible to make transfers. Please complete your KYC verification.');
      return;
    }

    // Initiate transfer
    const initiateData: any = {
      amount: amount.replace(/,/g, ''),
      currency: currency,
      countryCode: selectedCountry,
      channel: 'bank_account',
      accountNumber: selectedBank.accountNumber,
      bankName: selectedBank.bankName,
    };

    if (selectedBank.paymentMethodId) {
      initiateData.paymentMethodId = selectedBank.paymentMethodId;
    }

    initiateMutation.mutate(initiateData);
  };

  const handlePinPress = (num: string) => {
    setLastPressedButton(num);
    setTimeout(() => {
      setLastPressedButton(null);
    }, 200);

    if (pin.length < 5) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 5) {
        // Auto proceed to security verification
        setTimeout(() => {
          setShowPinModal(false);
          setShowSecurityModal(true);
        }, 300);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (hasHardware) {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (isEnrolled) {
          setIsBiometricAvailable(true);
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('Iris');
          }
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  // Get stored PIN from secure storage
  const getStoredPin = async (): Promise<string | null> => {
    try {
      const storedPin = await AsyncStorage.getItem('user_pin');
      return storedPin;
    } catch (error) {
      console.error('Error retrieving stored PIN:', error);
      return null;
    }
  };

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!isBiometricAvailable) {
      showWarningAlert(
        'Biometrics Not Available',
        'Your device does not support biometrics or it is not set up. Please enter your PIN manually.'
      );
      return;
    }

    setIsScanning(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${biometricType} to verify transaction`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      setIsScanning(false);

      if (result.success) {
        // Try to get stored PIN
        const storedPin = await getStoredPin();
        
        if (storedPin) {
          // Auto-fill PIN and proceed
          setPin(storedPin);
          // The handlePinPress logic will automatically proceed when PIN is 5 digits
          // But since we're setting it directly, we need to trigger the proceed logic
          if (storedPin.length >= 4) {
            // Close PIN modal and proceed to security verification
            setTimeout(() => {
              setShowPinModal(false);
              setShowSecurityModal(true);
            }, 300);
          }
        } else {
          // If no stored PIN, show message that PIN is still required
          showWarningAlert(
            'PIN Required',
            'Biometric authentication successful. Please enter your PIN to complete the transaction.'
          );
        }
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled - do nothing
        } else {
          showErrorAlert(
            'Authentication Failed',
            'Biometric authentication failed. Please try again or enter your PIN manually.'
          );
        }
      }
    } catch (error: any) {
      setIsScanning(false);
      console.error('Biometric authentication error:', error);
      showErrorAlert(
        'Error',
        'An error occurred during biometric authentication. Please enter your PIN manually.'
      );
    }
  };

  const handleSecurityComplete = () => {
    if (emailCode.length !== 5 || !pin || pin.length < 4) {
      showErrorAlert('Error', 'Please enter a valid 5-digit email code and 4-digit PIN');
      return;
    }

    if (!pendingTransactionId) {
      showErrorAlert('Error', 'Transaction ID not found. Please try again.');
      return;
    }

    // Verify transfer with email code and PIN
    verifyMutation.mutate({
      transactionId: pendingTransactionId,
      emailCode: emailCode,
      pin: pin,
    });
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    await Clipboard.setStringAsync(accountNumber);
    // TODO: Show toast notification
  };

  const filteredBanks = bankAccounts.filter((bank) => {
    // Search filter
    const matchesSearch = 
      bank.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.accountNumber.includes(searchQuery) ||
      bank.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter (if needed in future, currently just "All")
    const matchesFilter = selectedFilter === 'All' || true; // Add filter logic here if needed
    
    return matchesSearch && matchesFilter;
  });

  // Update selected country when countries data loads
  useEffect(() => {
    if (countries.length > 0 && !countries.find(c => (c as any).code === selectedCountry)) {
      const defaultCountry = countries.find(c => (c as any).code === 'NG') || countries[0];
      if (defaultCountry) {
        setSelectedCountry((defaultCountry as any).code || String((defaultCountry as any).id));
        setSelectedCountryName((defaultCountry as any).name);
      }
    }
  }, [countries, selectedCountry]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([
      refetchBalances(),
      refetchPaymentMethods(),
    ]);
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
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Withdrawal</ThemedText>
          </View>
        </View>

        {/* Balance Section with Linear Gradient */}
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
                  <ThemedText style={styles.balanceAmountInput}>
                    {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                    {formatBalance(balance)}
                  </ThemedText>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  {(() => {
                    const selectedCountryData = countries.find((c) => (c as any).code === selectedCountry || String((c as any).id) === selectedCountry);
                    const flagSource = selectedCountryData?.flag || countries[0]?.flag || FALLBACK_COUNTRIES[0].flag;
                    return (
                      <Image
                        source={flagSource}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    );
                  })()}
                  <ThemedText style={styles.countryNameText}>{selectedCountryName}</ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputLabelContainer}>
              <ThemedText style={styles.amountInputLabel}>N</ThemedText>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/,/g, '');
                  if (numericValue === '' || /^\d+$/.test(numericValue)) {
                    setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                  }
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => handleAmountSelect(quickAmount)}
                >
                  <ThemedText style={styles.quickAmountText}>{quickAmount}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Withdrawal Account Field */}
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => setShowBankModal(true)}
            disabled={isLoadingPaymentMethods}
          >
            {isLoadingPaymentMethods ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ThemedText style={[styles.inputLabel, !selectedBank && styles.inputPlaceholder]}>
                  {selectedBank ? selectedBank.bankName : 'Withdrawal Account'}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Fee Display */}
        {pendingTransactionData?.fee && (
          <View style={styles.feeSection}>
            <Image
              source={require('../../../assets/CoinVertical.png')}
              style={styles.feeIcon}
              resizeMode="cover"
            />
            <ThemedText style={styles.feeText}>
              Fee : {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
              {parseFloat(pendingTransactionData.fee).toLocaleString()}
            </ThemedText>
          </View>
        )}

        {/* Bottom spacing for proceed button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Proceed Button - Fixed at bottom */}
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!selectedBank || !amount || isLoadingEligibility || isLoadingPaymentMethods || initiateMutation.isPending) && styles.proceedButtonDisabled
          ]}
          onPress={handleProceed}
          disabled={!selectedBank || !amount || isLoadingEligibility || isLoadingPaymentMethods || initiateMutation.isPending}
        >
          {initiateMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Select Bank Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBankModal(false);
          setShowFilterDropdown(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bankModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Bank</ThemedText>
              <TouchableOpacity onPress={() => {
                setShowBankModal(false);
                setShowFilterDropdown(false);
                setSearchQuery('');
              }}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={18 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by bank name, account number, or account name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filter Button */}
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <ThemedText style={styles.filterText}>{selectedFilter}</ThemedText>
                <View style={styles.filterButtonRight}>
                  <Image
                    source={require('../../../assets/Vector (35).png')}
                    style={styles.filterIcon}
                    resizeMode="contain"
                  />
                  <MaterialCommunityIcons 
                    name={showFilterDropdown ? "chevron-up" : "chevron-down"} 
                    size={14 * SCALE} 
                    color="#FFFFFF" 
                  />
                </View>
              </TouchableOpacity>
              
              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <View style={styles.filterDropdown}>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedFilter === 'All' && styles.filterOptionSelected]}
                    onPress={() => {
                      setSelectedFilter('All');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <ThemedText style={[styles.filterOptionText, selectedFilter === 'All' && styles.filterOptionTextSelected]}>
                      All
                    </ThemedText>
                    {selectedFilter === 'All' && (
                      <MaterialCommunityIcons name="check" size={16 * SCALE} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedFilter === 'Active' && styles.filterOptionSelected]}
                    onPress={() => {
                      setSelectedFilter('Active');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <ThemedText style={[styles.filterOptionText, selectedFilter === 'Active' && styles.filterOptionTextSelected]}>
                      Active
                    </ThemedText>
                    {selectedFilter === 'Active' && (
                      <MaterialCommunityIcons name="check" size={16 * SCALE} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {/* Bank List */}
            <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.bankListTitle}>Bank Transfer</ThemedText>
              {isLoadingPaymentMethods ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : filteredBanks.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={styles.bankItemValue}>No bank accounts found</ThemedText>
                </View>
              ) : (
                filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    selectedBank?.id === bank.id && styles.bankItemSelected,
                  ]}
                  onPress={() => handleBankSelect(bank)}
                >
                  {selectedBank?.id === bank.id && (
                    <View style={styles.selectedBadge}>
                      <ThemedText style={styles.selectedBadgeText}>Selected</ThemedText>
                    </View>
                  )}
                  <View style={styles.bankItemContent}>
                    <View style={styles.bankItemRow}>
                      <ThemedText style={styles.bankItemLabel}>Bank Name</ThemedText>
                      <ThemedText style={styles.bankItemValue}>{bank.bankName}</ThemedText>
                    </View>
                    <View style={styles.bankItemRow}>
                      <ThemedText style={styles.bankItemLabel}>Account Number</ThemedText>
                      <View style={styles.accountNumberRow}>
                        <ThemedText style={styles.bankItemValue}>{bank.accountNumber}</ThemedText>
                        <TouchableOpacity
                          onPress={() => handleCopyAccountNumber(bank.accountNumber)}
                          style={styles.copyButton}
                        >
                          <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.bankItemRow}>
                      <ThemedText style={styles.bankItemLabel}>Account Name</ThemedText>
                      <ThemedText style={styles.bankItemValue}>{bank.accountName}</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, !selectedBank && styles.applyButtonDisabled]}
              onPress={handleApplyBank}
              disabled={!selectedBank}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Summary</ThemedText>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Amount Section */}
            <View style={styles.summaryAmountSection}>
              <ThemedText style={styles.summaryAmountLabel}>You are Withdrawing</ThemedText>
              <ThemedText style={styles.summaryAmountValue}>N{amount}</ThemedText>
            </View>

            {/* Account Details */}
            <View style={styles.summaryDetailsCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Account Number</ThemedText>
                <ThemedText style={styles.summaryValue}>{selectedBank?.accountNumber || ''}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Bank Name</ThemedText>
                <ThemedText style={styles.summaryValue}>{selectedBank?.bankName || ''}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Account Name</ThemedText>
                <ThemedText style={styles.summaryValue}>{selectedBank?.accountName || ''}</ThemedText>
              </View>
            </View>

            {/* Transaction Details */}
            {pendingTransactionData && (
              <View style={styles.summaryDetailsCard}>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Transaction Fee</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                    {parseFloat(pendingTransactionData.fee || '0').toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Total Deduction</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                    {parseFloat(pendingTransactionData.totalDeduction || '0').toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Reference</ThemedText>
                  <ThemedText style={styles.summaryValue}>{pendingTransactionData.reference || 'N/A'}</ThemedText>
                </View>
              </View>
            )}

            {/* Warning Section */}
            <View style={styles.warningSection}>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>
                  Ensure you are sending cash to the right bank account number to prevent loss of funds
                </ThemedText>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>Payment will arrive in a few minutes</ThemedText>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.completeButton, initiateMutation.isPending && styles.proceedButtonDisabled]}
              onPress={handleCompleteWithdrawal}
              disabled={initiateMutation.isPending}
            >
              {initiateMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.completeButtonText}>Complete Withdrawal</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModalContent, styles.pinModalContentFull]}>
            <View style={styles.pinModalHeader}>
              <ThemedText style={styles.pinModalTitle}>Verification</ThemedText>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.pinIconContainer}>
              <View style={styles.pinIconCircle}>
                <Image
                  source={require('../../../assets/Group 49.png')}
                  style={styles.pinIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.pinModalTextContainer}>
              <ThemedText style={styles.pinInstruction}>Input Pin to Complete Transaction</ThemedText>
              <ThemedText style={styles.pinAmount}>
                {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                {amount.replace(/,/g, '')}
              </ThemedText>
            </View>

            <View style={styles.pinBar}>
              <View style={styles.pinBarInner}>
                {[0, 1, 2, 3, 4].map((index) => {
                  const hasValue = index < pin.length;
                  const digit = hasValue ? pin[index] : null;
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
                <TouchableOpacity 
                  style={styles.numpadButton}
                  onPress={handleBiometricAuth}
                  disabled={!isBiometricAvailable || isScanning}
                >
                  <View style={styles.ghostCircle}>
                    {isScanning ? (
                      <ActivityIndicator size="small" color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons 
                        name="fingerprint" 
                        size={24 * SCALE} 
                        color={isBiometricAvailable ? "#A9EF45" : "rgba(169, 239, 69, 0.5)"} 
                      />
                    )}
                  </View>
                </TouchableOpacity>
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
          </View>
        </View>
      </Modal>

      {/* Security Verification Modal */}
      <Modal
        visible={showSecurityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSecurityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.securityModalContentBottom}>
            <View style={styles.securityModalHeader}>
              <ThemedText style={styles.securityModalTitle}>Security Verification</ThemedText>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.securityIconContainer}>
              <View style={styles.securityIconCircle}>
                <Image
                  source={require('../../../assets/Group 49.png')}
                  style={styles.securityIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            <ThemedText style={styles.securityTitle}>Security Verification</ThemedText>
            <ThemedText style={styles.securitySubtitle}>Verify via email code</ThemedText>

            <View style={styles.securityInputWrapper}>
              <ThemedText style={styles.securityInputLabel}>Email Code</ThemedText>
              <View style={styles.securityInputField}>
                <TextInput
                  style={styles.securityInput}
                  placeholder="Input Code sent to your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={emailCode}
                  onChangeText={setEmailCode}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.securityProceedButton,
                (emailCode.length !== 5 || !pin || pin.length < 4 || verifyMutation.isPending) && styles.proceedButtonDisabled
              ]}
              onPress={handleSecurityComplete}
              disabled={emailCode.length !== 5 || !pin || pin.length < 4 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `${currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}${amount.replace(/,/g, '')}`,
          fee: pendingTransactionData?.fee ? `${currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}${parseFloat(pendingTransactionData.fee).toLocaleString()}` : 'N0',
          transactionType: 'send',
        }}
        onViewTransaction={() => {
          setShowSuccessModal(false);
          setShowReceiptModal(true);
        }}
        onCancel={() => {
          setShowSuccessModal(false);
        }}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={{
          transactionType: 'withdrawal',
          transferAmount: `${currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}${amount.replace(/,/g, '')}`,
          amountNGN: `${currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}${amount.replace(/,/g, '')}`,
          fee: receiptData?.fee || pendingTransactionData?.fee ? `${currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}${parseFloat(receiptData?.fee || pendingTransactionData?.fee || '0').toLocaleString()}` : 'N0',
          bank: selectedBank?.bankName || '',
          accountNumber: selectedBank?.accountNumber || '',
          accountName: selectedBank?.accountName || '',
          country: selectedCountryName,
          transactionId: receiptData?.transactionId || pendingTransactionData?.reference || 'N/A',
          dateTime: receiptData?.date || pendingTransactionData?.createdAt ? new Date(receiptData?.date || pendingTransactionData?.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Bank Transfer',
        }}
        onClose={() => {
          setShowReceiptModal(false);
        }}
      />

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList}>
              {isLoadingCountries ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : countries.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={styles.countryNameText}>No countries available</ThemedText>
                </View>
              ) : (
                countries.map((country) => (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry((country as any).code || String(country.id));
                      setSelectedCountryName(country.name);
                      setShowCountryModal(false);
                    }}
                  >
                    <Image 
                      source={country.flag} 
                      style={styles.countryFlagImage} 
                      resizeMode="cover" 
                    />
                    <ThemedText style={styles.countryNameText}>{country.name}</ThemedText>
                  </TouchableOpacity>
                ))
              )}
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
    backgroundColor: '#020c19',
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
    marginBottom: 10 * SCALE,
  },
  balanceCard: {
    borderRadius: 15 * 1,
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
  balanceAmountInput: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
    flex: 1,
    padding: 0,
    margin: 0,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  countryFlagImage: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 18 * SCALE,
  },
  countryNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
  },
  amountSection: {
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * 1,
  },
  amountInput: {
    fontSize: 50 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingTop: 80,
    paddingBottom: 80 * 1,
    padding: 0,
    margin: 0,
    fontFamily: 'Agbalumo-Regular',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
  },
  amountInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4 * SCALE,
  },
  amountInputLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 30,
    textAlign: 'center',
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 8 * SCALE,
    minWidth: 40 * SCALE,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    minHeight: 60 * SCALE,
  },
  inputLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  feeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: '#CE56001A',
    marginHorizontal: SCREEN_WIDTH * 0.047,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingVertical: 6 * SCALE,
    marginBottom: 10 * SCALE,
    borderRadius: 10 * SCALE,
  },
  feeIcon: {
    width: 14 * SCALE,
    height: 14 * SCALE,
  },
  feeText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 20 * SCALE,
    backgroundColor: '#020c19',
    paddingTop: 10 * SCALE,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bankModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
    paddingBottom: 20 * SCALE,
  },
  summaryModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
    paddingBottom: 20 * SCALE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  filterContainer: {
    marginTop: 10 * SCALE,
    marginHorizontal: 20 * SCALE,
    position: 'relative',
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 12 * SCALE,
    gap: 6 * SCALE,
    width: '100%',
    justifyContent: 'space-between',
  },
  filterText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
  },
  filterButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  filterIcon: {
    width: 14 * SCALE,
    height: 13 * SCALE,
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#020c19',
    borderRadius: 10 * SCALE,
    marginTop: 5 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    zIndex: 1000,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
  },
  filterOptionText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  filterOptionTextSelected: {
    color: '#A9EF45',
    fontWeight: '500',
  },
  bankList: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    maxHeight: 400 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * 1,
    backgroundColor: '#FFFFFF08',
    marginHorizontal: 14 * SCALE,
    marginTop: 20 * SCALE,
  },
  bankListTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  bankItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 14 * SCALE,
    marginBottom: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  bankItemSelected: {
    borderColor: '#A9EF45',
    borderWidth: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: 5 * SCALE,
    left: 14 * SCALE,
    backgroundColor: '#A9EF45',
    borderRadius: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    paddingVertical: 4 * SCALE,
  },
  selectedBadgeText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  bankItemContent: {
    marginTop: 20 * SCALE,
  },
  bankItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 10 * SCALE,
    backgroundColor: '#FFFFFF0D',
  },
  bankItemLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bankItemValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  copyButton: {
    padding: 4 * SCALE,
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  applyButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  summaryAmountSection: {
    alignItems: 'center',
    paddingVertical: 30 * SCALE,
  },
  summaryAmountLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  summaryAmountValue: {
    fontSize: 40 * 1,
    fontWeight: '700',
    color: '#A9EF45',
  },
  summaryDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 14 * SCALE,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  warningSection: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  warningText: {
    flex: 1,
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 14 * SCALE,
  },
  completeButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  countryModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '70%',
    paddingBottom: 20 * SCALE,
  },
  countryList: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12 * SCALE,
  },
  // PIN Modal Styles
  pinModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '90%',
  },
  pinModalContentFull: {
    maxHeight: '95%',
  },
  pinModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10 * SCALE,
    paddingTop: 30 * SCALE,
    paddingBottom: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  pinModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  pinIconContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  pinIconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    width: 120 * SCALE,
    height: 120 * SCALE,
  },
  pinModalTextContainer: {
    alignItems: 'center',
    marginBottom: 22 * SCALE,
  },
  pinInstruction: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8 * SCALE,
  },
  pinAmount: {
    fontSize: 36 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
    textAlign: 'center',
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
    marginBottom: 20 * SCALE,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20 * SCALE,
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
  numpadCirclePressed: {
    backgroundColor: '#A9EF45',
  },
  numpadText: {
    fontSize: 19.2 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  numpadTextPressed: {
    color: '#000000',
  },
  ghostCircle: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspaceSquare: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Security Modal Styles
  securityModalContentBottom: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    alignItems: 'center',
    maxHeight: '90%',
  },
  securityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  securityIconContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  securityIconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIcon: {
    width: 120 * SCALE,
    height: 120 * SCALE,
  },
  securityTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  securitySubtitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 30 * SCALE,
  },
  securityInputWrapper: {
    width: '100%',
    marginBottom: 20 * SCALE,
  },
  securityInputLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  securityInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 15 * SCALE,
  },
  securityInput: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  securityProceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
    minHeight: 56 * SCALE,
  },
});

export default Withdrawal;

