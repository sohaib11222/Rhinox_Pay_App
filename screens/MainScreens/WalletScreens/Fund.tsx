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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetMobileMoneyProviders, useGetBankDetails } from '../../../queries/deposit.queries';
import { useInitiateDeposit, useConfirmDeposit } from '../../../mutations/deposit.mutations';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCurrentUser } from '../../../queries/auth.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import * as Clipboard from 'expo-clipboard';
import { showSuccessAlert, showErrorAlert, showInfoAlert, showConfirmAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

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
  return currencyMap[countryCode] || 'KES';
};

const Fund = () => {
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

  // Channel selection (Bank Transfer or Mobile Money)
  const [selectedChannel, setSelectedChannel] = useState<'bank_transfer' | 'mobile_money'>('mobile_money');
  
  // Common state
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('NG'); // Nigeria by default
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [successTransactionData, setSuccessTransactionData] = useState<{
    amount: string;
    fee: string;
    currency: string;
    currencySymbol: string;
    country: string;
    provider?: string;
    mobileNumber?: string;
    accountName?: string;
    transactionId?: string;
    paymentMethod: string;
  } | null>(null);
  
  // Mobile Money specific state
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bank Transfer specific state
  const [bankDetails, setBankDetails] = useState<any>(null);

  // Get currency from country code
  const currency = useMemo(() => getCurrencyFromCountryCode(selectedCountry), [selectedCountry]);

  // Get currency symbol based on country
  const getCurrencySymbol = () => {
    if (selectedCountry === 'KE') return 'Ksh';
    if (selectedCountry === 'NG') return 'N';
    if (selectedCountry === 'GH') return 'GHC';
    if (selectedCountry === 'ZA') return 'R';
    return 'Ksh';
  };

  const currencySymbol = getCurrencySymbol();

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalance,
    refetch: refetchBalances,
  } = useGetWalletBalances();

  // Fetch current user to check PIN setup status
  const {
    data: userData,
    isLoading: isLoadingUser,
  } = useGetCurrentUser();

  // Check if PIN is set up
  const hasPinSetup = useMemo(() => {
    // Check various possible fields for PIN status
    const user = userData?.data;
    if (!user) return false;
    
    // Check common field names for PIN status
    return !!(
      user.hasPin ||
      user.pinSetup ||
      user.isPinSetup ||
      user.pinSet ||
      user.hasTransactionPin ||
      // If user object exists and doesn't explicitly say PIN is not set, assume it might be set
      // We'll rely on API error message for actual validation
      true
    );
  }, [userData]);

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

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      // Fallback to default countries
      return [
        { id: 1, name: 'Nigeria', code: 'NG', flag: '🇳🇬', flagUrl: null },
        { id: 2, name: 'Botswana', code: 'BW', flag: '🇧🇼', flagUrl: null },
        { id: 3, name: 'Ghana', code: 'GH', flag: '🇬🇭', flagUrl: null },
        { id: 4, name: 'Kenya', code: 'KE', flag: '🇰🇪', flagUrl: null },
        { id: 5, name: 'South Africa', code: 'ZA', flag: '🇿🇦', flagUrl: null },
      ];
    }
    return countriesData.data.map((country: any, index: number) => {
      // Check if flag is a URL path (starts with /) or an emoji
      const flagValue = country.flag || '';
      const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
      const flagUrl = isFlagUrl 
        ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
        : null;
      const flagEmoji = isFlagUrl ? null : (flagValue || '🏳️');
      
      return {
        id: country.id || index + 1,
        name: country.name || '',
        code: country.code || '',
        flag: flagEmoji,
        flagUrl: flagUrl,
      };
    });
  }, [countriesData?.data]);

  // Fetch bank details for bank transfer
  const {
    data: bankDetailsData,
    isLoading: isLoadingBankDetails,
    isError: isBankDetailsError,
    error: bankDetailsError,
    refetch: refetchBankDetails,
  } = useGetBankDetails({
    countryCode: selectedCountry,
    currency: currency,
  }, {
    queryKey: ['deposit', 'bank-details', selectedCountry, currency],
    enabled: selectedChannel === 'bank_transfer' && !!selectedCountry && !!currency,
  } as any);

  // Update bank details when data is fetched
  useEffect(() => {
    if (bankDetailsData?.data && selectedChannel === 'bank_transfer') {
      console.log('[Fund] Bank details loaded for', selectedCountry, currency);
      setBankDetails(bankDetailsData.data);
    } else if (isBankDetailsError && selectedChannel === 'bank_transfer') {
      console.error('[Fund] Bank details error:', bankDetailsError);
    }
  }, [bankDetailsData, selectedChannel, isBankDetailsError, bankDetailsError, selectedCountry, currency]);

  // Fetch mobile money providers based on country and currency
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    isError: isProvidersError,
    error: providersError,
    refetch: refetchProviders,
  } = useGetMobileMoneyProviders({
    countryCode: selectedCountry,
    currency: currency,
  }, {
    queryKey: ['deposit', 'mobile-money-providers', selectedCountry, currency],
    enabled: selectedChannel === 'mobile_money' && !!selectedCountry && !!currency,
  } as any);

  // Log provider fetch results
  useEffect(() => {
    if (providersData?.data && selectedChannel === 'mobile_money') {
      console.log('[Fund] Mobile money providers fetched successfully:', providersData.data.length || 0, 'providers for', selectedCountry, currency);
    } else if (isProvidersError && selectedChannel === 'mobile_money') {
      console.error('[Fund] Error fetching mobile money providers:', providersError);
    }
  }, [providersData, isProvidersError, providersError, selectedChannel, selectedCountry, currency]);

  // Transform providers to UI format
  const providers = useMemo(() => {
    if (!providersData?.data || !Array.isArray(providersData.data)) {
      console.log('[Fund] No mobile money providers available for', selectedCountry, currency);
      return [];
    }
    
    console.log('[Fund] Mobile money providers loaded:', providersData.data.length, 'providers for', selectedCountry, currency);
    
    return providersData.data.map((provider: any) => {
      // Default icon mapping
      let icon = require('../../../assets/Ellipse 20.png');
      if (provider.code === 'MTN') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'VODAFONE') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'AIRTEL' || provider.code === 'AIRTEL_MONEY') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      } else if (provider.code === 'MPESA') {
        icon = require('../../../assets/Ellipse 22.png');
      }

      return {
        id: provider.id,
        name: provider.name || provider.code || '',
        code: provider.code || '',
        icon: icon,
        rawData: provider,
      };
    });
  }, [providersData]);

  // Initiate deposit mutation
  const initiateMutation = useInitiateDeposit({
    onSuccess: (data: any) => {
      console.log('[Fund] Deposit initiated successfully:', JSON.stringify(data, null, 2));
      
      const transactionId = 
        data?.data?.id || 
        (data?.data as any)?.transactionId ||
        (data as any)?.id ||
        (data as any)?.transactionId;
      
      setPendingTransactionData(data?.data);
      
      // Set transaction ID for both channels
      if (transactionId) {
        const id = typeof transactionId === 'string' ? parseInt(transactionId, 10) : transactionId;
        if (!isNaN(id)) {
          setPendingTransactionId(id);
        } else {
          showErrorAlert('Error', 'Invalid transaction ID received');
          return;
        }
      } else {
        showErrorAlert('Error', 'Transaction ID not found in response');
        return;
      }
      
      if (selectedChannel === 'bank_transfer') {
        // Update bank details with reference from response
        if (data?.data?.reference) {
          setBankDetails((prev: any) => ({
            ...prev,
            reference: data.data.reference,
          }));
        }
        // For bank transfer, show PIN modal after user clicks "I've Made the Transfer"
        // Don't show PIN modal yet - wait for user to confirm they've made the transfer
      } else {
        // For mobile money, show PIN modal directly
        setShowPinModal(true);
      }
    },
    onError: (error: any) => {
      console.error('[Fund] Error initiating deposit:', error);
      const errorMessage = error?.message || 'Failed to initiate deposit';
      
      // Check if error is related to PIN not being set up
      const isPinError = 
        errorMessage.toLowerCase().includes('pin') && 
        (errorMessage.toLowerCase().includes('not') || errorMessage.toLowerCase().includes('setup') || errorMessage.toLowerCase().includes('set'));
      
      if (isPinError) {
        // Show helpful error with navigation option to setup PIN
        showConfirmAlert(
          'PIN Not Set Up',
          'You need to set up a transaction PIN before you can make deposits. Would you like to set up your PIN now?',
          () => {
            // Navigate to Account Security screen to setup PIN
            (navigation as any).navigate('Settings', {
              screen: 'AccountSecurity',
            });
          },
          undefined,
          'Setup PIN',
          'Cancel'
        );
      } else {
        showErrorAlert('Error', errorMessage);
      }
      
      // Error handling is done in the alert above
    },
  });

  // Confirm deposit mutation
  const confirmMutation = useConfirmDeposit({
    onSuccess: (data) => {
      console.log('[Fund] Deposit confirmed successfully:', data);
      
      // Store transaction data before resetting form
      // Try to get transaction ID from confirm response first, then from pendingTransactionData, then from pendingTransactionId
      const transactionId = data?.data?.id || 
        data?.data?.transactionId ||
        (data as any)?.id ||
        (data as any)?.transactionId ||
        pendingTransactionData?.id ||
        pendingTransactionData?.transactionId ||
        pendingTransactionId;
      
      // Get amount and fee from API response if available, otherwise use form values
      const apiAmount = data?.data?.amount || data?.data?.depositAmount || data?.data?.transactionAmount;
      const apiFee = data?.data?.fee || data?.data?.transactionFee;
      
      // Use API amount if available, otherwise use form amount, fallback to pendingTransactionData
      let transactionAmount = '';
      if (apiAmount) {
        transactionAmount = String(apiAmount).replace(/,/g, '');
      } else if (amount && amount.trim()) {
        transactionAmount = amount.replace(/,/g, '');
      } else if (pendingTransactionData?.amount) {
        transactionAmount = String(pendingTransactionData.amount).replace(/,/g, '');
      }
      
      // Validate amount
      if (!transactionAmount || isNaN(parseFloat(transactionAmount))) {
        console.error('[Fund] Invalid transaction amount:', { apiAmount, amount, pendingTransactionData });
        showErrorAlert('Error', 'Invalid transaction amount. Please try again.');
        return;
      }
      
      const transactionFee = apiFee 
        ? String(apiFee).replace(/,/g, '')
        : (pendingTransactionData?.fee ? String(pendingTransactionData.fee).replace(/,/g, '') : '20');
      
      const providerName = selectedChannel === 'mobile_money' 
        ? providers.find((p) => p.id === selectedProvider)?.name || ''
        : '';
      
      // Format amount with currency symbol for display
      const amountNum = parseFloat(transactionAmount);
      const feeNum = parseFloat(transactionFee) || 0;
      
      const formattedAmount = amountNum.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const formattedFee = feeNum.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      setSuccessTransactionData({
        amount: formattedAmount,
        fee: formattedFee,
        currency: currency,
        currencySymbol: currencySymbol,
        country: selectedCountryName,
        provider: providerName,
        mobileNumber: selectedChannel === 'mobile_money' ? momoNumber : undefined,
        accountName: selectedChannel === 'mobile_money' ? accountName : undefined,
        transactionId: transactionId ? String(transactionId) : undefined,
        paymentMethod: selectedChannel === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money',
      });
      
      setShowPinModal(false);
      setPin('');
      setPendingTransactionId(null);
      setPendingTransactionData(null);
      
      // Reset form
      setAmount('');
      setMomoNumber('');
      setAccountName('');
      setSelectedProvider(null);
      
      // Refresh balances
      refetchBalances();
      
      // Show success modal
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.error('[Fund] Error confirming deposit:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Failed to confirm deposit';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check if error is related to PIN
      const errorMessageLower = errorMessage.toLowerCase();
      const isPinNotSet = errorMessageLower.includes('pin not set') || 
                          errorMessageLower.includes('pin not setup') ||
                          errorMessageLower.includes('setup your pin');
      const isPinMismatch = errorMessageLower.includes('pin') && 
                           (errorMessageLower.includes('mismatch') || 
                            errorMessageLower.includes('incorrect') ||
                            errorMessageLower.includes('invalid') ||
                            errorMessageLower.includes('wrong'));
      
      if (isPinNotSet) {
        // Show helpful error with navigation option to setup PIN
        showConfirmAlert(
          'PIN Not Set Up',
          'You need to set up a transaction PIN before you can make deposits. Would you like to set up your PIN now?',
          () => {
            // Navigate to Account Security screen to setup PIN
            setShowPinModal(false);
            setPin('');
            (navigation as any).navigate('Settings', {
              screen: 'AccountSecurity',
            });
          },
          () => {
            setShowPinModal(false);
            setPin('');
          },
          'Setup PIN',
          'Cancel'
        );
      } else if (isPinMismatch) {
        // Show PIN mismatch error and clear PIN input
        showErrorAlert('PIN Error', errorMessage, () => {
          setPin('');
        });
      } else {
        // Show generic error
        showErrorAlert('Error', errorMessage);
      }
    },
  });

  const handleProviderSelect = (providerId: number) => {
    setSelectedProvider(providerId);
    setShowProviderModal(false);
  };

  const handleProceed = () => {
    // Validate amount
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showErrorAlert('Error', 'Please enter a valid amount');
      return;
    }

    if (selectedChannel === 'bank_transfer') {
      // If reference exists, user has made transfer - show PIN modal
      if (pendingTransactionData?.reference) {
        if (pendingTransactionId) {
          setShowPinModal(true);
        } else {
          showErrorAlert('Error', 'Transaction ID not found. Please initiate deposit again.');
        }
        return;
      }
      // For bank transfer, initiate deposit to get reference
      if (!bankDetails) {
        showErrorAlert('Error', 'Bank details not available. Please try again.');
        refetchBankDetails();
        return;
      }
      handleBankTransferInitiate();
    } else if (selectedChannel === 'mobile_money') {
      // Validate mobile money fields
      if (!selectedProvider || !momoNumber) {
        showErrorAlert('Error', 'Please fill in all required fields');
        return;
      }

      // Validate momo number
      if (momoNumber.length < 9) {
        showErrorAlert('Error', 'Please enter a valid mobile money number');
        return;
      }

      // Initiate mobile money deposit
      const initiateData: any = {
        amount: amount.replace(/,/g, ''),
        currency: currency,
        countryCode: selectedCountry,
        channel: 'mobile_money',
        providerId: selectedProvider,
      };

      initiateMutation.mutate(initiateData);
    }
  };

  const handleBankTransferInitiate = () => {
    // Initiate bank transfer deposit
    const initiateData: any = {
      amount: amount.replace(/,/g, ''),
      currency: currency,
      countryCode: selectedCountry,
      channel: 'bank_transfer',
      // No providerId for bank_transfer
    };

    initiateMutation.mutate(initiateData);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showSuccessAlert('Copied', 'Text copied to clipboard');
  };

  const handlePinPress = (num: string) => {
    setLastPressedButton(num);
    setTimeout(() => {
      setLastPressedButton(null);
    }, 200);

    // Only allow numeric digits for PIN
    if (num === '.' || !/^\d$/.test(num)) {
      return;
    }

    // Use functional setState to ensure we have the latest PIN value
    setPin((currentPin) => {
      if (currentPin.length < 5) {
        const newPin = currentPin + num;
        
        // If PIN reaches 5 digits, auto proceed after state update
        if (newPin.length === 5) {
          // Use setTimeout to ensure state is updated before calling handleConfirmDeposit
          setTimeout(() => {
            handleConfirmDeposit(newPin);
          }, 100);
        }
        
        return newPin;
      }
      return currentPin;
    });
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleConfirmDeposit = async (pinToUse?: string) => {
    // Use the provided pinToUse, or get the current pin state
    const pinValue = pinToUse || pin;
    
    // Validate PIN length - must be exactly 5 digits
    if (!pinValue || typeof pinValue !== 'string' || pinValue.length !== 5) {
      console.log('[Fund] PIN validation failed:', { pinValue, length: pinValue?.length, type: typeof pinValue });
      showErrorAlert('Error', 'Please enter your 5-digit PIN');
      return;
    }

    // Validate that PIN contains only digits
    if (!/^\d{5}$/.test(pinValue)) {
      console.log('[Fund] PIN contains non-digits:', pinValue);
      showErrorAlert('Error', 'PIN must contain only numbers');
      return;
    }

    if (pendingTransactionId !== null && pendingTransactionId !== undefined) {
      console.log('[Fund] Confirming deposit with transaction ID:', pendingTransactionId);
      confirmMutation.mutate({
        transactionId: pendingTransactionId,
        pin: pinValue,
      });
    } else {
      console.log('[Fund] Transaction ID not found:', pendingTransactionId);
      showErrorAlert('Error', 'Transaction ID not found. Please try again.');
    }
  };

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if proceed button should be enabled
  const isProceedEnabled = useMemo(() => {
    const hasAmount = amount.replace(/,/g, '').length > 0;
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

    if (selectedChannel === 'bank_transfer') {
      return hasAmount && isValidAmount && !isLoadingBankDetails && !!bankDetails && !initiateMutation.isPending;
    } else if (selectedChannel === 'mobile_money') {
      return (
        selectedProvider !== null &&
        momoNumber.length >= 9 &&
        hasAmount &&
        isValidAmount &&
        !initiateMutation.isPending
      );
    }
    return false;
  }, [selectedChannel, selectedProvider, momoNumber, amount, bankDetails, isLoadingBankDetails, initiateMutation.isPending]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[Fund] Refreshing wallet funding data...');
    try {
      const promises = [
        refetchBalances(),
      ];
      
      if (selectedChannel === 'bank_transfer') {
        promises.push(refetchBankDetails());
      } else if (selectedChannel === 'mobile_money') {
        promises.push(refetchProviders());
      }
      
      await Promise.all(promises);
      console.log('[Fund] Wallet funding data refreshed successfully');
    } catch (error) {
      console.error('[Fund] Error refreshing wallet funding data:', error);
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
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Fund Wallet</ThemedText>
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
                    {currencySymbol}{formatBalance(balance)}
                  </ThemedText>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
              disabled={isLoadingCountries}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (() => {
                const selectedCountryData = countries.find((c: any) => c.code === selectedCountry);
                const flagUrl = selectedCountryData?.flagUrl;
                const flagEmoji = selectedCountryData?.flag;
                
                return (
                  <>
                    {flagUrl ? (
                      <Image
                        source={{ uri: flagUrl }}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    ) : flagEmoji ? (
                      <ThemedText style={styles.countryFlagEmojiSelector}>{flagEmoji}</ThemedText>
                    ) : (
                      <Image
                        source={require('../../../assets/login/nigeria-flag.png')}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    )}
                    <ThemedText style={styles.countryNameText}>{selectedCountryName}</ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                  </>
                );
              })()}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Channel Selector */}
          <View style={styles.channelSelector}>
            <TouchableOpacity
              style={[
                styles.channelButton,
                selectedChannel === 'bank_transfer' && styles.channelButtonActive,
              ]}
              onPress={() => {
                setSelectedChannel('bank_transfer');
                setSelectedProvider(null);
                setMomoNumber('');
                setAccountName('');
              }}
            >
              <MaterialCommunityIcons 
                name="bank" 
                size={20 * SCALE} 
                color={selectedChannel === 'bank_transfer' ? '#000000' : '#FFFFFF'} 
              />
              <ThemedText style={[
                styles.channelButtonText,
                selectedChannel === 'bank_transfer' && styles.channelButtonTextActive,
              ]}>
                Bank Transfer
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.channelButton,
                selectedChannel === 'mobile_money' && styles.channelButtonActive,
              ]}
              onPress={() => {
                setSelectedChannel('mobile_money');
              }}
            >
              <MaterialCommunityIcons 
                name="cellphone" 
                size={20 * SCALE} 
                color={selectedChannel === 'mobile_money' ? '#000000' : '#FFFFFF'} 
              />
              <ThemedText style={[
                styles.channelButtonText,
                selectedChannel === 'mobile_money' && styles.channelButtonTextActive,
              ]}>
                Mobile Money
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <TextInput
              style={styles.amountInput}
              value={amount ? `${amount}${currencySymbol}` : ''}
              onChangeText={(text) => {
                // Remove currency symbols and commas
                const numericValue = text.replace(/[KshNGHCZAR,]/g, '').replace(/\s/g, '');
                if (numericValue === '' || /^\d+$/.test(numericValue)) {
                  setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
            <View style={styles.amountDivider} />
          </View>

          {/* Form Fields - Conditionally rendered based on channel */}
          <View style={styles.formFields}>
            {selectedChannel === 'bank_transfer' ? (
              <>
                {/* Bank Transfer Info - Show as Card */}
                {isLoadingBankDetails ? (
                  <View style={[styles.inputField, { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
                    <ActivityIndicator size="small" color="#A9EF45" />
                    <ThemedText style={[styles.inputLabel, { marginTop: 10, color: 'rgba(255, 255, 255, 0.5)' }]}>
                      Loading bank details...
                    </ThemedText>
                  </View>
                ) : isBankDetailsError ? (
                  <View style={[styles.inputField, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                    <MaterialCommunityIcons name="alert-circle" size={24 * SCALE} color="#ff0000" />
                    <ThemedText style={[styles.inputLabel, { marginTop: 10, color: '#ff0000', textAlign: 'center' }]}>
                      {bankDetailsError?.message || 'Failed to load bank details'}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.retryButton, { marginTop: 10 }]}
                      onPress={() => refetchBankDetails()}
                    >
                      <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : bankDetails ? (
                  <View style={styles.bankDetailsCardInline}>
                    <View style={[styles.bankDetailRowInline, { borderTopRightRadius: 10 * SCALE, borderTopLeftRadius: 10 * SCALE }]}>
                      <ThemedText style={styles.bankDetailLabelInline}>Bank Name</ThemedText>
                      <View style={styles.bankDetailValueRowInline}>
                        <ThemedText style={styles.bankDetailValueInline}>{bankDetails.bankName || 'N/A'}</ThemedText>
                        <TouchableOpacity onPress={() => copyToClipboard(bankDetails.bankName || '')}>
                          <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.bankDetailRowInline}>
                      <ThemedText style={styles.bankDetailLabelInline}>Account Number</ThemedText>
                      <View style={styles.bankDetailValueRowInline}>
                        <ThemedText style={styles.bankDetailValueInline}>{bankDetails.accountNumber || 'N/A'}</ThemedText>
                        <TouchableOpacity onPress={() => copyToClipboard(bankDetails.accountNumber || '')}>
                          <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.bankDetailRowInline}>
                      <ThemedText style={styles.bankDetailLabelInline}>Account Name</ThemedText>
                      <View style={styles.bankDetailValueRowInline}>
                        <ThemedText style={styles.bankDetailValueInline}>{bankDetails.accountName || 'N/A'}</ThemedText>
                        <TouchableOpacity onPress={() => copyToClipboard(bankDetails.accountName || '')}>
                          <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {pendingTransactionData?.reference && (
                      <View style={[styles.bankDetailRowInline, { borderBottomRightRadius: 10 * SCALE, borderBottomLeftRadius: 10 * SCALE }]}>
                        <ThemedText style={styles.bankDetailLabelInline}>Reference</ThemedText>
                        <View style={styles.bankDetailValueRowInline}>
                          <ThemedText style={[styles.bankDetailValueInline, { color: '#A9EF45' }]}>{pendingTransactionData.reference}</ThemedText>
                          <TouchableOpacity onPress={() => copyToClipboard(pendingTransactionData.reference)}>
                            <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#A9EF45" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {!pendingTransactionData?.reference && (
                      <View style={[styles.bankDetailRowInline, { borderBottomRightRadius: 10 * SCALE, borderBottomLeftRadius: 10 * SCALE }]} />
                    )}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                {/* Mobile Money Fields */}
                {/* Destination Provider */}
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowProviderModal(true)}
                  disabled={isLoadingProviders}
                >
                  {isLoadingProviders ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <ThemedText style={[styles.inputLabel, styles.inputPlaceholder]}>Loading providers...</ThemedText>
                    </View>
                  ) : (
                    <>
                      <ThemedText style={[styles.inputLabel, !selectedProvider && styles.inputPlaceholder]}>
                        {selectedProvider
                          ? providers.find((p) => p.id === selectedProvider)?.name || 'Destination Provider'
                          : providers.length > 0 
                            ? 'Destination Provider' 
                            : 'No providers available'}
                      </ThemedText>
                      <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Momo Number */}
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Momo Number"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={momoNumber}
                    onChangeText={setMomoNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Account holder name (Auto-filled) */}
                {accountName && (
                  <View style={styles.inputField}>
                    <ThemedText style={styles.inputLabel}>Account holder name</ThemedText>
                    <ThemedText style={styles.accountNameValue}>{accountName}</ThemedText>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          {selectedChannel === 'bank_transfer' ? (
            <>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>
                  Include the reference number in your bank transfer narration
                </ThemedText>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>
                  Transfer will take a few minutes to reflect after confirmation
                </ThemedText>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>Fee : {pendingTransactionData?.fee || '0.00'}{currencySymbol}</ThemedText>
              </View>
            </>
          ) : (
            <>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>
                  You will receive a mobile money prompt to confirm your payment
                </ThemedText>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>Payment will take a few minutes to reflect</ThemedText>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <ThemedText style={styles.warningText}>Fee : {pendingTransactionData?.fee || '0.00'}{currencySymbol}</ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Bottom spacing for proceed button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Proceed Button - Fixed at bottom */}
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, !isProceedEnabled && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!isProceedEnabled || initiateMutation.isPending}
        >
          {initiateMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.proceedButtonText}>
              {selectedChannel === 'bank_transfer' 
                ? (pendingTransactionData?.reference ? "I've Made the Transfer" : 'Initiate Deposit')
                : 'Proceed'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>


      {/* Select Provider Modal */}
      <Modal
        visible={showProviderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProviderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.providerModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Provider</ThemedText>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Provider List */}
            {isLoadingProviders ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading providers...
                </ThemedText>
              </View>
            ) : isProvidersError ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
                <ThemedText style={{ color: '#ff0000', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                  {providersError?.message || 'Failed to load providers. Please try again.'}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.applyButton, { marginTop: 20, backgroundColor: '#A9EF45' }]}
                  onPress={() => refetchProviders()}
                >
                  <ThemedText style={styles.applyButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : filteredProviders.length > 0 ? (
              <ScrollView style={styles.providerList}>
                {filteredProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.providerItem}
                    onPress={() => handleProviderSelect(provider.id)}
                  >
                    <Image source={provider.icon} style={styles.providerIcon} resizeMode="cover" />
                    <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedProvider === provider.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedProvider === provider.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="information" size={40 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                  {searchQuery ? 'No providers found matching your search' : `No providers available for ${selectedCountryName}. Please try a different country.`}
                </ThemedText>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowProviderModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Verification Modal with Keypad */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        onShow={() => {
          // Reset PIN when modal is shown to ensure clean state
          setPin('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModalContent, styles.pinModalContentFull]}>
            <View style={styles.pinModalHeader}>
              <ThemedText style={styles.pinModalTitle}>Verification</ThemedText>
              <TouchableOpacity onPress={() => {
                setShowPinModal(false);
                setPin('');
              }}>
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
              <ThemedText style={styles.pinInstruction}>Input Pin to Fund</ThemedText>
              <ThemedText style={styles.pinAmount}>{currencySymbol}{amount.replace(/,/g, '') || '0'}</ThemedText>
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
              <TouchableOpacity style={styles.fingerprintButton}>
                <MaterialCommunityIcons name="fingerprint" size={24 * SCALE} color="#A9EF45" />
              </TouchableOpacity>
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
                  onPress={() => handlePinPress('.')}
                >
                  <View
                    style={[
                      styles.numpadCircle,
                      lastPressedButton === '.' && styles.numpadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.numpadText,
                        lastPressedButton === '.' && styles.numpadTextPressed,
                      ]}
                    >
                      .
                    </ThemedText>
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

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: successTransactionData ? `${successTransactionData.amount}${successTransactionData.currencySymbol}` : `${amount}${currencySymbol}`,
          fee: successTransactionData ? `${successTransactionData.fee}${successTransactionData.currencySymbol}` : `20${currencySymbol}`,
          transactionType: 'deposit',
          networkProvider: successTransactionData?.provider,
          mobileNumber: successTransactionData?.mobileNumber,
          country: successTransactionData?.country,
        }}
        onViewTransaction={() => {
          setShowSuccessModal(false);
          setShowReceiptModal(true);
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          setSuccessTransactionData(null);
        }}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={{
          transactionType: 'deposit',
          transactionTitle: successTransactionData 
            ? `${successTransactionData.amount}${successTransactionData.currencySymbol} Deposited`
            : `${amount}${currencySymbol} Deposited`,
          transferAmount: successTransactionData 
            ? `${successTransactionData.amount}${successTransactionData.currencySymbol}`
            : `${amount}${currencySymbol}`,
          amountNGN: successTransactionData 
            ? `${successTransactionData.amount}${successTransactionData.currencySymbol}`
            : `${amount}${currencySymbol}`,
          fee: successTransactionData 
            ? `${successTransactionData.fee}${successTransactionData.currencySymbol}`
            : `20${currencySymbol}`,
          mobileNumber: successTransactionData?.mobileNumber || momoNumber,
          provider: successTransactionData?.provider || providers.find((p) => p.id === selectedProvider)?.name || '',
          accountName: successTransactionData?.accountName || accountName,
          country: successTransactionData?.country || selectedCountryName,
          transactionId: successTransactionData?.transactionId || '12dwerkxywurcksc',
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: successTransactionData?.paymentMethod || (selectedChannel === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'),
        }}
        onClose={() => {
          setShowReceiptModal(false);
          setSuccessTransactionData(null);
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
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
              </View>
            ) : (
              <ScrollView style={styles.countryList}>
                {countries.map((country: any) => (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(country.code);
                      setSelectedCountryName(country.name);
                      // Refetch data when country changes
                      if (selectedChannel === 'bank_transfer') {
                        refetchBankDetails();
                      } else if (selectedChannel === 'mobile_money') {
                        refetchProviders();
                      }
                      // Reset provider selection
                      setSelectedProvider(null);
                      setShowCountryModal(false);
                    }}
                  >
                    {country.flagUrl ? (
                      <Image
                        source={{ uri: country.flagUrl }}
                        style={styles.countryFlagImageModal}
                        resizeMode="cover"
                      />
                    ) : country.flag ? (
                      <ThemedText style={styles.countryFlagEmoji}>{country.flag}</ThemedText>
                    ) : (
                      <View style={styles.countryFlagPlaceholder} />
                    )}
                    <ThemedText style={styles.countryNameText}>{country.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountry === country.code ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedCountry === country.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
  countryFlagImageModal: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
  },
  countryFlagEmoji: {
    fontSize: 24 * 1,
  },
  countryFlagEmojiSelector: {
    fontSize: 24 * 1,
    width: 36 * SCALE,
    height: 38 * SCALE,
    textAlign: 'center',
    lineHeight: 38 * SCALE,
  },
  countryFlagPlaceholder: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingTop: 90,
    paddingBottom: 90 * 1,
    padding: 0,
    margin: 0,
    fontFamily: 'Agbalumo-Regular',
  },
  amountDivider: {
    height: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20 * SCALE,
  },
  formFields: {
    gap: 14 * SCALE,
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
  textInput: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  accountNameValue: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  warningSection: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
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
  providerModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
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
    paddingHorizontal: 20 * 1,
    paddingTop: 18 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 7 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
    gap: 12 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  providerList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14 * SCALE,
    gap: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * 1,
    padding: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  providerIcon: {
    width: 33 * SCALE,
    height: 33 * SCALE,
    borderRadius: 16.5 * SCALE,
  },
  providerName: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
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
  warningSectionModal: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22 * SCALE,
    marginBottom: 35 * SCALE,
    gap: 12 * SCALE,
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
  fingerprintButton: {
    width: 60 * SCALE,
    height: 60 * SCALE,
    borderRadius: 30 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  backspaceSquare: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDetailsCardInline: {
    borderRadius: 15 * SCALE,
    marginBottom: 20 * SCALE,
    overflow: 'hidden',
  },
  bankDetailRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 22 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  bankDetailLabelInline: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bankDetailValueRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    flex: 1,
    justifyContent: 'flex-end',
  },
  bankDetailValueInline: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  pinModalScrollContent: {
    paddingBottom: 30 * SCALE,
    paddingHorizontal: 0,
  },
  pinInputContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 20 * SCALE,
  },
  pinLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 15 * SCALE,
    fontSize: 18 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  confirmButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  paymentSummaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 * SCALE,
  },
  paymentSummaryTotal: {
    marginTop: 8 * SCALE,
    paddingTop: 8 * SCALE,
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentSummaryLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  paymentSummaryValue: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  channelSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    padding: 4 * SCALE,
    marginBottom: 20 * SCALE,
    gap: 4 * SCALE,
  },
  channelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * SCALE,
    borderRadius: 8 * SCALE,
    gap: 8 * SCALE,
  },
  channelButtonActive: {
    backgroundColor: '#A9EF45',
  },
  channelButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  channelButtonTextActive: {
    color: '#000000',
  },
  bankDetailsModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
  },
  bankDetailsModalScrollContent: {
    paddingBottom: 30 * SCALE,
  },
  bankDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bankDetailLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  bankDetailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    flex: 1,
    justifyContent: 'flex-end',
  },
  bankDetailValue: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  bankDetailsInstructions: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  instructionsTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12 * SCALE,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8 * SCALE,
    marginBottom: 8 * SCALE,
  },
  instructionText: {
    flex: 1,
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 16 * SCALE,
  },
  initiateButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10 * SCALE,
  },
  initiateButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  confirmTransferButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10 * SCALE,
  },
  confirmTransferButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  retryButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 12 * SCALE,
    paddingHorizontal: 24 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
});

export default Fund;

