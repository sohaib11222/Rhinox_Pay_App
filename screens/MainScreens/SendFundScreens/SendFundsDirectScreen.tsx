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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetTransferEligibility, useGetTransferReceipt } from '../../../queries/transfer.queries';
import { useGetPaymentSettingsBanks } from '../../../queries/paymentSettings.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { showErrorAlert, showWarningAlert } from '../../../utils/customAlert';
import {
  proceedAfterTransactionInitiate,
  prepareTransactionConfirmPayload,
} from '../../../utils/securityVerification';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { defaultTabBarStyle } from '../../../navigation/tabBarConfig';
import { mapTransactionReceiptTransaction } from '../../../utils/transferReceipt';

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
  numericId?: number;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  rawData?: any;
}

const SendFundsDirectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = (route.params as any) || {};
  const recipientFromRoute = routeParams.recipient;
  const recipientEmailFromRoute = routeParams.recipientEmail;

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
            tabBarStyle: defaultTabBarStyle,
          });
        }
      };
    }, [navigation])
  );

  const queryClient = useQueryClient();
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState(recipientFromRoute?.email || recipientEmailFromRoute || '');
  const [accountName, setAccountName] = useState(recipientFromRoute?.name || '');
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const [transferData, setTransferData] = useState<any>(null); // Store transfer initiation response
  const [verifiedTransferKey, setVerifiedTransferKey] = useState('');

  // Check transfer eligibility
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    refetch: refetchEligibility,
  } = useGetTransferEligibility();

  // Fetch PalmPay-supported banks for NGN withdrawals.
  const {
    data: banksData,
    isLoading: isLoadingBanks,
    isFetching: isFetchingBanks,
    isError: isBanksError,
    error: banksError,
    refetch: refetchBanks,
  } = useGetPaymentSettingsBanks({
    countryCode: selectedCountryCode,
    currency: selectedCurrency,
  });

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

  // Prefetch banks when screen opens so the list is ready before the modal opens.
  useFocusEffect(
    React.useCallback(() => {
      refetchBanks();
    }, [refetchBanks])
  );

  // Transform PalmPay bank list from API
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    if (!banksData?.data || !Array.isArray(banksData.data)) {
      return [];
    }
    return banksData.data.map((bank: any, index: number) => {
      const bankCode = bank.bankCode || bank.code || '';
      return {
        id: String(bankCode || index + 1),
        name: bank.bankName || bank.name || 'Unknown Bank',
        type: 'bank_account',
        bankCode,
        rawData: bank,
      };
    });
  }, [banksData?.data]);

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
    } else {
      setBalance('0');
    }
  }, [fiatBalance]);

  // Set recipient data from route params if available
  useEffect(() => {
    if (recipientFromRoute) {
      setAccountName(recipientFromRoute.name || recipientFromRoute.email || '');
      if (recipientFromRoute.email || recipientEmailFromRoute) {
        setAccountNumber(recipientFromRoute.email || recipientEmailFromRoute || '');
      }
    }
  }, [recipientFromRoute, recipientEmailFromRoute]);

  // Initiate transfer mutation
  const initiateTransferMutation = useInitiateTransfer({
    onSuccess: (data) => {
      const transactionId = data?.data?.id;
      if (transactionId) {
        setTransactionId(transactionId);
        setTransferData(data?.data);
        if (data?.data?.recipientInfo?.accountName) {
          setAccountName(data.data.recipientInfo.accountName);
        }
        setVerifiedTransferKey(bankTransferKey);
        setPin('');
        setShowSummaryModal(false);
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
      setShowPinModal(false);
      setPin('');
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      setPin('');
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

  const quickAmounts = ['20%', '50%', '75%', '100%'];
  const formatCurrencyAmount = (value?: string | number | null) => {
    const numericValue = parseFloat(String(value ?? '0').replace(/,/g, ''));
    const safeValue = isNaN(numericValue) ? 0 : numericValue;
    return `${selectedCurrency === 'NGN' ? '₦' : selectedCurrency}${safeValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  const displayedFee = formatCurrencyAmount(transferData?.fee ?? 0);
  const displayedTotal = transferData?.totalDeduction
    ? formatCurrencyAmount(transferData.totalDeduction)
    : formatCurrencyAmount(amount || 0);
  const bankTransferKey = useMemo(() => {
    return [
      selectedBank?.bankCode || '',
      accountNumber.replace(/\D/g, ''),
      amount.replace(/,/g, ''),
      selectedCurrency,
      selectedCountryCode,
    ].join('|');
  }, [accountNumber, amount, selectedBank?.bankCode, selectedCountryCode, selectedCurrency]);
  const hasVerifiedTransfer = Boolean(transactionId && accountName && verifiedTransferKey === bankTransferKey);
  const recentTransactions: Array<{
    id: string;
    name: string;
    accountNumber: string;
    bank: string;
    country: string;
    date: string;
    avatar: any;
  }> = [];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchEligibility(),
        refetchBanks(),
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
    setTransactionId(null);
    setTransferData(null);
    setVerifiedTransferKey('');
    setAmount(calculatedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }));
  };

  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(text);
    setTransactionId(null);
    setTransferData(null);
    setVerifiedTransferKey('');
    if (!selectedBank || text !== selectedBank.accountNumber) {
      setAccountName('');
    }
  };

  const handleBankSelect = (bank: PaymentMethod) => {
    setTempSelectedBank(bank);
  };

  const handleApplyBank = () => {
    if (tempSelectedBank) {
      setSelectedBank(tempSelectedBank);
      setAccountName('');
      setTransactionId(null);
      setTransferData(null);
      setVerifiedTransferKey('');
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
           selectedBank !== null;
  }, [amount, accountNumber, selectedBank]);

  const handleProceed = () => {
    if (!isFormValid) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (hasVerifiedTransfer && transactionId) {
      setPin('');
      proceedAfterTransactionInitiate(transactionId, {
        showVerificationModal: () => setShowPinModal(true),
        confirm: (payload) =>
          verifyTransferMutation.mutate({
            transactionId: payload.transactionId,
            pin: payload.pin ?? '',
          }),
      });
      return;
    }

    const numericAmount = amount.replace(/,/g, '');
    if (!selectedBank?.bankCode) {
      showErrorAlert('Error', 'Invalid bank selected');
      return;
    }

    initiateTransferMutation.mutate({
      amount: numericAmount,
      currency: selectedCurrency,
      countryCode: selectedCountryCode,
      channel: 'bank_account',
      bankCode: selectedBank.bankCode,
      bankName: selectedBank.name,
      accountNumber: accountNumber.replace(/\D/g, ''),
    });
  };

  const handleSummaryProceed = () => {
    // Initiate transfer
    const numericAmount = amount.replace(/,/g, '');
    if (!selectedBank?.bankCode) {
      showErrorAlert('Error', 'Invalid bank selected');
      return;
    }

    initiateTransferMutation.mutate({
      amount: numericAmount,
      currency: selectedCurrency,
      countryCode: selectedCountryCode,
      channel: 'bank_account',
      bankCode: selectedBank.bankCode,
      bankName: selectedBank.name,
      accountNumber: accountNumber.replace(/\D/g, ''),
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
        setTimeout(() => {
          handlePinVerification(newPin);
        }, 300);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handlePinVerification = async (pinValue = pin) => {
    if (!transactionId) {
      showErrorAlert('Error', 'Transaction ID not found');
      return;
    }

    const result = await prepareTransactionConfirmPayload(transactionId, { pin: pinValue });
    if (!result.payload) {
      showWarningAlert('Security Verification Required', result.errorMessage || 'Verification required');
      return;
    }

    verifyTransferMutation.mutate({
      transactionId: result.payload.transactionId,
      pin: result.payload.pin ?? '',
    });
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
                    const country: any = countries.find((c: any) => c.id === selectedCountry);
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
                    setTransactionId(null);
                    setTransferData(null);
                    setVerifiedTransferKey('');
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
              <ThemedText style={styles.proceedButtonText}>
                {hasVerifiedTransfer ? 'Proceed' : 'Verify Account'}
              </ThemedText>
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
            Fee : {displayedFee}
          </ThemedText>
        </View>

        {recentTransactions.length > 0 && (
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
        )}

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
                {countries.map((country: any) => {
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
                        setSelectedBank(null);
                        setTempSelectedBank(null);
                        setAccountName('');
                        setTransactionId(null);
                        setTransferData(null);
                        setVerifiedTransferKey('');
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

            {isLoadingBanks && filteredPaymentMethods.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading banks...
                </ThemedText>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: 10 * SCALE, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 }}>
                  This may take longer on mobile data. Please wait.
                </ThemedText>
              </View>
            ) : isBanksError && filteredPaymentMethods.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 * SCALE, textAlign: 'center', marginBottom: 12 }}>
                  {banksError?.message || 'Could not load banks. Check your connection and try again.'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => refetchBanks()}
                >
                  <ThemedText style={styles.applyButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : filteredPaymentMethods.length > 0 ? (
              <>
                {isFetchingBanks && (
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 * SCALE, textAlign: 'center', marginBottom: 8 }}>
                    Updating bank list...
                  </ThemedText>
                )}
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
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', paddingHorizontal: 20 }}>
                  {searchBankQuery ? 'No banks found' : 'No banks available for this currency.'}
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
                {accountName ? (
                  <View style={styles.summaryDetailRow}>
                    <ThemedText style={styles.summaryDetailLabel}>Account Name</ThemedText>
                    <ThemedText style={styles.summaryDetailValue}>{accountName}</ThemedText>
                  </View>
                ) : null}
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Fee</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>
                    {displayedFee}
                  </ThemedText>
                </View>
                <View style={[styles.summaryDetailRow, {borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                  <ThemedText style={styles.summaryDetailLabel}>Total</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>
                    {displayedTotal}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.summaryProceedButton,
                initiateTransferMutation.isPending && styles.proceedButtonDisabled
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
      {showReceiptModal && receiptData?.data && (
        <TransactionReceiptModal
          visible={showReceiptModal && !isLoadingReceipt}
          transaction={mapTransactionReceiptTransaction(receiptData.data, {
            amount: amount.replace(/,/g, ''),
            currency: selectedCurrency,
            country: selectedCountryName,
            recipientName: accountName,
            accountName,
            bankName: selectedBank?.name,
            accountNumber,
          })}
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

