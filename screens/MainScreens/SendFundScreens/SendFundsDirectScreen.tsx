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
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetTransferEligibility, useGetTransferReceipt } from '../../../queries/transfer.queries';
import { useGetPaymentMethods } from '../../../queries/paymentSettings.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { showSuccessAlert, showErrorAlert, showInfoAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬', flagImage: require('../../../assets/login/nigeria-flag.png') },
  { id: 2, name: 'Botswana', flag: '🇧🇼', flagImage: require('../../../assets/login/nigeria-flag.png') },
  { id: 3, name: 'Ghana', flag: '🇬🇭', flagImage: require('../../../assets/login/nigeria-flag.png') },
  { id: 4, name: 'Kenya', flag: '🇰🇪', flagImage: require('../../../assets/login/south-africa-flag.png') },
  { id: 5, name: 'South Africa', flag: '🇿🇦', flagImage: require('../../../assets/login/south-africa-flag.png') },
  { id: 6, name: 'Tanzania', flag: '🇹🇿', flagImage: require('../../../assets/login/nigeria-flag.png') },
  { id: 7, name: 'Uganda', flag: '🇺🇬', flagImage: require('../../../assets/login/nigeria-flag.png') },
];

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface RecentTransaction {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
  country: string;
  date: string;
  avatar: any;
}

