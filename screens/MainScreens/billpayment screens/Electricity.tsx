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
  Alert,
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
import { useGetBillPaymentProviders, useGetBillPaymentBeneficiaries } from '../../../queries/billPayment.queries';
import { useValidateMeter, useInitiateBillPayment, useConfirmBillPayment } from '../../../mutations/billPayment.mutations';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetBillPayments, useGetTransactionDetails, mapBillPaymentStatusToAPI } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const Electricity = ({ route }: any) => {
  const navigation = useNavigation();
  
  // Handle beneficiary selection from BeneficiariesScreen
  React.useEffect(() => {
    if (route?.params?.selectedBeneficiary) {
      const beneficiary = route.params.selectedBeneficiary;
      setMeterNumber(beneficiary.accountNumber || '');
      setAccountName(beneficiary.name || '');
      // Set provider if available
      if (beneficiary.provider?.id) {
        setSelectedBillerType(beneficiary.provider.id);
        setSelectedProviderCode(beneficiary.provider.code);
      }
      // Set account type if available
      if (beneficiary.accountType) {
        setSelectedAccountType(beneficiary.accountType.toLowerCase());
      }
      // Clear the params to avoid re-applying on re-render
      // @ts-ignore - navigation params typing
      navigation.setParams({ selectedBeneficiary: undefined });
    }
  }, [route?.params?.selectedBeneficiary, navigation]);
  
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

  const [selectedBillerType, setSelectedBillerType] = useState<number | null>(null);
  const [selectedProviderCode, setSelectedProviderCode] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<'prepaid' | 'postpaid' | null>(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBillerTypeModal, setShowBillerTypeModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '',
    fee: '',
    billerType: '',
    accountNumber: '',
    accountName: '',
    accountType: '',
    country: '',
    reference: '',
    dateTime: '',
    status: '',
  });

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalance,
    refetch: refetchBalances,
  } = useGetWalletBalances();

  // Get NGN balance from wallet balances
  const ngnBalance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) return '0';
    const ngnWallet = balancesData.data.fiat.find((w: any) => w.currency === 'NGN');
    return ngnWallet?.balance || '0';
  }, [balancesData?.data?.fiat]);

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
        { id: 6, name: 'Tanzania', code: 'TZ', flag: '🇹🇿', flagUrl: null },
        { id: 7, name: 'Uganda', code: 'UG', flag: '🇺🇬', flagUrl: null },
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

  // Fetch providers based on category and country
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    isError: isProvidersError,
    error: providersError,
    refetch: refetchProviders,
  } = useGetBillPaymentProviders({
    categoryCode: 'electricity',
    countryCode: selectedCountry,
  });

  // Transform providers to billers format
  const billerTypes = useMemo(() => {
    if (!providersData?.data || !Array.isArray(providersData.data)) {
      return [];
    }
    
    return providersData.data.map((provider: any) => {
      const logoUrl = provider.logoUrl 
        ? `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}`
        : null;
      
      // Default icon mapping
      let icon = require('../../../assets/Ellipse 20.png');
      if (provider.code === 'IKEJA' || provider.code === 'IKEDC') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'IBADAN' || provider.code === 'IBEDC') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'ABUJA' || provider.code === 'AEDC') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      } else {
        icon = require('../../../assets/Ellipse 22.png');
      }

      return {
        id: String(provider.id),
        name: provider.name || provider.code || '',
        code: provider.code || '',
        icon: logoUrl ? { uri: logoUrl } : icon,
        rawData: provider,
        meterTypes: provider.metadata?.meterTypes || ['prepaid', 'postpaid'],
      };
    });
  }, [providersData]);

  // Get account types from selected provider
  const accountTypes = useMemo(() => {
    if (!selectedBillerType) {
      return [
        { id: 'prepaid', name: 'Prepaid' },
        { id: 'postpaid', name: 'Postpaid' },
      ];
    }
    
    const provider = billerTypes.find((b) => b.id === String(selectedBillerType));
    if (provider?.meterTypes) {
      return provider.meterTypes.map((type: string) => ({
        id: type.toLowerCase(),
        name: type.charAt(0).toUpperCase() + type.slice(1),
      }));
    }
    
    return [
      { id: 'prepaid', name: 'Prepaid' },
      { id: 'postpaid', name: 'Postpaid' },
    ];
  }, [selectedBillerType, billerTypes]);

  // Fetch beneficiaries for electricity
  const {
    data: beneficiariesData,
    isLoading: isLoadingBeneficiaries,
    refetch: refetchBeneficiaries,
  } = useGetBillPaymentBeneficiaries({ categoryCode: 'electricity' });

  // Fetch recent transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetBillPayments({
    categoryCode: 'electricity',
    limit: 10,
    status: mapBillPaymentStatusToAPI('Completed') || 'completed', // Show completed transactions by default
  });

  // Fetch transaction details when a transaction is selected
  const {
    data: transactionDetailsData,
    isLoading: isLoadingDetails,
  } = useGetTransactionDetails(
    selectedTransactionId || 0,
    {
      queryKey: ['transaction-history', 'details', selectedTransactionId],
      enabled: !!selectedTransactionId,
    }
  );

  // Update transaction details when details are fetched
  useEffect(() => {
    if (transactionDetailsData?.data && selectedTransactionId) {
      const tx = transactionDetailsData.data;
      const metadata = tx.metadata || {};
      setTransactionDetails({
        amount: tx.amount || '0',
        fee: tx.fee || '0',
        billerType: metadata.providerName || metadata.providerCode || tx.description || '',
        accountNumber: metadata.accountNumber || tx.accountNumber || '',
        accountName: metadata.accountName || tx.accountName || '',
        accountType: metadata.accountType || '',
        country: 'NG', // Default to Nigeria for electricity
        reference: tx.reference || String(tx.id),
        dateTime: tx.completedAt || tx.createdAt
          ? new Date(tx.completedAt || tx.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        status: tx.status || 'completed',
      });
    }
  }, [transactionDetailsData, selectedTransactionId]);

  // Transform transactions to UI format
  // API response structure: { success: true, data: { summary: {...}, transactions: [...] } }
  const recentTransactions = useMemo(() => {
    if (!transactionsData?.data) {
      return [];
    }

    // Handle both old format (array) and new format (object with transactions array)
    const transactions = Array.isArray(transactionsData.data) 
      ? transactionsData.data 
      : transactionsData.data.transactions || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    return transactions.map((tx: any) => {
      const provider = tx.provider || {};
      const logoUrl = provider.logoUrl 
        ? `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}`
        : null;
      
      // Default icon mapping
      let icon = require('../../../assets/Ellipse 20.png');
      if (provider.code === 'IKEJA' || provider.code === 'IKEDC') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'IBADAN' || provider.code === 'IBEDC') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'ABUJA' || provider.code === 'AEDC') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      } else {
        icon = require('../../../assets/Ellipse 22.png');
      }

      const amount = parseFloat(tx.amount || '0');
      const date = tx.createdAt || tx.completedAt
        ? new Date(tx.createdAt || tx.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A';

      return {
        id: String(tx.id),
        transactionId: tx.id, // Store numeric ID for detail fetching
        meterNumber: tx.accountNumber || '',
        billerType: provider.name || provider.code || '',
        amount: `N${formatBalance(amount)}`,
        date: date,
        accountType: tx.accountType || '',
        icon: logoUrl ? { uri: logoUrl } : icon,
      };
    });
  }, [transactionsData?.data]);

  // Get recent beneficiaries for quick selection
  const recentBeneficiaries = useMemo(() => {
    if (!beneficiariesData?.data || !Array.isArray(beneficiariesData.data)) {
      return [];
    }
    return beneficiariesData.data.slice(0, 4).map((beneficiary: any) => {
      const provider = beneficiary.provider || {};
      const logoUrl = provider.logoUrl 
        ? `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}`
        : null;
      
      // Default icon mapping
      let icon = require('../../../assets/Ellipse 20.png');
      if (provider.code === 'IKEJA' || provider.code === 'IKEDC') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'IBADAN' || provider.code === 'IBEDC') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'ABUJA' || provider.code === 'AEDC') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      } else {
        icon = require('../../../assets/Ellipse 22.png');
      }

      return {
        id: String(beneficiary.id),
        meterNumber: beneficiary.accountNumber || '',
        billerType: provider.name || provider.code || '',
        accountType: beneficiary.accountType || '',
        icon: logoUrl ? { uri: logoUrl } : icon,
      };
    });
  }, [beneficiariesData?.data]);

  // Validate meter mutation
  const validateMeterMutation = useValidateMeter({
    onSuccess: (data: any) => {
      console.log('[Electricity] Meter validated successfully:', data);
      const customerName = data?.data?.customerName || data?.data?.name || '';
      if (customerName) {
        setAccountName(customerName);
      }
    },
    onError: (error: any) => {
      console.error('[Electricity] Error validating meter:', error);
      // Don't show alert, just clear account name
      setAccountName('');
    },
  });

  // Debounced meter validation
  useEffect(() => {
    if (!selectedBillerType || !selectedAccountType || !meterNumber || meterNumber.length < 10) {
      setAccountName('');
      return;
    }

    const timeoutId = setTimeout(() => {
      validateMeterMutation.mutate({
        providerId: selectedBillerType,
        meterNumber: meterNumber,
        accountType: selectedAccountType,
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [meterNumber, selectedBillerType, selectedAccountType]);

  // Initiate bill payment mutation
  const initiateMutation = useInitiateBillPayment({
    onSuccess: (data: any) => {
      console.log('[Electricity] Payment initiated successfully:', JSON.stringify(data, null, 2));
      
      const transactionId = 
        data?.data?.transactionId || 
        data?.data?.id || 
        data?.data?.transaction?.id ||
        (data?.data as any)?.transactionId ||
        (data as any)?.transactionId ||
        (data as any)?.id;
      
      setPendingTransactionData(data?.data);
      
      if (transactionId) {
        setPendingTransactionId(transactionId);
        setShowPinModal(true);
      } else {
        setShowPinModal(true);
      }
    },
    onError: (error: any) => {
      console.error('[Electricity] Error initiating payment:', error);
      Alert.alert('Error', error?.message || 'Failed to initiate payment');
    },
  });

  // Confirm bill payment mutation
  const confirmMutation = useConfirmBillPayment({
    onSuccess: (data) => {
      console.log('[Electricity] Payment confirmed successfully:', data);
      setShowPinModal(false);
      setPin('');
      setPendingTransactionId(null);
      setPendingTransactionData(null);
      
      // Set transaction details for success modal
      const numericAmount = parseFloat(amount.replace(/,/g, '') || '0');
      const transactionData = data?.data || {};
      setTransactionDetails({
        amount: String(numericAmount),
        fee: transactionData.fee || pendingTransactionData?.fee || '0',
        billerType: billerTypes.find((b) => b.id === String(selectedBillerType))?.name || '',
        accountNumber: meterNumber,
        accountName: transactionData.accountName || accountName || '',
        accountType: accountTypes.find((a: { id: string; name: string }) => a.id === selectedAccountType)?.name || '',
        country: selectedCountryName,
        reference: transactionData.reference || String(transactionData.id || ''),
        dateTime: transactionData.completedAt || transactionData.createdAt
          ? new Date(transactionData.completedAt || transactionData.createdAt).toLocaleString('en-US', {
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
        status: transactionData.status || 'completed',
      });
      
      // Reset form
      setMeterNumber('');
      setAmount('');
      setAccountName('');
      setSelectedBillerType(null);
      setSelectedProviderCode(null);
      setSelectedAccountType(null);
      
      // Refresh data
      refetchTransactions();
      refetchBalances();
      refetchBeneficiaries();
      
      // Show success modal
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.error('[Electricity] Error confirming payment:', error);
      Alert.alert('Error', error?.message || 'Failed to confirm payment');
    },
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[Electricity] Refreshing electricity data...');
    try {
      await Promise.all([
        refetchBalances(),
        refetchProviders(),
        refetchBeneficiaries(),
        refetchTransactions(),
      ]);
      console.log('[Electricity] Electricity data refreshed successfully');
    } catch (error) {
      console.error('[Electricity] Error refreshing electricity data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const handleBillerTypeSelect = (billerId: string) => {
    const biller = billerTypes.find((b) => b.id === billerId);
    if (biller) {
      setSelectedBillerType(parseInt(billerId));
      setSelectedProviderCode(biller.code);
      setSelectedAccountType(null); // Reset account type when provider changes
      setMeterNumber(''); // Reset meter number
      setAccountName(''); // Reset account name
      setShowBillerTypeModal(false);
    }
  };

  const handleAccountTypeSelect = (accountTypeId: string) => {
    setSelectedAccountType(accountTypeId as 'prepaid' | 'postpaid');
    setMeterNumber(''); // Reset meter number when account type changes
    setAccountName(''); // Reset account name
    setShowAccountTypeModal(false);
  };

  const handleProceed = () => {
    if (!selectedBillerType || !selectedAccountType || !meterNumber || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate meter number
    if (meterNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid meter number');
      return;
    }

    // Validate amount
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Initiate payment - only pass data that is coming
    const initiateData: any = {
      categoryCode: 'electricity',
      providerId: selectedBillerType,
      currency: 'NGN',
      amount: amount.replace(/,/g, ''),
      accountNumber: meterNumber,
      accountType: selectedAccountType,
    };

    initiateMutation.mutate(initiateData);
  };

  const handleConfirmPayment = async () => {
    if (!pin || pin.length < 5) {
      Alert.alert('Error', 'Please enter your 5-digit PIN');
      return;
    }

    if (pendingTransactionId) {
      confirmMutation.mutate({
        transactionId: pendingTransactionId,
        pin: pin,
      });
    } else {
      Alert.alert('Error', 'Transaction ID not found. Please try again.');
    }
  };

  const filteredBillers = billerTypes.filter((biller) =>
    biller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if proceed button should be enabled
  const isProceedEnabled = useMemo(() => {
    return (
      selectedBillerType !== null &&
      selectedAccountType !== null &&
      meterNumber.length >= 10 &&
      amount.replace(/,/g, '').length > 0 &&
      !initiateMutation.isPending
    );
  }, [selectedBillerType, selectedAccountType, meterNumber, amount, initiateMutation.isPending]);

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
            onPress={() => {
              // Navigate back to BillPaymentMainScreen (Call tab)
              // @ts-ignore - allow parent route name
              navigation.navigate('Call' as never);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Electricity</ThemedText>
          </View>
        </View>

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
                {isLoadingBalance ? (
                  <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                ) : (
                  <ThemedText style={styles.balanceAmountInput}>
                    N{formatBalance(ngnBalance)}
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
                      <ThemedText style={styles.countryFlagEmoji}>{flagEmoji}</ThemedText>
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
          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Biller Type - First */}
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => {
                setShowBillerTypeModal(true);
              }}
              disabled={isLoadingProviders}
            >
              {isLoadingProviders ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.inputLabel, styles.inputPlaceholder]}>Loading providers...</ThemedText>
                </View>
              ) : (
                <>
                  <ThemedText style={[styles.inputLabel, !selectedBillerType && styles.inputPlaceholder]}>
                    {selectedBillerType
                      ? billerTypes.find((b) => b.id === String(selectedBillerType))?.name || 'Select Biller Type'
                      : billerTypes.length > 0 
                        ? 'Select Biller Type' 
                        : 'No providers available'}
                  </ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Account Type - Second (only shown when provider is selected) */}
            {selectedBillerType && (
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => setShowAccountTypeModal(true)}
              >
                <ThemedText style={[styles.inputLabel, !selectedAccountType && styles.inputPlaceholder]}>
                  {selectedAccountType
                    ? accountTypes.find((a: { id: string; name: string }) => a.id === selectedAccountType)?.name || 'Select Account Type'
                    : accountTypes.length > 0
                      ? 'Select Account Type'
                      : 'No account types available'}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Meter Number - Third */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Meter Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={meterNumber}
                onChangeText={(text) => {
                  setMeterNumber(text);
                  // Account name will be set from validation
                  if (text.length < 10) {
                    setAccountName('');
                  }
                }}
                keyboardType="numeric"
                editable={!!selectedBillerType && !!selectedAccountType}
              />
              <TouchableOpacity
                onPress={() => {
                  // Only navigate if a provider is selected
                  if (!selectedBillerType) {
                    Alert.alert('Provider Required', 'Please select a provider first before viewing beneficiaries.');
                    return;
                  }
                  
                  // Navigate to BeneficiariesScreen with current form data
                  // @ts-ignore - allow parent route name
                  navigation.navigate('Beneficiaries' as never, {
                    categoryCode: 'electricity',
                    selectedProvider: selectedBillerType,
                    selectedProviderCode: selectedProviderCode,
                    onSelectBeneficiary: (beneficiary: any) => {
                      // Populate form with selected beneficiary
                      setMeterNumber(beneficiary.accountNumber || '');
                      setAccountName(beneficiary.name || '');
                      // Set provider if available
                      if (beneficiary.provider?.id) {
                        setSelectedBillerType(beneficiary.provider.id);
                        setSelectedProviderCode(beneficiary.provider.code);
                      }
                      // Set account type if available
                      if (beneficiary.accountType) {
                        setSelectedAccountType(beneficiary.accountType.toLowerCase() as 'prepaid' | 'postpaid');
                      }
                    },
                  });
                }}
                disabled={!selectedBillerType}
                style={!selectedBillerType ? { opacity: 0.5 } : {}}
              >
                <Image
                  source={require('../../../assets/AddressBook.png')}
                  style={[{ marginBottom: -1, width: 19, height: 19 }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            {/* Amount - Fourth */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={amount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/,/g, '');
                  if (numericValue === '' || /^\d+$/.test(numericValue)) {
                    setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Account Name (Auto-filled) */}
            {accountName && (
              <View style={[styles.inputField, { backgroundColor: '#020C19', justifyContent: 'center', alignItems: 'center' }]}>
                <View style={styles.accountNameContainer}>
                  <ThemedText style={styles.accountNameLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.accountNameValue}>{accountName}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Fee Display */}
        <View style={styles.feeSection}>
          <Image
            source={require('../../../assets/CoinVertical.png')}
            style={[{ marginBottom: -1, width: 14, height: 14 }]}
            resizeMode="cover"
          />
          <ThemedText style={styles.feeText}>Fee : N200</ThemedText>
        </View>

        {/* Recent Section */}
        <View style={styles.recentSection}>
          <ThemedText style={styles.recentTitle}>Recent</ThemedText>
          {isLoadingBeneficiaries ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : recentBeneficiaries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentBeneficiaries.map((beneficiary) => (
                <TouchableOpacity
                  key={beneficiary.id}
                  style={styles.recentItem}
                  onPress={() => {
                    setMeterNumber(beneficiary.meterNumber);
                    // Find and set the provider
                    const provider = billerTypes.find((b) => b.name === beneficiary.billerType || b.code === beneficiary.billerType);
                    if (provider) {
                      setSelectedBillerType(parseInt(provider.id));
                      setSelectedProviderCode(provider.code);
                    }
                    // Set account type if available
                    if (beneficiary.accountType) {
                      setSelectedAccountType(beneficiary.accountType.toLowerCase() as 'prepaid' | 'postpaid');
                    }
                  }}
                >
                  <Image source={beneficiary.icon} style={styles.recentIcon} resizeMode="cover" />
                  <ThemedText style={styles.recentMeter}>{beneficiary.meterNumber}</ThemedText>
                  <ThemedText style={styles.recentBiller}>{beneficiary.billerType}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                No recent beneficiaries
              </ThemedText>
            </View>
          )}
        </View>

        {/* Recent Transactions Card */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <ThemedText style={styles.recentTransactionsTitle}>Recent Transactions</ThemedText>
            <TouchableOpacity
              onPress={() => {
                // Navigate to BillPaymentsScreen with electricity filter
                // @ts-ignore - allow parent route name
                navigation.navigate('BillPayments' as never, {
                  initialCategory: 'Electricity',
                });
              }}
            >
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : isTransactionsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={{ color: '#ff0000', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                {transactionsError?.message || 'Failed to load transactions. Please try again.'}
              </ThemedText>
              <TouchableOpacity
                style={[styles.proceedButton, { marginTop: 20, backgroundColor: '#A9EF45', paddingHorizontal: 20 * SCALE }]}
                onPress={() => refetchTransactions()}
              >
                <ThemedText style={styles.proceedButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => {
                    // Fetch transaction details and show receipt modal
                    if (transaction.transactionId) {
                      setSelectedTransactionId(transaction.transactionId);
                      setShowReceiptModal(true);
                    }
                  }}
                >
                  <Image source={transaction.icon} style={styles.transactionIcon} resizeMode="cover" />
                  <View style={styles.transactionDetails}>
                    <ThemedText style={styles.transactionMeter}>{transaction.meterNumber}</ThemedText>
                    <View style={styles.transactionMeta}>
                      {transaction.accountType ? (
                        <>
                          <ThemedText style={styles.transactionAccountType}>{transaction.accountType}</ThemedText>
                          <View style={styles.transactionDot} />
                        </>
                      ) : null}
                      <ThemedText style={styles.transactionBiller}>{transaction.billerType}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <ThemedText style={styles.transactionAmount}>{transaction.amount}</ThemedText>
                    <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                No recent transactions
              </ThemedText>
            </View>
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
            <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Biller Type Selection Modal */}
      <Modal
        visible={showBillerTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBillerTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.billerModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Biller Type</ThemedText>
              <TouchableOpacity onPress={() => setShowBillerTypeModal(false)}>
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

            {/* Biller List */}
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
            ) : filteredBillers.length > 0 ? (
              <ScrollView style={styles.billerList}>
                {filteredBillers.map((biller) => (
                  <TouchableOpacity
                    key={biller.id}
                    style={styles.billerItem}
                    onPress={() => handleBillerTypeSelect(biller.id)}
                  >
                    <Image source={biller.icon} style={styles.billerIcon} resizeMode="cover" />
                    <ThemedText style={styles.billerName}>{biller.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedBillerType === parseInt(biller.id) ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedBillerType === parseInt(biller.id) ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
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
              onPress={() => setShowBillerTypeModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Type Selection Modal */}
      <Modal
        visible={showAccountTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Account Type</ThemedText>
              <TouchableOpacity onPress={() => setShowAccountTypeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Account Type List */}
            <ScrollView style={styles.modalList}>
              {accountTypes.map((accountType: { id: string; name: string }) => (
                <TouchableOpacity
                  key={accountType.id}
                  style={styles.accountTypeItem}
                  onPress={() => handleAccountTypeSelect(accountType.id)}
                >
                  <ThemedText style={styles.accountTypeName}>{accountType.name}</ThemedText>
                  <MaterialCommunityIcons
                    name={selectedAccountType === accountType.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24 * SCALE}
                    color={selectedAccountType === accountType.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowAccountTypeModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
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
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(country.code);
                      setSelectedCountryName(country.name);
                      // Refetch providers when country changes
                      refetchProviders();
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
                    <ThemedText style={styles.countryNameModal}>{country.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountry === country.code ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedCountry === country.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
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

      {/* PIN Confirmation Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.pinModalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pinModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Enter PIN</ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setShowPinModal(false);
                    setPin('');
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.pinInputContainer}>
                <ThemedText style={styles.pinLabel}>Enter your PIN to confirm payment</ThemedText>
                {pendingTransactionData && (
                  <View style={styles.paymentSummaryContainer}>
                    <View style={styles.paymentSummaryRow}>
                      <ThemedText style={styles.paymentSummaryLabel}>Amount:</ThemedText>
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.amount || amount.replace(/,/g, '') || '0'}</ThemedText>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <ThemedText style={styles.paymentSummaryLabel}>Fee:</ThemedText>
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.fee || '0'}</ThemedText>
                    </View>
                    <View style={[styles.paymentSummaryRow, styles.paymentSummaryTotal]}>
                      <ThemedText style={styles.paymentSummaryLabel}>Total:</ThemedText>
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.totalAmount || pendingTransactionData.amount || amount.replace(/,/g, '') || '0'}</ThemedText>
                    </View>
                  </View>
                )}
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={5}
                  placeholder="Enter PIN"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.confirmButton, (!pin || pin.length < 5 || confirmMutation.isPending) && styles.confirmButtonDisabled]}
                onPress={handleConfirmPayment}
                disabled={!pin || pin.length < 5 || confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.confirmButtonText}>Confirm Payment</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `N${transactionDetails.amount}`,
          fee: transactionDetails.fee,
          mobileNumber: transactionDetails.accountNumber,
          networkProvider: billerTypes.find((b) => b.id === String(selectedBillerType))?.name || transactionDetails.billerType,
          country: transactionDetails.country,
          transactionType: 'billPayment',
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
        visible={showReceiptModal && !isLoadingDetails}
        transaction={{
          transactionType: 'billPayment',
          transferAmount: `N${formatBalance(transactionDetails.amount)}`,
          amountNGN: `N${formatBalance(transactionDetails.amount)}`,
          fee: transactionDetails.fee ? `N${formatBalance(transactionDetails.fee)}` : 'N0',
          mobileNumber: transactionDetails.accountNumber,
          billerType: transactionDetails.billerType,
          plan: transactionDetails.accountType 
            ? `${transactionDetails.accountType} - ${transactionDetails.accountNumber}`
            : transactionDetails.accountNumber,
          recipientName: transactionDetails.accountName || 'Electricity Bill Payment',
          country: transactionDetails.country,
          transactionId: transactionDetails.reference || String(selectedTransactionId || ''),
          dateTime: transactionDetails.dateTime || new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Wallet',
        }}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedTransactionId(null);
        }}
      />

      {/* Loading overlay when fetching transaction details */}
      {isLoadingDetails && selectedTransactionId && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#A9EF45" />
            <ThemedText style={{ color: '#FFFFFF', marginTop: 10, fontSize: 14 * SCALE }}>
              Loading transaction details...
            </ThemedText>
          </View>
        </Modal>
      )}
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
  formFields: {
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
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
    marginRight: 12 * SCALE,
  },
  accountNameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNameLabel: {
    fontSize: 10 * 1,
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
  feeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#020c19',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 10 * SCALE,
    paddingBottom: 20 * SCALE,
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
  billerModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 18 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.5,
    marginBottom: 10 * SCALE,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
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
  billerList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  billerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14 * SCALE,
    gap: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  billerIcon: {
    width: 33 * SCALE,
    height: 33 * SCALE,
    borderRadius: 16.5 * SCALE,
  },
  billerName: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  modalList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  accountTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
    backgroundColor: '#FFFFFF0D',
    paddingVertical: 15 * SCALE,
    gap: 12 * SCALE,

    marginBottom: 10 * SCALE,
  },
  accountTypeName: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    gap: 12 * SCALE,
  },
  countryFlagEmoji: {
    fontSize: 24 * 1,
  },
  countryNameModal: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  pinModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
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
  recentSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
  },
  recentTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 12 * SCALE,
  },
  recentScrollContent: {
    gap: 12 * SCALE,
    paddingRight: SCREEN_WIDTH * 0.047,
  },
  recentItem: {
    alignItems: 'center',
    marginRight: 8 * SCALE,
  },
  recentIcon: {
    width: 71 * SCALE,
    height: 71 * SCALE,
    borderRadius: 35.5 * SCALE,
    marginBottom: 4 * SCALE,
  },
  recentMeter: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
    textAlign: 'center',
  },
  recentBiller: {
    fontSize: 6 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginTop: 10 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
  },
  recentTransactionsTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 12 * SCALE,
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
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
  },
  transactionIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 12 * SCALE,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  transactionMeter: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
  },
  transactionAccountType: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionDot: {
    width: 3 * SCALE,
    height: 3 * SCALE,
    borderRadius: 1.5 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  transactionBiller: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  transactionDate: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default Electricity;

