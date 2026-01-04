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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetMobileMoneyProviders } from '../../../queries/deposit.queries';
import { useInitiateDeposit, useConfirmDeposit } from '../../../mutations/deposit.mutations';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';

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

  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('KE'); // Kenya by default
  const [selectedCountryName, setSelectedCountryName] = useState('Kenya');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
        { id: 1, name: 'Nigeria', code: 'NG', flag: require('../../../assets/login/nigeria-flag.png') },
        { id: 2, name: 'Botswana', code: 'BW', flag: require('../../../assets/login/nigeria-flag.png') },
        { id: 3, name: 'Ghana', code: 'GH', flag: require('../../../assets/login/nigeria-flag.png') },
        { id: 4, name: 'Kenya', code: 'KE', flag: require('../../../assets/login/nigeria-flag.png') },
        { id: 5, name: 'South Africa', code: 'ZA', flag: require('../../../assets/login/south-africa-flag.png') },
      ];
    }
    return countriesData.data.map((country: any, index: number) => ({
      id: country.id || index + 1,
      name: country.name || '',
      code: country.code || '',
      flag: country.flag || require('../../../assets/login/nigeria-flag.png'),
    }));
  }, [countriesData?.data]);

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
  });

  // Transform providers to UI format
  const providers = useMemo(() => {
    if (!providersData?.data || !Array.isArray(providersData.data)) {
      return [];
    }
    
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
      
      if (transactionId) {
        // Convert to number if it's a string
        const id = typeof transactionId === 'string' ? parseInt(transactionId, 10) : transactionId;
        if (!isNaN(id)) {
          setPendingTransactionId(id);
          setShowPinModal(true);
        } else {
          Alert.alert('Error', 'Invalid transaction ID received');
        }
      } else {
        Alert.alert('Error', 'Transaction ID not found in response');
      }
    },
    onError: (error: any) => {
      console.error('[Fund] Error initiating deposit:', error);
      Alert.alert('Error', error?.message || 'Failed to initiate deposit');
    },
  });

  // Confirm deposit mutation
  const confirmMutation = useConfirmDeposit({
    onSuccess: (data) => {
      console.log('[Fund] Deposit confirmed successfully:', data);
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
      Alert.alert('Error', error?.message || 'Failed to confirm deposit');
    },
  });

  const handleProviderSelect = (providerId: number) => {
    setSelectedProvider(providerId);
    setShowProviderModal(false);
  };

  const handleProceed = () => {
    if (!selectedProvider || !momoNumber || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate amount
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate momo number
    if (momoNumber.length < 9) {
      Alert.alert('Error', 'Please enter a valid mobile money number');
      return;
    }

    // Initiate deposit
    const initiateData: any = {
      amount: amount.replace(/,/g, ''),
      currency: currency,
      countryCode: selectedCountry,
      channel: 'mobile_money',
      providerId: String(selectedProvider),
    };

    initiateMutation.mutate(initiateData);
  };

  const handleConfirmDeposit = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    if (pendingTransactionId !== null && pendingTransactionId !== undefined) {
      confirmMutation.mutate({
        transactionId: pendingTransactionId,
        pin: pin,
      });
    } else {
      Alert.alert('Error', 'Transaction ID not found. Please try again.');
    }
  };

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if proceed button should be enabled
  const isProceedEnabled = useMemo(() => {
    return (
      selectedProvider !== null &&
      momoNumber.length >= 9 &&
      amount.replace(/,/g, '').length > 0 &&
      !initiateMutation.isPending
    );
  }, [selectedProvider, momoNumber, amount, initiateMutation.isPending]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[Fund] Refreshing wallet funding data...');
    try {
      await Promise.all([
        refetchBalances(),
        refetchProviders(),
      ]);
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
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Image
                    source={countries.find((c) => c.code === selectedCountry)?.flag || countries[0]?.flag || require('../../../assets/login/nigeria-flag.png')}
                    style={styles.countryFlagImage}
                    resizeMode="cover"
                  />
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
            <TextInput
              style={styles.amountInput}
              value={`${amount}${currencySymbol}`}
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

          {/* Form Fields */}
          <View style={styles.formFields}>
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
          </View>
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
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
            <ThemedText style={styles.warningText}>Fees : 20{currencySymbol}</ThemedText>
          </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.pinModalContent}>
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
              <ThemedText style={styles.pinLabel}>Enter your PIN to confirm deposit</ThemedText>
              {pendingTransactionData && (
                <View style={styles.paymentSummaryContainer}>
                  <View style={styles.paymentSummaryRow}>
                    <ThemedText style={styles.paymentSummaryLabel}>Amount:</ThemedText>
                    <ThemedText style={styles.paymentSummaryValue}>{currencySymbol}{pendingTransactionData.amount || amount.replace(/,/g, '') || '0'}</ThemedText>
                  </View>
                  <View style={styles.paymentSummaryRow}>
                    <ThemedText style={styles.paymentSummaryLabel}>Fee:</ThemedText>
                    <ThemedText style={styles.paymentSummaryValue}>{currencySymbol}{pendingTransactionData.fee || '0'}</ThemedText>
                  </View>
                  <View style={[styles.paymentSummaryRow, styles.paymentSummaryTotal]}>
                    <ThemedText style={styles.paymentSummaryLabel}>Total:</ThemedText>
                    <ThemedText style={styles.paymentSummaryValue}>{currencySymbol}{pendingTransactionData.totalAmount || pendingTransactionData.amount || amount.replace(/,/g, '') || '0'}</ThemedText>
                  </View>
                </View>
              )}
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                placeholder="Enter PIN"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, (!pin || pin.length < 4 || confirmMutation.isPending) && styles.confirmButtonDisabled]}
              onPress={handleConfirmDeposit}
              disabled={!pin || pin.length < 4 || confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>Confirm Deposit</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `${amount}${currencySymbol}`,
          fee: `20${currencySymbol}`,
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
        visible={showReceiptModal}
        transaction={{
          transactionType: 'deposit',
          transactionTitle: `${amount}${currencySymbol} Withdrawn`,
          transferAmount: `${amount}${currencySymbol}`,
          amountNGN: `${amount}${currencySymbol}`,
          fee: `20${currencySymbol}`,
          mobileNumber: momoNumber,
          provider: providers.find((p) => p.id === selectedProvider)?.name || '',
          accountName: accountName,
          country: selectedCountryName,
          transactionId: '12dwerkxywurcksc',
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Mobile Money',
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
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
              </View>
            ) : (
              <ScrollView style={styles.countryList}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(country.code);
                      setSelectedCountryName(country.name);
                      // Refetch providers when country changes
                      refetchProviders();
                      // Reset provider selection
                      setSelectedProvider(null);
                      setShowCountryModal(false);
                    }}
                  >
                    <Image source={country.flag} style={styles.countryFlagImage} resizeMode="cover" />
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
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '50%',
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

export default Fund;