const SendFundsDirectScreen = () => {
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

  const queryClient = useQueryClient();
  const [balance, setBalance] = useState('200,000');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState<PaymentMethod | null>(null);
  const [tempSelectedBank, setTempSelectedBank] = useState<PaymentMethod | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(1);
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [isAuthenticatorSetup, setIsAuthenticatorSetup] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [authenticatorSetupCode] = useState('ADF1235678'); // TODO: Replace with API call
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const [transferData, setTransferData] = useState<any>(null); // Store transfer initiation response

  // Check transfer eligibility
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    refetch: refetchEligibility,
  } = useGetTransferEligibility();

  // Fetch bank accounts (payment methods) from API
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPaymentMethods,
  } = useGetPaymentMethods({ type: 'bank_account' });

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
  } = useGetWalletBalances();

  // Fetch transfer receipt when transactionId is available and receipt modal is shown
  const {
    data: receiptData,
    isLoading: isLoadingReceipt,
  } = useGetTransferReceipt(
    transactionId ? String(transactionId) : '',
    {
      enabled: showReceiptModal && transactionId !== null,
    }
  );

  // Transform payment methods from API
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    if (!paymentMethodsData?.data || !Array.isArray(paymentMethodsData.data)) {
      return [];
    }
    return paymentMethodsData.data
      .filter((method: any) => method.type === 'bank_account')
      .map((method: any) => ({
        id: String(method.id),
        name: method.bankName || 'Unknown Bank',
        type: method.type,
        numericId: method.id,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
        rawData: method,
      }));
  }, [paymentMethodsData?.data]);

  // Filter payment methods by search query
  const filteredPaymentMethods = useMemo(() => {
    if (!searchBankQuery.trim()) {
      return paymentMethods;
    }
    const query = searchBankQuery.toLowerCase();
    return paymentMethods.filter((method) =>
      method.name.toLowerCase().includes(query)
    );
  }, [paymentMethods, searchBankQuery]);

  // Transform countries from API
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return COUNTRIES;
    }
    return countriesData.data.map((country: any, index: number) => {
      const flagValue = country.flag || '';
      const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
      const flagUrl = isFlagUrl 
        ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
        : null;
      const defaultFlag = require('../../../assets/login/nigeria-flag.png');
      
      return {
        id: country.id || index + 1,
        name: country.name || '',
        code: country.code || '',
        flag: defaultFlag,
        flagUrl: flagUrl,
      };
    });
  }, [countriesData?.data]);

  // Get currency from country code
  const getCurrencyFromCountryCode = (code: string): string => {
    const currencyMap: { [key: string]: string } = {
      'NG': 'NGN',
      'KE': 'KES',
      'GH': 'GHS',
      'ZA': 'ZAR',
      'BW': 'BWP',
      'TZ': 'TZS',
      'UG': 'UGX',
    };
    return currencyMap[code] || 'NGN';
  };

  // Get balance for selected currency
  const fiatBalance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) {
      return '0';
    }
    const wallet = balancesData.data.fiat.find(
      (w: any) => w.currency === selectedCurrency
    );
    return wallet?.balance || '0';
  }, [balancesData?.data?.fiat, selectedCurrency]);

  // Update balance when currency changes
  useEffect(() => {
    if (fiatBalance) {
      const formatted = parseFloat(fiatBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setBalance(formatted);
    }
  }, [fiatBalance]);

  // Initiate transfer mutation
  const initiateTransferMutation = useInitiateTransfer({
    onSuccess: (data) => {
      const transactionId = data?.data?.id;
      if (transactionId) {
        setTransactionId(transactionId);
        setTransferData(data?.data);
        setShowSummaryModal(false);
        setShowPinModal(true);
      } else {
        showErrorAlert('Error', 'Transaction ID not found in response');
      }
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to initiate transfer');
    },
  });

  // Verify transfer mutation
  const verifyTransferMutation = useVerifyTransfer({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      setShowSecurityModal(false);
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to verify transfer');
    },
  });

  // Check eligibility on mount
  useEffect(() => {
    if (eligibilityData?.data) {
      const eligible = eligibilityData.data.eligible;
      if (!eligible) {
        showErrorAlert('Not Eligible', eligibilityData.data.message || 'You cannot complete your transaction because you are yet to complete your KYC');
      }
    }
  }, [eligibilityData?.data]);

  const recentTransactions: RecentTransaction[] = [
    { id: '1', name: 'Adebisi Lateefat', accountNumber: '1234567890', bank: 'Access Bank', country: 'Nigeria', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
    { id: '2', name: 'Akor Samuel', accountNumber: '0987654321', bank: 'Opay', country: 'Ghana', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
    { id: '3', name: 'Teslim Olamide', accountNumber: '1122334455', bank: 'Kuda Bank', country: 'Nigeria', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
    { id: '4', name: 'Ufondu Chike', accountNumber: '5566778899', bank: 'Palmpay', country: 'Nigeria', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
  ];

  const quickAmounts = ['20%', '50%', '75%', '100%'];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchEligibility(),
        // Refetch payment methods, countries, and balances if needed
      ]);
      console.log('[SendFundsDirect] Data refreshed successfully');
    } catch (error) {
      console.error('[SendFundsDirect] Error refreshing data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace('%', '');
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const calculatedAmount = (balanceNum * parseFloat(numericValue)) / 100;
    setAmount(calculatedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }));
  };

  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(text);
    // TODO: Fetch account name from API based on account number and bank
    if (text.length >= 10 && selectedBank) {
      setAccountName('Qamardeen Abdul Malik');
    } else {
      setAccountName('');
    }
  };

  const handleBankSelect = (bank: PaymentMethod) => {
    setTempSelectedBank(bank);
  };

  const handleApplyBank = () => {
    if (tempSelectedBank) {
      setSelectedBank(tempSelectedBank);
      setTempSelectedBank(null);
      setShowBankModal(false);
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    return amount.trim() !== '' &&
           !isNaN(numericAmount) &&
           numericAmount > 0 &&
           accountNumber.trim() !== '' &&
           accountName.trim() !== '' &&
           selectedBank !== null;
  }, [amount, accountNumber, accountName, selectedBank]);

  const handleProceed = () => {
    if (!isFormValid) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }
    if (accountNumber && accountName && selectedBank) {
      setShowSummaryModal(true);
    }
  };

  const handleSummaryProceed = () => {
    // Initiate transfer
    const numericAmount = amount.replace(/,/g, '');
    const numericBankId = selectedBank?.numericId || parseInt(selectedBank?.id || '0', 10);
    
    if (!numericBankId) {
      showErrorAlert('Error', 'Invalid bank account selected');
      return;
    }

    initiateTransferMutation.mutate({
      amount: numericAmount,
      currency: selectedCurrency,
      countryCode: selectedCountryCode,
      channel: 'bank_account',
      paymentMethodId: numericBankId,
    });
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

  const handleSecurityComplete = () => {
    if (!transactionId) {
      showErrorAlert('Error', 'Transaction ID not found');
      return;
    }
    // Only require PIN, email code and authenticator code are optional
    if (!pin || pin.length !== 5) {
      showErrorAlert('Validation Error', 'Please enter a valid 5-digit PIN');
      return;
    }

    // Use dummy values if email code or authenticator code not provided
    const emailCodeToUse = emailCode || '00000';
    const authenticatorCodeToUse = authenticatorCode || '00000';

    // Verify transfer
    verifyTransferMutation.mutate({
      transactionId: transactionId,
      emailCode: emailCodeToUse,
      pin: pin,
    });
  };

  const handleSetupAuthenticator = () => {
    setShow2FAModal(true);
  };

  const handleCopyAuthenticatorCode = async () => {
    try {
      await Clipboard.setStringAsync(authenticatorSetupCode);
      Alert.alert('Copied', 'Authenticator code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const handleProceed2FA = () => {
    // TODO: Implement API call to verify and save 2FA
    if (authenticatorCode.length > 0) {
      setIsAuthenticatorSetup(true);
      setShow2FAModal(false);
      // Don't clear authenticatorCode as it should remain in the security modal
    }
  };

  const handleViewTransaction = () => {
    setShowSuccessModal(false);
    setShowReceiptModal(true);
  };

  const handleSuccessCancel = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    navigation.goBack();
  };

  const getSelectedCountryData = () => {
    return COUNTRIES.find(c => c.id === selectedCountry) || COUNTRIES[0];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            onPress={() => {
              // Navigate back to Home tab instead of Settings tab
              (navigation as any).navigate('Home', { screen: 'HomeMain' });
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Send Funds</ThemedText>
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
                  style={[{ marginBottom: -1, width: 18, height: 16 }]}
                  resizeMode="cover"
                />
                <TextInput
                  style={styles.balanceAmountInput}
                  value={`N${balance}`}
                  onChangeText={(text) => {
                    // Remove 'N' prefix and format
                    const numericValue = text.replace(/[N,]/g, '');
                    setBalance(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                  }}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(169, 239, 69, 0.5)"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
              disabled={isLoadingCountries}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color="#A9EF45" />
              ) : (
                <>
                  {(() => {
                    const country = countries.find(c => c.id === selectedCountry);
                    const flagSource = country?.flagUrl 
                      ? { uri: country.flagUrl }
                      : country?.flag || require('../../../assets/login/nigeria-flag.png');
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
                  // Remove commas and format
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

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Select Bank */}
            <TouchableOpacity
              style={styles.bankField}
              onPress={() => setShowBankModal(true)}
            >
              <ThemedText style={[styles.bankFieldText, !selectedBank && styles.placeholder]}>
                {selectedBank ? selectedBank.name : 'Select Bank'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Enter Account Number */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Account Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
                keyboardType="numeric"
              />
            </View>

            {/* Account Name (Auto-filled) */}
            {accountName && (
              <View style={[styles.inputField, {backgroundColor: '#020C19', borderWidth: 0.3, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                <View style={styles.accountNameContainer}>
                  <ThemedText style={styles.accountNameLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.accountNameValue}>{accountName}</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              (!isFormValid || initiateTransferMutation.isPending || isLoadingEligibility) && styles.proceedButtonDisabled
            ]}
            onPress={handleProceed}
            disabled={!isFormValid || initiateTransferMutation.isPending || isLoadingEligibility}
          >
            {initiateTransferMutation.isPending || isLoadingEligibility ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Fee Display */}
        <View style={styles.feeSection}>
          <Image
            source={require('../../../assets/CoinVertical.png')}
            style={[{ marginBottom: -1, width: 14, height: 14 }]}
            resizeMode="cover"
          />
          <ThemedText style={styles.feeText}>
            Fee : {transferData?.fee 
              ? `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(transferData.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Calculating...'}
          </ThemedText>
        </View>

        {/* Recent Transactions Card */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <ThemedText style={styles.recentTransactionsTitle}>Recent Transactions</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <Image source={transaction.avatar} style={styles.transactionIcon} resizeMode="cover" />
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionPhone}>{transaction.name}</ThemedText>
                  <View style={styles.transactionMeta}>
                    <ThemedText style={styles.transactionPlan}>{transaction.accountNumber} • {transaction.bank}</ThemedText>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <ThemedText style={styles.transactionDate}>Last Transfer: {transaction.date}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading countries...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((country) => {
                  const flagSource = country.flagUrl 
                    ? { uri: country.flagUrl }
                    : country.flag;
                  
                  return (
                    <TouchableOpacity
                      key={country.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountry(country.id);
                        setSelectedCountryName(country.name);
                        setSelectedCountryCode(country.code);
                        setSelectedCurrency(getCurrencyFromCountryCode(country.code));
                        setShowCountryModal(false);
                      }}
                    >
                      <Image
                        source={flagSource}
                        style={styles.countryFlagModal}
                        resizeMode="cover"
                      />
                      <ThemedText style={styles.countryNameModal}>{country.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={selectedCountry === country.id ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24 * SCALE}
                        color={selectedCountry === country.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowCountryModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Bank Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Bank</ThemedText>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Bank"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchBankQuery}
                onChangeText={setSearchBankQuery}
              />
            </View>

            {isLoadingPaymentMethods ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading bank accounts...
                </ThemedText>
              </View>
            ) : filteredPaymentMethods.length > 0 ? (
              <ScrollView style={styles.paymentMethodList} showsVerticalScrollIndicator={false}>
                {filteredPaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentMethodItem}
                  onPress={() => handleBankSelect(method)}
                >
                  <ThemedText style={styles.paymentMethodItemText}>{method.name}</ThemedText>
                  {tempSelectedBank?.id === method.id ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', paddingHorizontal: 20 }}>
                  {searchBankQuery ? 'No bank accounts found' : 'No bank accounts available. Please add one in Payment Settings.'}
                </ThemedText>
              </View>
            )}

            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, !tempSelectedBank && styles.applyButtonDisabled]}
                onPress={handleApplyBank}
                disabled={!tempSelectedBank}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
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
            <View style={styles.summaryModalHeader}>
              <ThemedText style={styles.summaryModalTitle}>Summary</ThemedText>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <View style={styles.summaryCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryScrollContent} showsVerticalScrollIndicator={false}>
              {/* Transfer Details Card */}
              <View style={styles.summaryTransferCard}>
                {/* You Send Section */}
                <ThemedText style={styles.summarySectionLabel}>You send</ThemedText>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryRowLeft}>
                    <Image
                      source={require('../../../assets/login/nigeria-flag.png')}
                      style={styles.summaryFlag}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.summaryCountryText}>{selectedCountryName}</ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.summaryAmount}>₦{amount.replace(/,/g, '')}.00</ThemedText>
                </View>

                {/* Transfer Icon Divider */}
                <View style={styles.summaryDividerContainer}>
                  <View style={styles.summaryDividerLine} />
                  <View style={styles.summaryTransferCircle}>
                    <Image
                      source={require('../../../assets/sendingto.png')}
                      style={{width: 24, height: 24}}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.summaryDividerLine} />
                </View>

                {/* User Receives Section */}
                <ThemedText style={styles.summarySectionLabel}>User Receives</ThemedText>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryRowLeft}>
                    <Image
                      source={require('../../../assets/login/nigeria-flag.png')}
                      style={styles.summaryFlag}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.summaryCountryText}>{selectedCountryName}</ThemedText>
                  </View>
                  <ThemedText style={styles.summaryAmount}>₦{amount.replace(/,/g, '')}.00</ThemedText>
                </View>
              </View>

              {/* Details Card */}
              <View style={styles.summaryDetailsCard}>
                <View style={[styles.summaryDetailRow, {borderTopRightRadius: 10, borderTopLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                  <ThemedText style={styles.summaryDetailLabel}>Country</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{selectedCountryName}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Bank</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{selectedBank?.name || ''}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Account Number</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{accountNumber}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{accountName}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Fee</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>
                    {transferData?.fee 
                      ? `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(transferData.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Calculating...'}
                  </ThemedText>
                </View>
                <View style={[styles.summaryDetailRow, {borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                  <ThemedText style={styles.summaryDetailLabel}>Total</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>
                    {transferData?.totalDeduction 
                      ? `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(transferData.totalDeduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${amount.replace(/,/g, '')}.00`}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.summaryProceedButton,
                initiateTransferMutation.isPending && styles.summaryProceedButtonDisabled
              ]}
              onPress={handleSummaryProceed}
              disabled={initiateTransferMutation.isPending}
            >
              {initiateTransferMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.summaryProceedButtonText}>Proceed</ThemedText>
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
              <ThemedText style={styles.pinAmount}>N{amount}</ThemedText>
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
                <View style={styles.numpadButton}>
                  <View style={styles.ghostCircle}>
                    <MaterialCommunityIcons name="fingerprint" size={24 * SCALE} color="#A9EF45" />
                  </View>
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.securityModalContentBottom}>
            <View style={styles.securityModalHeader}>
              <ThemedText style={styles.securityModalTitle}>Security Verification</ThemedText>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.securityModalScrollView}
              contentContainerStyle={styles.securityModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
              <ThemedText style={styles.securitySubtitle}>Verify via email and your authenticator app</ThemedText>

              <View style={styles.securityInputWrapper}>
                <ThemedText style={styles.securityInputLabel}>Email Code (Optional)</ThemedText>
                <View style={styles.securityInputField}>
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Input Code sent to your email (optional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={emailCode}
                    onChangeText={setEmailCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Remove authenticator requirement - always show as optional */}
              <View style={styles.securityInputWrapper}>
                <ThemedText style={styles.securityInputLabel}>Authenticator App Code (Optional)</ThemedText>
                <View style={styles.securityInputField}>
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Input Code from your authenticator app (optional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={authenticatorCode}
                    onChangeText={setAuthenticatorCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  (!pin || pin.length !== 5 || verifyTransferMutation.isPending) && styles.proceedButtonDisabled
                ]}
                onPress={handleSecurityComplete}
                disabled={!pin || pin.length !== 5 || verifyTransferMutation.isPending}
              >
                {verifyTransferMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Setup Authenticator</ThemedText>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>

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
                  onPress={handleCopyAuthenticatorCode}
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
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `N${amount.replace(/,/g, '')}`,
          fee: 'N0',
          transactionType: 'send',
        }}
        onViewTransaction={handleViewTransaction}
        onCancel={handleSuccessCancel}
      />

      {/* Transaction Receipt Modal */}
      {receiptData?.data && (
        <TransactionReceiptModal
          visible={showReceiptModal && !isLoadingReceipt}
          transaction={{
            transactionType: 'send',
            transactionTitle: `Send Funds - ${receiptData.data.recipientInfo?.accountName || accountName}`,
            transferAmount: `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(receiptData.data.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            fee: receiptData.data.fee 
              ? `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(receiptData.data.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'N0',
            paymentAmount: receiptData.data.totalAmount 
              ? `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${parseFloat(receiptData.data.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${amount.replace(/,/g, '')}`,
            country: selectedCountryName,
            recipientName: receiptData.data.recipientInfo?.accountName || accountName,
            bank: receiptData.data.recipientInfo?.bankName || selectedBank?.name || '',
            accountNumber: receiptData.data.recipientInfo?.accountNumber || accountNumber,
            transactionId: receiptData.data.reference || receiptData.data.transactionId || `TRF-${transactionId}`,
            dateTime: receiptData.data.date || receiptData.data.completedAt || receiptData.data.createdAt
              ? new Date(receiptData.data.date || receiptData.data.completedAt || receiptData.data.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
            paymentMethod: 'Bank Transfer',
          }}
          onClose={handleReceiptClose}
        />
      )}

      {/* Loading overlay when fetching receipt */}
      {isLoadingReceipt && showReceiptModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#A9EF45" />
            <ThemedText style={{ color: '#FFFFFF', marginTop: 10, fontSize: 14 * SCALE }}>
              Loading receipt...
            </ThemedText>
          </View>
        </Modal>
      )}
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
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
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
    marginLeft: -40,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSectionContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
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
    fontSize: 14 * SCALE,
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
  formFields: {
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  bankField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    minHeight: 60 * SCALE,
  },
  bankFieldText: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
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
  textInput: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginRight: 12 * SCALE,
  },
  accountNameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNameLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4 * SCALE,
  },
  accountNameValue: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
    minHeight: 60 * SCALE,
    marginHorizontal: 10 * SCALE,
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
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
    borderRadius: 10 * 1,
  },
  feeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginTop: 10 * 1,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
  },
  recentTransactionsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  transactionsList: {
    gap: 8 * SCALE,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * 1,
    padding: 10 * SCALE,
  },
  transactionIcon: {
    width: 40 * 1,
    height: 40 * 1,
    borderRadius: 20 * SCALE,
    marginRight: 12 * SCALE,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  transactionPhone: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
  },
  transactionPlan: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30* SCALE,
    paddingBottom: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: '#484848',
  },
  modalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  modalList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    gap: 12 * SCALE,
  },
  countryFlagModal: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 18 * SCALE,
  },
  countryNameModal: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  // Select Bank Modal Styles
  paymentModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    maxHeight: '90%',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 17 * SCALE,
    height: 60 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    marginBottom: 6 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    marginLeft: 12 * SCALE,
  },
  paymentMethodList: {
    flex: 1,
    paddingHorizontal: 20 * SCALE,
    marginTop: 6 * SCALE,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 18 * SCALE,
    height: 60 * SCALE,
    marginBottom: 6 * SCALE,
  },
  paymentMethodItemText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  applyButtonContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 22 * SCALE,
    paddingTop: 20 * SCALE,
  },
  // Summary Modal Styles
  summaryModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '90%',
  },
  summaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryCloseCircle: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryScrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  summaryTransferCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  summarySectionLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15 * SCALE,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10 * SCALE,
    borderRadius: 100 * SCALE,
  },
  summaryFlag: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 12 * SCALE,
  },
  summaryCountryText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 20 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDividerLine: {
    flex: 1,
    height: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryTransferCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12 * SCALE,
  },
  summaryDetailsCard: {
    borderRadius: 15 * SCALE,
    marginBottom: 20 * SCALE,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF0D',
    padding: 15 * SCALE,
  },
  summaryDetailLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
  },
  summaryDetailValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryProceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryProceedButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
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
    paddingTop: 30* SCALE,
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
    maxHeight: '90%',
    flex: 1,
  },
  securityModalScrollView: {
    flex: 1,
  },
  securityModalScrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    alignItems: 'center',
  },
  securityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 10 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20 * SCALE,
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
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
    textAlign: 'center',
  },
  securitySubtitle: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 30 * SCALE,
  },
  securityInputWrapper: {
    width: '100%',
    marginBottom: 20 * SCALE,
    paddingHorizontal: 10 * SCALE,
  },
  securityInputLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  securityInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
    justifyContent: 'center',
  },
  securityInput: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  setupAuthenticatorText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 15 * SCALE,
    textAlign: 'center',
  },
  setupAuthenticatorButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 12 * SCALE,
    paddingHorizontal: 30 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  setupAuthenticatorButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  // 2FA Setup Modal Styles
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
    marginHorizontal: 10 * SCALE,
    alignItems: 'center',
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
  modalSection: {
    marginTop: 20 * SCALE,
  },
  modalSectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
    marginHorizontal: 10 * SCALE,
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
    marginHorizontal: 10 * SCALE,
  },
  modalInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  modalActionButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
    minHeight: 60 * SCALE,
    marginHorizontal: 10 * SCALE,
  },
  modalButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  modalActionButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
});

export default SendFundsDirectScreen;

