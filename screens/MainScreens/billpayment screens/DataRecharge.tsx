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
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetBillPaymentProviders, useGetBillPaymentPlans, useGetBillPaymentBeneficiaries } from '../../../queries/billPayment.queries';
import { useInitiateBillPayment, useConfirmBillPayment } from '../../../mutations/billPayment.mutations';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetBillPayments, useGetTransactionDetails, mapBillPaymentStatusToAPI } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import TransactionErrorModal from '../../components/TransactionErrorModal';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface RecentTransaction {
  id: string;
  phoneNumber: string;
  network: string;
  amount: string;
  date: string;
  plan?: string;
  icon: any;
}

const DataRecharge = ({ route }: any) => {
  const navigation = useNavigation();
  
  // Handle beneficiary selection from BeneficiariesScreen
  React.useEffect(() => {
    if (route?.params?.selectedBeneficiary) {
      const beneficiary = route.params.selectedBeneficiary;
      setMobileNumber(beneficiary.accountNumber || beneficiary.phoneNumber || '');
      setAccountName(beneficiary.name || '');
      // Set provider if available
      if (beneficiary.provider?.id) {
        setSelectedProvider(beneficiary.provider.id);
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

  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedProviderCode, setSelectedProviderCode] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showNetworkModal, setShowNetworkModal] = useState(false);
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
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
    categoryCode: 'data',
    countryCode: selectedCountry,
  });

  // Transform providers to networks format
  const networks = useMemo(() => {
    if (!providersData?.data || !Array.isArray(providersData.data)) {
      return [];
    }
    
    return providersData.data.map((provider: any) => {
      const logoUrl = provider.logoUrl 
        ? `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}`
        : null;
      
      // Default icon mapping
      let icon = require('../../../assets/Ellipse 20.png');
      if (provider.code === 'MTN') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GLO') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'AIRTEL' || provider.code === 'Airtel') {
        icon = require('../../../assets/Ellipse 21 (2).png');
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
    { providerId: selectedProvider || 0 }
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
      dataAmount: plan.dataAmount || '',
      validity: plan.validity || '',
      description: plan.description || '',
    }));
  }, [plansData?.data]);

  // Fetch beneficiaries for data
  const {
    data: beneficiariesData,
    isLoading: isLoadingBeneficiaries,
    refetch: refetchBeneficiaries,
  } = useGetBillPaymentBeneficiaries({ categoryCode: 'data' });

  // Fetch recent transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetBillPayments({
    categoryCode: 'data',
    limit: 10,
    status: mapBillPaymentStatusToAPI('Completed') || 'completed', // Show completed transactions by default
  });

  // Transform transactions to UI format
  // API response structure: { success: true, data: { summary: {...}, transactions: [...] } }
  const recentTransactions: RecentTransaction[] = useMemo(() => {
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
      if (provider.code === 'MTN') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GLO') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'AIRTEL' || provider.code === 'Airtel') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      }

      const amount = parseFloat(tx.amount || '0');
      const date = tx.createdAt || tx.completedAt
        ? new Date(tx.createdAt || tx.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A';

      // Format plan name - use plan.name or plan.dataAmount or plan.code
      const planName = tx.plan?.name || tx.plan?.dataAmount || tx.plan?.code || '';

      return {
        id: String(tx.id),
        phoneNumber: tx.accountNumber || '',
        network: provider.name || provider.code || '',
        amount: `N${formatBalance(amount)}`,
        date: date,
        plan: planName,
        icon: logoUrl ? { uri: logoUrl } : icon,
      };
    });
  }, [transactionsData?.data]);

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

  // Handle transaction press
  const handleTransactionPress = (transaction: RecentTransaction) => {
    const transactionId = parseInt(transaction.id);
    if (!isNaN(transactionId)) {
      setSelectedTransactionId(transactionId);
      // Store the transaction data for initial display
      setSelectedTransaction(transaction);
    }
  };

  // When transaction details are loaded, show the appropriate modal
  useEffect(() => {
    if (transactionDetailsData?.data && selectedTransaction) {
      const details = transactionDetailsData.data;
      const status = details.status || 'completed';
      
      // Map API status to UI status
      const statusMap: { [key: string]: 'Successful' | 'Pending' | 'Failed' } = {
        'completed': 'Successful',
        'pending': 'Pending',
        'failed': 'Failed',
      };
      const uiStatus = statusMap[status?.toLowerCase()] || 'Pending';

      // Create transaction object for modal
      const transactionForModal = {
        id: String(details.id || selectedTransaction.id),
        recipientName: `${details.category?.name || 'Data'} - ${details.provider?.name || selectedTransaction.network}`,
        amountNGN: details.amount 
          ? `N${formatBalance(parseFloat(details.amount))}`
          : selectedTransaction.amount,
        amountUSD: details.amount && details.currency === 'USD'
          ? `$${formatBalance(parseFloat(details.amount))}`
          : `$${formatBalance(parseFloat(details.amount || '0') * 0.001)}`,
        date: details.createdAt
          ? new Date(details.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : selectedTransaction.date,
        status: uiStatus,
        paymentMethod: details.paymentMethod || 'Mobile Money',
        transferAmount: details.amount 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.amount))}`
          : selectedTransaction.amount,
        fee: details.fee 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.fee))}`
          : 'N0',
        paymentAmount: details.totalAmount 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.totalAmount))}`
          : selectedTransaction.amount,
        billerType: details.provider?.code || details.provider?.name || selectedTransaction.network,
        mobileNumber: details.accountNumber || selectedTransaction.phoneNumber,
        plan: details.plan?.name || details.plan?.dataAmount || details.plan?.code || selectedTransaction.plan,
        transactionId: details.reference || String(details.id),
        dateTime: details.createdAt
          ? new Date(details.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : selectedTransaction.date,
        accountNumber: details.accountNumber || selectedTransaction.phoneNumber,
        accountName: details.accountName || '',
        country: details.country || 'NG',
      };

      if (uiStatus === 'Failed') {
        setShowErrorModal(true);
        setShowReceiptModal(false);
      } else {
        setShowReceiptModal(true);
        setShowErrorModal(false);
      }
      setSelectedTransaction(transactionForModal);
    }
  }, [transactionDetailsData, selectedTransaction]);

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
      if (provider.code === 'MTN') {
        icon = require('../../../assets/Ellipse 20.png');
      } else if (provider.code === 'GLO') {
        icon = require('../../../assets/Ellipse 21.png');
      } else if (provider.code === 'AIRTEL' || provider.code === 'Airtel') {
        icon = require('../../../assets/Ellipse 21 (2).png');
      }

      return {
        id: String(beneficiary.id),
        phoneNumber: beneficiary.accountNumber || '',
        network: provider.name || provider.code || '',
        amount: '',
        date: '',
        icon: logoUrl ? { uri: logoUrl } : icon,
      };
    });
  }, [beneficiariesData?.data]);

  // Initiate bill payment mutation
  const initiateMutation = useInitiateBillPayment({
    onSuccess: (data: any) => {
      console.log('[DataRecharge] Payment initiated successfully:', JSON.stringify(data, null, 2));
      
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
      console.error('[DataRecharge] Error initiating payment:', error);
      showErrorAlert('Error', error?.message || 'Failed to initiate payment');
    },
  });

  // Confirm bill payment mutation
  const confirmMutation = useConfirmBillPayment({
    onSuccess: (data) => {
      console.log('[DataRecharge] Payment confirmed successfully:', data);
      setShowPinModal(false);
      setPin('');
      setPendingTransactionId(null);
      setPendingTransactionData(null);
      // Reset form
      setSelectedPlan(null);
      setMobileNumber('');
      setAccountName('');
      setSelectedProvider(null);
      setSelectedProviderCode(null);
      // Refresh data
      refetchTransactions();
      refetchBalances();
      refetchBeneficiaries();
      
      showSuccessAlert(
        'Success',
        'Data recharge successful!',
        () => {
          // @ts-ignore - allow parent route name
          navigation.navigate('Call' as never);
        }
      );
    },
    onError: (error: any) => {
      console.error('[DataRecharge] Error confirming payment:', error);
      showErrorAlert('Error', error?.message || 'Failed to confirm payment');
    },
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[DataRecharge] Refreshing data recharge...');
    try {
      await Promise.all([
        refetchBalances(),
        refetchProviders(),
        refetchPlans(),
        refetchBeneficiaries(),
        refetchTransactions(),
      ]);
      console.log('[DataRecharge] Data recharge refreshed successfully');
    } catch (error) {
      console.error('[DataRecharge] Error refreshing data recharge:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const handleProviderSelect = (networkId: string) => {
    const provider = networks.find((n) => n.id === networkId);
    if (provider) {
      setSelectedProvider(parseInt(networkId));
      setSelectedProviderCode(provider.code);
      setSelectedPlan(null); // Reset plan when provider changes
      setShowNetworkModal(false);
    }
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowPlanModal(false);
  };

  const handleProceed = () => {
    if (!selectedProvider || !selectedPlan || !mobileNumber) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate mobile number
    if (mobileNumber.length < 10) {
      showErrorAlert('Error', 'Please enter a valid mobile number');
      return;
    }

    // Initiate payment
    initiateMutation.mutate({
      categoryCode: 'data',
      providerId: selectedProvider,
      currency: selectedPlan.currency || 'NGN',
      amount: selectedPlan.amount,
      accountNumber: mobileNumber,
      planId: selectedPlan.id,
    });
  };

  const handleConfirmPayment = async () => {
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

  const filteredNetworks = networks.filter((network) =>
    network.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      plan.dataAmount.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      plan.amount.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Check if proceed button should be enabled
  const isProceedEnabled = useMemo(() => {
    return (
      selectedProvider !== null &&
      selectedPlan !== null &&
      mobileNumber.length >= 10 &&
      !initiateMutation.isPending
    );
  }, [selectedProvider, selectedPlan, mobileNumber, initiateMutation.isPending]);

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
            <ThemedText style={styles.headerTitle}>Data Recharge</ThemedText>
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
          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Select Provider - First */}
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => {
                setShowNetworkModal(true);
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
                  <ThemedText style={[styles.inputLabel, !selectedProvider && styles.inputPlaceholder]}>
                    {selectedProvider
                      ? networks.find((n) => n.id === String(selectedProvider))?.name || 'Select Provider'
                      : networks.length > 0 
                        ? 'Select Provider' 
                        : 'No providers available'}
                  </ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Select Plan - Second (only shown when provider is selected) */}
            {selectedProvider && (
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
                        ? `${selectedPlan.name} - ${selectedPlan.dataAmount} - N${formatBalance(selectedPlan.amount)}`
                        : plans.length > 0
                          ? 'Select Plan'
                          : 'No plans available'}
                    </ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Enter Mobile Number - Third */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Mobile Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={mobileNumber}
                onChangeText={(text) => {
                  setMobileNumber(text);
                  if (text.length >= 10) {
                    // Account name will be set from beneficiary or transaction
                    setAccountName('');
                  } else {
                    setAccountName('');
                  }
                }}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                onPress={() => {
                  // Only navigate if a provider is selected
                  if (!selectedProvider) {
                    showWarningAlert('Provider Required', 'Please select a provider first before viewing beneficiaries.');
                    return;
                  }
                  
                  // Navigate to BeneficiariesScreen with current form data
                  // @ts-ignore - allow parent route name
                  navigation.navigate('Beneficiaries' as never, {
                    categoryCode: 'data',
                    selectedProvider: selectedProvider,
                    selectedProviderCode: selectedProviderCode,
                    onSelectBeneficiary: (beneficiary: any) => {
                      // Populate form with selected beneficiary
                      setMobileNumber(beneficiary.accountNumber || beneficiary.phoneNumber || '');
                      setAccountName(beneficiary.name || '');
                      // Set provider if available
                      if (beneficiary.provider?.id) {
                        setSelectedProvider(beneficiary.provider.id);
                        setSelectedProviderCode(beneficiary.provider.code);
                      }
                    },
                  });
                }}
                disabled={!selectedProvider}
                style={!selectedProvider ? { opacity: 0.5 } : {}}
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
              <View style={styles.inputField}>
                <View style={styles.accountNameContainer}>
                  <ThemedText style={styles.accountNameLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.accountNameValue}>{accountName}</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Proceed Button */}
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
                    setMobileNumber(beneficiary.phoneNumber);
                    // Find and set the provider
                    const provider = networks.find((n) => n.name === beneficiary.network || n.code === beneficiary.network);
                    if (provider) {
                      setSelectedProvider(parseInt(provider.id));
                      setSelectedProviderCode(provider.code);
                    }
                  }}
                >
                  <Image source={beneficiary.icon} style={styles.recentIcon} resizeMode="cover" />
                  <ThemedText style={styles.recentPhone}>{beneficiary.phoneNumber}</ThemedText>
                  <ThemedText style={styles.recentNetwork}>{beneficiary.network}</ThemedText>
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
                // Navigate to BillPaymentsScreen with data filter
                // @ts-ignore - allow parent route name
                navigation.navigate('BillPayments' as never, {
                  initialCategory: 'Data',
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
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  <Image source={transaction.icon} style={styles.transactionIcon} resizeMode="cover" />
                  <View style={styles.transactionDetails}>
                    <ThemedText style={styles.transactionPhone}>{transaction.phoneNumber}</ThemedText>
                    <View style={styles.transactionMeta}>
                      {transaction.plan ? (
                        <>
                          <ThemedText style={styles.transactionPlan}>{transaction.plan}</ThemedText>
                          <View style={styles.transactionDot} />
                        </>
                      ) : null}
                      <ThemedText style={styles.transactionNetwork}>{transaction.network}</ThemedText>
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

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                        {plan.dataAmount} • {plan.validity} • N{formatBalance(plan.amount)}
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

      {/* Network Selection Modal */}
      <Modal
        visible={showNetworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.networkModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Network</ThemedText>
              <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
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

            {/* Network List */}
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
            ) : filteredNetworks.length > 0 ? (
              <ScrollView style={styles.networkList}>
                {filteredNetworks.map((network) => (
                  <TouchableOpacity
                    key={network.id}
                    style={styles.networkItem}
                    onPress={() => handleProviderSelect(network.id)}
                  >
                    <Image source={network.icon} style={styles.networkIcon} resizeMode="cover" />
                    <ThemedText style={styles.networkName}>{network.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedProvider === parseInt(network.id) ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedProvider === parseInt(network.id) ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="information" size={40 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                  {searchQuery ? 'No networks found matching your search' : `No networks available for ${selectedCountryName}. Please try a different country.`}
                </ThemedText>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowNetworkModal(false)}
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

      {/* Transaction Receipt Modal */}
      {selectedTransaction && (
        <TransactionReceiptModal
          visible={showReceiptModal && !isLoadingDetails}
          transaction={{
            ...selectedTransaction,
            transactionType: 'billPayment',
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Transaction Error Modal */}
      {selectedTransaction && (
        <TransactionErrorModal
          visible={showErrorModal && !isLoadingDetails}
          transaction={selectedTransaction}
          onRetry={() => {
            // TODO: Implement retry logic
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
          onCancel={() => {
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

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
  countryFlagEmojiSelector: {
    fontSize: 28 * SCALE,
    width: 36 * SCALE,
    height: 38 * SCALE,
    textAlign: 'center',
    lineHeight: 38 * SCALE,
  },
  countryNameText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
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
    gap: 14 * 1,
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
  },
  accountNameLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4 * SCALE,
  },
  accountNameValue: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
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
  recentSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
  },
  recentTitle: {
    fontSize: 14 * 1,
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
  recentPhone: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
    textAlign: 'center',
  },
  recentNetwork: {
    fontSize: 6 * 1,
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
  transactionDot: {
    width: 3 * SCALE,
    height: 3 * SCALE,
    borderRadius: 1.5 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  transactionNetwork: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
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
  planModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  networkModalContent: {
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
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30 * SCALE,
    paddingBottom: 15 * SCALE,
    gap: 8 * SCALE,
  },
  filterTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 100,
    paddingHorizontal: 23 * SCALE,
    paddingVertical: 8 * SCALE,
  },
  filterTabActive: {
    backgroundColor: '#A9EF45',
    borderColor: '#A9EF45',
  },
  filterTabText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterTabTextActive: {
    color: '#000000',
    fontWeight: '500',
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
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  networkList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  networkItem: {
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
  networkIcon: {
    width: 33 * SCALE,
    height: 33 * SCALE,
    borderRadius: 16.5 * SCALE,
  },
  networkName: {
    flex: 1,
    fontSize: 14 * SCALE,
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
  countryFlagEmoji: {
    fontSize: 24 * SCALE,
    width: 32 * SCALE,
    height: 32 * SCALE,
    textAlign: 'center',
    lineHeight: 32 * SCALE,
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
  countryNameModal: {
    flex: 1,
    fontSize: 17 * SCALE,
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
    fontSize: 14 * SCALE,
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
});

export default DataRecharge;

