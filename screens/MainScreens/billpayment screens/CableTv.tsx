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
import { useGetBillPaymentProviders, useGetBillPaymentPlans, useGetBillPaymentBeneficiaries } from '../../../queries/billPayment.queries';
import { useInitiateBillPayment, useConfirmBillPayment } from '../../../mutations/billPayment.mutations';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetBillPayments, useGetTransactionDetails, mapBillPaymentStatusToAPI } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../../utils/customAlert';
import { checkSecurityRequirements, verifySecurityBeforeTransaction, getMissingVerificationMessage } from '../../../utils/securityVerification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const CableTv = ({ route }: any) => {
  const navigation = useNavigation();
  
  // Handle beneficiary selection from BeneficiariesScreen
  React.useEffect(() => {
    if (route?.params?.selectedBeneficiary) {
      const beneficiary = route.params.selectedBeneficiary;
      setDecoderNumber(beneficiary.accountNumber || beneficiary.phoneNumber || '');
      setAccountName(beneficiary.name || '');
      // Set provider if available
      if (beneficiary.provider?.id) {
        setSelectedBillerType(beneficiary.provider.id);
        setSelectedProviderCode(beneficiary.provider.code);
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
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [decoderNumber, setDecoderNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBillerTypeModal, setShowBillerTypeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [securityRequirements, setSecurityRequirements] = useState<{
    pin: boolean;
    email: boolean;
    twoFA: boolean;
  }>({ pin: false, email: false, twoFA: false });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '',
    fee: '',
    billerType: '',
    smartCardNumber: '',
    accountNumber: '',
    accountName: '',
    plan: '',
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
        { id: 1, name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
        { id: 2, name: 'Botswana', code: 'BW', flag: '🇧🇼' },
        { id: 3, name: 'Ghana', code: 'GH', flag: '🇬🇭' },
        { id: 4, name: 'Kenya', code: 'KE', flag: '🇰🇪' },
        { id: 5, name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
        { id: 6, name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
        { id: 7, name: 'Uganda', code: 'UG', flag: '🇺🇬' },
      ];
    }
    return countriesData.data.map((country: any, index: number) => ({
      id: country.id || index + 1,
      name: country.name || '',
      code: country.code || '',
      flag: country.flag || '🏳️', // Can be URL path or emoji
    }));
  }, [countriesData?.data]);

  // Get selected country data for flag display
  const selectedCountryData = useMemo(() => {
    return countries.find((c) => c.code === selectedCountry);
  }, [countries, selectedCountry]);

  // Fetch providers based on category and country
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    isError: isProvidersError,
    error: providersError,
    refetch: refetchProviders,
  } = useGetBillPaymentProviders({
    categoryCode: 'cable_tv',
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
      if (provider.code === 'DSTV') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GOTV') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'SHOWMAX' || provider.code === 'Showmax') {
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
      };
    });
  }, [providersData]);

  // Fetch plans when provider is selected
  const {
    data: plansData,
    isLoading: isLoadingPlans,
    refetch: refetchPlans,
  } = useGetBillPaymentPlans(
    { providerId: selectedBillerType || 0 }
  );

  // Transform plans data
  const plans = useMemo(() => {
    if (!plansData?.data || !Array.isArray(plansData.data)) {
      return [];
    }
    
    return plansData.data.map((plan: any) => ({
      id: plan.id,
      name: plan.name || '',
      code: plan.code || '',
      amount: plan.amount || '0',
      currency: plan.currency || 'NGN',
      validity: plan.validity || '',
      description: plan.description || '',
    }));
  }, [plansData?.data]);

  // Fetch beneficiaries for cable_tv
  const {
    data: beneficiariesData,
    isLoading: isLoadingBeneficiaries,
    refetch: refetchBeneficiaries,
  } = useGetBillPaymentBeneficiaries({ categoryCode: 'cable_tv' });

  // Fetch recent transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetBillPayments({
    categoryCode: 'cable_tv',
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
        smartCardNumber: metadata.accountNumber || tx.accountNumber || '',
        accountNumber: metadata.accountNumber || tx.accountNumber || '',
        accountName: metadata.accountName || tx.accountName || '',
        plan: metadata.planName || tx.plan?.name || '',
        country: 'NG', // Default to Nigeria for cable TV
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
      if (provider.code === 'DSTV') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GOTV') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'SHOWMAX' || provider.code === 'Showmax') {
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
        decoderNumber: tx.accountNumber || '',
        billerType: provider.name || provider.code || '',
        amount: `N${formatBalance(amount)}`,
        date: date,
        plan: tx.plan?.name || '',
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
      if (provider.code === 'DSTV') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GOTV') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'SHOWMAX' || provider.code === 'Showmax') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      } else {
        icon = require('../../../assets/Ellipse 22.png');
      }

      return {
        id: String(beneficiary.id),
        decoderNumber: beneficiary.accountNumber || '',
        billerType: provider.name || provider.code || '',
        icon: logoUrl ? { uri: logoUrl } : icon,
      };
    });
  }, [beneficiariesData?.data]);

  // Initiate bill payment mutation
  const initiateMutation = useInitiateBillPayment({
    onSuccess: (data: any) => {
      console.log('[CableTv] Payment initiated successfully:', JSON.stringify(data, null, 2));
      
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
      console.error('[CableTv] Error initiating payment:', error);
      showErrorAlert('Error', error?.message || 'Failed to initiate payment');
    },
  });

  // Confirm bill payment mutation
  const confirmMutation = useConfirmBillPayment({
    onSuccess: (data) => {
      console.log('[CableTv] Payment confirmed successfully:', data);
      setShowPinModal(false);
      setPin('');
      setEmailOtp('');
      setTwoFACode('');
      setPendingTransactionId(null);
      setPendingTransactionData(null);
      
      // Set transaction details for success modal
      const numericAmount = parseFloat(selectedPlan?.amount || '0');
      const transactionData = data?.data || {};
      setTransactionDetails({
        amount: String(numericAmount),
        fee: transactionData.fee || pendingTransactionData?.fee || '0',
        billerType: billerTypes.find((b) => b.id === String(selectedBillerType))?.name || '',
        smartCardNumber: decoderNumber,
        accountNumber: decoderNumber,
        accountName: transactionData.accountName || accountName || '',
        plan: selectedPlan?.name || transactionData.plan?.name || '',
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
      setSelectedPlan(null);
      setDecoderNumber('');
      setAccountName('');
      setSelectedBillerType(null);
      setSelectedProviderCode(null);
      
      // Refresh data
      refetchTransactions();
      refetchBalances();
      refetchBeneficiaries();
      
      // Show success modal
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.error('[CableTv] Error confirming payment:', error);
      showErrorAlert('Error', error?.message || 'Failed to confirm payment');
    },
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[CableTv] Refreshing cable TV data...');
    try {
      await Promise.all([
        refetchBalances(),
        refetchProviders(),
        refetchPlans(),
        refetchBeneficiaries(),
        refetchTransactions(),
      ]);
      console.log('[CableTv] Cable TV data refreshed successfully');
    } catch (error) {
      console.error('[CableTv] Error refreshing cable TV data:', error);
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
      setSelectedPlan(null); // Reset plan when provider changes
      setShowBillerTypeModal(false);
    }
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowPlanModal(false);
  };

  const handleProceed = () => {
    if (!selectedBillerType || !selectedPlan || !decoderNumber) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate decoder number
    if (decoderNumber.length < 10) {
      showErrorAlert('Error', 'Please enter a valid decoder number');
      return;
    }

    // Initiate payment - only pass data that is coming
    const initiateData: any = {
      categoryCode: 'cable_tv',
      providerId: selectedBillerType,
      currency: selectedPlan.currency || 'NGN',
      amount: selectedPlan.amount,
      accountNumber: decoderNumber,
    };

    // Only add planId if plan is selected
    if (selectedPlan?.id) {
      initiateData.planId = selectedPlan.id;
    }

    initiateMutation.mutate(initiateData);
  };

  // Check security requirements when PIN modal opens
  useEffect(() => {
    if (showPinModal) {
      checkSecurityRequirements().then((requirements) => {
        setSecurityRequirements(requirements.methods);
        console.log('[CableTv] Security requirements:', requirements);
      });
    }
  }, [showPinModal]);

  const handleConfirmPayment = async () => {
    // Verify all security requirements
    const verification = await verifySecurityBeforeTransaction({
      pin: pin,
      emailOtp: emailOtp,
      twoFACode: twoFACode,
    });

    if (!verification.success) {
      const message = getMissingVerificationMessage(verification.missingVerifications);
      showWarningAlert('Security Verification Required', message);
      return;
    }

    // Basic PIN validation (always required by backend)
    if (!pin || pin.length < 5) {
      showErrorAlert('Error', 'Please enter your 5-digit PIN');
      return;
    }

    if (pendingTransactionId) {
      confirmMutation.mutate({
        transactionId: pendingTransactionId,
        pin: pin,
      });
    } else {
      showErrorAlert('Error', 'Transaction ID not found. Please try again.');
    }
  };

  const filteredBillers = billerTypes.filter((biller) =>
    biller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      plan.amount.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Check if proceed button should be enabled
  const isProceedEnabled = useMemo(() => {
    return (
      selectedBillerType !== null &&
      selectedPlan !== null &&
      decoderNumber.length >= 10 &&
      !initiateMutation.isPending
    );
  }, [selectedBillerType, selectedPlan, decoderNumber, initiateMutation.isPending]);

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
            <ThemedText style={styles.headerTitle}>Cable TV</ThemedText>
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
              ) : (
                <>
                  {selectedCountryData?.flag ? (
                    selectedCountryData.flag.startsWith('/') ? (
                      <Image
                        source={{ uri: `${API_BASE_URL.replace('/api', '')}${selectedCountryData.flag}` }}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    ) : selectedCountryData.flag.startsWith('http') ? (
                      <Image
                        source={{ uri: selectedCountryData.flag }}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ThemedText style={styles.countryFlagEmojiSmall}>{selectedCountryData.flag}</ThemedText>
                    )
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
              )}
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

            {/* Select Plan - Second (only shown when provider is selected) */}
            {selectedBillerType && (
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => setShowPlanModal(true)}
                disabled={isLoadingPlans}
              >
                {isLoadingPlans ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <ThemedText style={[styles.inputLabel, styles.inputPlaceholder]}>Loading plans...</ThemedText>
                  </View>
                ) : (
                  <>
                    <ThemedText style={[styles.inputLabel, !selectedPlan && styles.inputPlaceholder]}>
                      {selectedPlan
                        ? `${selectedPlan.name} - N${formatBalance(selectedPlan.amount)}`
                        : plans.length > 0
                          ? 'Select Plan'
                          : 'No plans available'}
                    </ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Decoder Number - Third */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Decoder Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={decoderNumber}
                onChangeText={(text) => {
                  setDecoderNumber(text);
                  if (text.length >= 10) {
                    // Account name will be set from beneficiary or transaction
                    setAccountName('');
                  } else {
                    setAccountName('');
                  }
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() => {
                  // Only navigate if a provider is selected
                  if (!selectedBillerType) {
                    showWarningAlert('Provider Required', 'Please select a provider first before viewing beneficiaries.');
                    return;
                  }
                  
                  // Navigate to BeneficiariesScreen with current form data
                  // @ts-ignore - allow parent route name
                  navigation.navigate('Beneficiaries' as never, {
                    categoryCode: 'cable_tv',
                    selectedProvider: selectedBillerType,
                    selectedProviderCode: selectedProviderCode,
                    onSelectBeneficiary: (beneficiary: any) => {
                      // Populate form with selected beneficiary
                      setDecoderNumber(beneficiary.accountNumber || beneficiary.phoneNumber || '');
                      setAccountName(beneficiary.name || '');
                      // Set provider if available
                      if (beneficiary.provider?.id) {
                        setSelectedBillerType(beneficiary.provider.id);
                        setSelectedProviderCode(beneficiary.provider.code);
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
                    setDecoderNumber(beneficiary.decoderNumber);
                    // Find and set the provider
                    const provider = billerTypes.find((b) => b.name === beneficiary.billerType || b.code === beneficiary.billerType);
                    if (provider) {
                      setSelectedBillerType(parseInt(provider.id));
                      setSelectedProviderCode(provider.code);
                    }
                  }}
                >
                  <Image source={beneficiary.icon} style={styles.recentIcon} resizeMode="cover" />
                  <ThemedText style={styles.recentDecoder}>{beneficiary.decoderNumber}</ThemedText>
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
                // Navigate to BillPaymentsScreen with cable_tv filter
                // @ts-ignore - allow parent route name
                navigation.navigate('BillPayments' as never, {
                  initialCategory: 'Cable TV',
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
                    <ThemedText style={styles.transactionDecoder}>{transaction.decoderNumber}</ThemedText>
                    <View style={styles.transactionMeta}>
                      {transaction.plan ? (
                        <>
                          <ThemedText style={styles.transactionPlan}>{transaction.plan}</ThemedText>
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

      {/* Plan Selection Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Plan</ThemedText>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
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
                value={planSearchQuery}
                onChangeText={setPlanSearchQuery}
              />
            </View>

            {/* Plan List */}
            {isLoadingPlans ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading plans...
                </ThemedText>
              </View>
            ) : filteredPlans.length > 0 ? (
              <ScrollView style={styles.planList}>
                {filteredPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planItem}
                    onPress={() => handlePlanSelect(plan)}
                  >
                    <View style={styles.planInfo}>
                      <ThemedText style={styles.planTitle}>{plan.name}</ThemedText>
                      <ThemedText style={styles.planDescription}>
                        {plan.validity} • N{formatBalance(plan.amount)}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={selectedPlan?.id === plan.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedPlan?.id === plan.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', paddingHorizontal: 20 }}>
                  {planSearchQuery ? 'No plans found matching your search' : 'No plans available for this provider'}
                </ThemedText>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowPlanModal(false)}
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
                    {country.flag ? (
                      country.flag.startsWith('/') ? (
                        <Image
                          source={{ uri: `${API_BASE_URL.replace('/api', '')}${country.flag}` }}
                          style={styles.countryFlagImageModal}
                          resizeMode="cover"
                        />
                      ) : country.flag.startsWith('http') ? (
                        <Image
                          source={{ uri: country.flag }}
                          style={styles.countryFlagImageModal}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlagEmoji}>{country.flag}</ThemedText>
                      )
                    ) : (
                      <ThemedText style={styles.countryFlagCode}>{country.code || '🏳️'}</ThemedText>
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
                    setEmailOtp('');
                    setTwoFACode('');
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
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.amount || selectedPlan?.amount || '0'}</ThemedText>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <ThemedText style={styles.paymentSummaryLabel}>Fee:</ThemedText>
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.fee || '0'}</ThemedText>
                    </View>
                    <View style={[styles.paymentSummaryRow, styles.paymentSummaryTotal]}>
                      <ThemedText style={styles.paymentSummaryLabel}>Total:</ThemedText>
                      <ThemedText style={styles.paymentSummaryValue}>N{pendingTransactionData.totalAmount || pendingTransactionData.amount || selectedPlan?.amount || '0'}</ThemedText>
                    </View>
                  </View>
                )}

                {/* PIN Input - Always required */}
                <View style={styles.securityInputSection}>
                  <ThemedText style={styles.securityInputLabel}>PIN *</ThemedText>
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

                {/* Email OTP Input - If required */}
                {securityRequirements.email && (
                  <View style={styles.securityInputSection}>
                    <ThemedText style={styles.securityInputLabel}>Email OTP *</ThemedText>
                    <TextInput
                      style={styles.pinInput}
                      value={emailOtp}
                      onChangeText={setEmailOtp}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="Enter 5-digit OTP from email"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                  </View>
                )}

                {/* 2FA Code Input - If required */}
                {securityRequirements.twoFA && (
                  <View style={styles.securityInputSection}>
                    <ThemedText style={styles.securityInputLabel}>2FA Code *</ThemedText>
                    <TextInput
                      style={styles.pinInput}
                      value={twoFACode}
                      onChangeText={setTwoFACode}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="Enter 2FA code from authenticator"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmButton, 
                  (
                    !pin || 
                    pin.length < 5 || 
                    (securityRequirements.email && (!emailOtp || emailOtp.length !== 5)) ||
                    (securityRequirements.twoFA && (!twoFACode || twoFACode.length < 6)) ||
                    confirmMutation.isPending
                  ) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirmPayment}
                disabled={
                  !pin || 
                  pin.length < 5 || 
                  (securityRequirements.email && (!emailOtp || emailOtp.length !== 5)) ||
                  (securityRequirements.twoFA && (!twoFACode || twoFACode.length < 6)) ||
                  confirmMutation.isPending
                }
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
          amount: transactionDetails.amount,
          fee: transactionDetails.fee,
          mobileNumber: transactionDetails.smartCardNumber,
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
          mobileNumber: transactionDetails.smartCardNumber || transactionDetails.accountNumber,
          billerType: transactionDetails.billerType,
          plan: transactionDetails.plan || '',
          recipientName: transactionDetails.accountName || 'Cable TV Subscription',
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
  planModalContent: {
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
    fontSize: 14 * 1,
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
  planList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14 * SCALE,
    paddingHorizontal: 14 * SCALE,
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  planInfo: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  planTitle: {
    fontSize: 14 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  planDescription: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
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
  countryFlagEmoji: {
    fontSize: 24 * 1,
  },
  countryFlagEmojiSmall: {
    fontSize: 20 * 1,
  },
  countryFlagCode: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 30 * SCALE,
    textAlign: 'center',
  },
  countryFlagImageModal: {
    width: 30 * SCALE,
    height: 30 * SCALE,
    borderRadius: 15 * SCALE,
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
  securityInputSection: {
    marginBottom: 15 * SCALE,
  },
  securityInputLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8 * SCALE,
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
  recentDecoder: {
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
  transactionDecoder: {
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
  transactionPlan: {
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

export default CableTv;

