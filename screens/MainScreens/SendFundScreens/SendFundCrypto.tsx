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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetTransferEligibility, useGetTransferReceipt } from '../../../queries/transfer.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { showSuccessAlert, showErrorAlert, showInfoAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface RecentTransaction {
  id: string;
  name: string;
  walletId: string;
  date: string;
  avatar: any;
}

const SendFundCrypto = () => {
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

  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; balance: string; icon: any } | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [balance, setBalance] = useState('0.00000000');
  const [amount, setAmount] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<string | null>(null);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transferData, setTransferData] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useGetWalletBalances();

  // Fetch countries
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Check transfer eligibility
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    refetch: refetchEligibility,
  } = useGetTransferEligibility();

  // Fetch transfer receipt
  const {
    data: receiptData,
    isLoading: isLoadingReceipt,
  } = useGetTransferReceipt(
    transactionId ? String(transactionId) : '',
    {
      enabled: showReceiptModal && transactionId !== null,
    }
  );

  // Get crypto wallets from API
  const cryptoWallets = useMemo(() => {
    if (!balancesData?.data?.crypto || !Array.isArray(balancesData.data.crypto)) {
      return [];
    }
    return balancesData.data.crypto.filter((w: any) => w.active !== false);
  }, [balancesData?.data?.crypto]);

  // Transform countries from API
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return [];
    }
    return countriesData.data;
  }, [countriesData?.data]);

  // Initialize selected asset
  useEffect(() => {
    if (!selectedAsset && cryptoWallets.length > 0) {
      const firstWallet = cryptoWallets[0];
      setSelectedAsset({
        id: String(firstWallet.id || firstWallet.currency),
        name: firstWallet.currency || firstWallet.symbol || 'BTC',
        balance: firstWallet.balance || firstWallet.availableBalance || '0',
        icon: require('../../../assets/CurrencyBtc.png'),
      });
      setBalance(firstWallet.balance || firstWallet.availableBalance || '0');
    }
  }, [cryptoWallets, selectedAsset]);

  // Update balance when asset changes
  useEffect(() => {
      if (selectedAsset) {
        const wallet = cryptoWallets.find((w: any) => 
          w.currency === selectedAsset?.name || 
          w.symbol === selectedAsset?.name
        );
      if (wallet) {
        setBalance(wallet.balance || wallet.availableBalance || '0');
      }
    }
  }, [selectedAsset, cryptoWallets]);

  // Initiate transfer mutation
  const initiateTransferMutation = useInitiateTransfer({
    onSuccess: (data) => {
      const transactionIdFromResponse = data?.data?.id;
      if (transactionIdFromResponse) {
        setTransactionId(transactionIdFromResponse);
        setTransferData(data?.data);
        setShowSummaryModal(false);
        setShowPinModal(true);
        showInfoAlert('OTP Sent', 'Please check your email for the verification code');
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

  const quickAmounts = ['25%', '50%', '75%', '100%'];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([
      refetchBalances(),
      refetchEligibility(),
    ]);
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace('%', '');
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const calculatedAmount = (balanceNum * parseFloat(numericValue)) / 100;
    setAmount(calculatedAmount.toFixed(8));
    setSelectedPercentage(quickAmount);
  };

  const formatBalanceNoDecimals = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00000000';
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    return amount.trim() !== '' &&
           !isNaN(numericAmount) &&
           numericAmount > 0 &&
           (recipientUserId.trim() !== '' || recipientEmail.trim() !== '') &&
           selectedAsset !== null;
  }, [amount, recipientUserId, recipientEmail, selectedAsset]);

  // Filter crypto wallets for asset modal
  const filteredCryptoWallets = useMemo(() => {
    if (!assetSearchTerm.trim()) {
      return cryptoWallets;
    }
    const query = assetSearchTerm.toLowerCase();
    return cryptoWallets.filter((w: any) => {
      const currency = (w.currency || w.symbol || '').toLowerCase();
      return currency.includes(query);
    });
  }, [cryptoWallets, assetSearchTerm]);

  const handleProceed = () => {
    if (!isFormValid) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid amount');
      return;
    }

    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    if (numericAmount > balanceNum) {
      showErrorAlert('Insufficient Balance', `Available balance: ${balance} ${selectedAsset?.name || 'BTC'}`);
      return;
    }

    setShowSummaryModal(true);
  };

  const handleSummaryComplete = () => {
    if (!selectedAsset || !amount || (!recipientUserId && !recipientEmail)) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    
    initiateTransferMutation.mutate({
      amount: numericAmount.toString(),
      currency: selectedAsset?.name || 'BTC',
      countryCode: selectedCountry,
      channel: 'rhionx_user',
      recipientUserId: recipientUserId || undefined,
      recipientEmail: recipientEmail || undefined,
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
    if (!emailCode || !pin || !transactionId) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }

    verifyTransferMutation.mutate({
      transactionId: transactionId,
      emailCode: emailCode,
      pin: pin,
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
          {/* <ThemedText style={styles.balanceSectionTitle}>Bitcoin Balance</ThemedText> */}
          <LinearGradient
            colors={['#A9EF4533', '#FFFFFF0D']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardContent}>
                <ThemedText style={styles.balanceLabel}>
                  {selectedAsset?.name || 'Crypto'} Balance
                </ThemedText>
                <View style={styles.balanceRow}>
                  <Image
                    source={require('../../../assets/Vector (34).png')}
                    style={styles.walletIcon}
                    resizeMode="cover"
                  />
                  {isLoadingBalances ? (
                    <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                  ) : (
                    <ThemedText style={styles.balanceAmount}>
                      {formatBalanceNoDecimals(balance)} {selectedAsset?.name || 'BTC'}
                    </ThemedText>
                  )}
                </View>
            </View>
            <TouchableOpacity
              style={styles.assetSelector}
              onPress={() => setShowAssetModal(true)}
            >
              {selectedAsset ? (
                <>
                  <Image
                    source={selectedAsset.icon}
                    style={styles.assetSelectorIcon}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.assetSelectorText}>{selectedAsset?.name || 'BTC'}</ThemedText>
                </>
              ) : (
                <>
                  <Image
                    source={require('../../../assets/CurrencyBtc.png')}
                    style={styles.assetSelectorIcon}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.assetSelectorText}>Select Asset</ThemedText>
                </>
              )}
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
      
        <View style={styles.mainCard}>
          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputLabelContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => {
                  // Allow decimal input for crypto
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setAmount(cleaned);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00000000"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <ThemedText style={styles.amountCurrencyLabel}>
                {selectedAsset?.name || 'BTC'}
              </ThemedText>
            </View>
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount) => {
                const isSelected = selectedPercentage === quickAmount;
                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[styles.quickAmountButton, isSelected && styles.quickAmountButtonSelected]}
                    onPress={() => handleAmountSelect(quickAmount)}
                  >
                    <ThemedText style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                      {quickAmount}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Country Selector */}
            <TouchableOpacity
              style={styles.countryField}
              onPress={() => setShowCountryModal(true)}
              disabled={isLoadingCountries}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText style={[styles.countryFieldText, !selectedCountry && styles.placeholder]}>
                    {countries.find((c: any) => c.code === selectedCountry)?.name || 'Select Country'}
                  </ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Recipient User ID */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Recipient User ID (optional)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={recipientUserId}
                onChangeText={setRecipientUserId}
                keyboardType="number-pad"
              />
            </View>

            {/* Recipient Email */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Recipient Email (optional)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={styles.inputHint}>
                Provide either User ID or Email
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Proceed Button - Outside Main Card */}


        {/* Warning Messages */}
        <View style={styles.warningSection}>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <ThemedText style={styles.warningText}>
              Transfers are instant to Rhinox users
            </ThemedText>
          </View>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <ThemedText style={styles.warningText}>Ensure recipient User ID or Email is correct</ThemedText>
          </View>
        </View>
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity
            style={[styles.proceedButton, (!isFormValid || initiateTransferMutation.isPending) && styles.proceedButtonDisabled]}
            onPress={handleProceed}
            disabled={!isFormValid || initiateTransferMutation.isPending}
          >
            {initiateTransferMutation.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Select Asset Modal */}
      <Modal
        visible={showAssetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Asset</ThemedText>
              <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={assetSearchTerm}
                onChangeText={setAssetSearchTerm}
              />
            </View>
            <ScrollView style={styles.modalList}>
              {isLoadingBalances ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : filteredCryptoWallets.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {assetSearchTerm.trim() ? 'No assets found' : 'No crypto wallets available'}
                  </ThemedText>
                </View>
              ) : (
                filteredCryptoWallets.map((wallet: any) => {
                  let icon = require('../../../assets/CurrencyBtc.png');
                  const currency = wallet.currency || wallet.symbol || '';
                  
                  const asset = {
                    id: String(wallet.id || currency),
                    name: currency,
                    balance: wallet.balance || wallet.availableBalance || '0',
                    icon: icon,
                  };
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={styles.assetItem}
                      onPress={() => {
                        setSelectedAsset(asset);
                        setBalance(asset.balance);
                        setShowAssetModal(false);
                        setAssetSearchTerm('');
                      }}
                    >
                      <Image
                        source={asset.icon}
                        style={styles.assetItemIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.assetItemInfo}>
                        <ThemedText style={styles.assetItemName}>{asset.name}</ThemedText>
                        <ThemedText style={styles.assetItemBalance}>
                          Bal : {formatBalanceNoDecimals(asset.balance)}
                        </ThemedText>
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowAssetModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Country Modal */}
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
            {isLoadingCountries ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#A9EF45" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((country: any) => {
                  const isSelected = selectedCountry === country.code;
                  return (
                    <TouchableOpacity
                      key={country.id || country.code}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountry(country.code || 'NG');
                        setShowCountryModal(false);
                      }}
                    >
                      {country.flag ? (
                        <Image
                          source={{ uri: `${API_BASE_URL.replace('/api', '')}${country.flag}` }}
                          style={styles.countryFlagImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlag}>{country.code}</ThemedText>
                      )}
                      <ThemedText style={styles.countryName}>{country.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
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
              <View style={styles.summaryDetailsCard}>
                <View style={[styles.summaryDetailRow, styles.summaryDetailRowFirst]}>
                  <ThemedText style={styles.summaryDetailLabel}>Crypto</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{selectedAsset?.name || 'BTC'}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Amount</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{amount} {selectedAsset?.name || 'BTC'}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Country</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>
                    {countries.find((c: any) => c.code === selectedCountry)?.name || 'Nigeria'}
                  </ThemedText>
                </View>
                {recipientUserId ? (
                  <View style={styles.summaryDetailRow}>
                    <ThemedText style={styles.summaryDetailLabel}>Recipient User ID</ThemedText>
                    <ThemedText style={styles.summaryDetailValue}>{recipientUserId}</ThemedText>
                  </View>
                ) : null}
                {recipientEmail ? (
                  <View style={[styles.summaryDetailRow, (!recipientUserId && !recipientEmail) && styles.summaryDetailRowLast]}>
                    <ThemedText style={styles.summaryDetailLabel}>Recipient Email</ThemedText>
                    <ThemedText style={styles.summaryDetailValue} numberOfLines={1} ellipsizeMode="middle">
                      {recipientEmail}
                    </ThemedText>
                  </View>
                ) : null}
                {(recipientUserId || recipientEmail) ? (
                  <View style={[styles.summaryDetailRow, styles.summaryDetailRowLast]}>
                    <ThemedText style={styles.summaryDetailLabel}>Transfer Type</ThemedText>
                    <ThemedText style={styles.summaryDetailValue}>Rhinox User Transfer</ThemedText>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.summaryCompleteButton}
              onPress={handleSummaryComplete}
            >
              <ThemedText style={styles.summaryCompleteButtonText}>Complete</ThemedText>
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
              <ThemedText style={styles.pinAmount}>{amount} {selectedAsset?.name || 'BTC'}</ThemedText>
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
                <ThemedText style={styles.securityInputLabel}>Email Code</ThemedText>
                <View style={styles.securityInputField}>
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Input Code sent to your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={emailCode}
                    onChangeText={setEmailCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.securityInputWrapper}>
                <ThemedText style={styles.securityInputLabel}>Authenticator App Code</ThemedText>
                <View style={styles.securityInputField}>
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Input Code from your authenticator app"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={authenticatorCode}
                    onChangeText={setAuthenticatorCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.securityProceedButton, (!emailCode || !authenticatorCode) && styles.securityProceedButtonDisabled]}
                onPress={handleSecurityComplete}
                disabled={!emailCode || !authenticatorCode}
              >
                <ThemedText style={styles.securityProceedButtonText}>Proceed</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `${amount} ${selectedAsset?.name || 'BTC'}`,
          fee: transferData?.fee ? `${transferData.fee} ${selectedAsset?.name || 'BTC'}` : `0 ${selectedAsset?.name || 'BTC'}`,
          transactionType: 'send',
        }}
        onViewTransaction={handleViewTransaction}
        onCancel={handleSuccessCancel}
      />

      {/* Transaction Receipt Modal */}
      {receiptData?.data && (
        <TransactionReceiptModal
          visible={showReceiptModal}
          transaction={{
            transactionType: 'send',
            transactionTitle: `Send Crypto - ${selectedAsset?.name || 'Crypto'}`,
            transactionId: receiptData.data.reference || `TXN-${transactionId}`,
            dateTime: receiptData.data.completedAt 
              ? new Date(receiptData.data.completedAt).toLocaleString('en-US', {
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
            transferAmount: `${receiptData.data.amount} ${receiptData.data.currency}`,
            fee: receiptData.data.fee ? `${receiptData.data.fee} ${receiptData.data.currency}` : '0',
            paymentAmount: `${parseFloat(receiptData.data.amount) + parseFloat(receiptData.data.fee || '0')} ${receiptData.data.currency}`,
            recipientName: receiptData.data.recipientInfo?.firstName 
              ? `${receiptData.data.recipientInfo.firstName} ${receiptData.data.recipientInfo.lastName || ''}`.trim()
              : receiptData.data.recipientInfo?.email || 'Rhinox User',
            status: receiptData.data.status || 'completed',
            paymentMethod: 'Rhinox User Transfer',
          }}
          onClose={handleReceiptClose}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020C19',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
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
  balanceSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
    marginBottom: 12 * SCALE,
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
  },
  balanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  assetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  assetSelectorIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  assetSelectorText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  mainCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  amountTypeToggleContainer: {
    flexDirection: 'row',
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
    width: SCREEN_WIDTH * 0.25,
    borderRadius: 100,
    marginTop:10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  amountTypeToggleButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,

    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100 * SCALE,
    paddingVertical: 8 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountTypeToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  amountTypeToggleText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  amountTypeToggleTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  amountSection: {
    marginBottom: 20 * SCALE,
  },
  amountInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 50 * SCALE,
    marginTop: 50,
    gap: 4 * SCALE,
  },
  amountInput: {
    fontSize: 50 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Agbalumo-Regular',
    textAlign: 'center',
    minHeight: 50 * SCALE,
  },
  amountCurrencyLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * SCALE,
  },
  quickAmountButton: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 8 * SCALE,
    minWidth: 40 * SCALE,
    alignItems: 'center',
    borderWidth: 0,
  },
  quickAmountButtonSelected: {
    borderWidth: 1,
    borderColor: '#A9EF45',
  },
  quickAmountText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  quickAmountTextSelected: {
    color: '#A9EF45',
  },
  formFields: {
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  inputField: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  networkField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
  },
  networkFieldText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  countryField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
  },
  countryFieldText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  inputHint: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4 * SCALE,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10 * SCALE,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryFlagImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 15 * SCALE,
    marginBottom: 15 * SCALE,
    gap: 10 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  proceedButtonContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 50 * SCALE,
    // marginBottom: 20 * SCALE,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60 * SCALE,
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  warningCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15 * SCALE,
    gap: 12 * SCALE,
  },
  // warningText: {
  //   flex: 1,
  //   fontSize: 12 * SCALE,
  //   fontWeight: '300',
  //   color: 'rgba(255, 255, 255, 0.7)',
  //   lineHeight: 18 * SCALE,
  // },
  warningHighlight: {
    color: '#A9EF45',
  },
  // Modal Styles
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
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  assetItemIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 15 * SCALE,
  },
  assetItemInfo: {
    flex: 1,
  },
  assetItemName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  assetItemBalance: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  networkItemName: {
    flex: 1,
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
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
    fontWeight: '600',
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
  summaryDetailsCard: {
    borderRadius: 15 * SCALE,
    overflow: 'hidden',
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
  summaryDetailRowFirst: {
    borderTopLeftRadius: 10 * SCALE,
    borderTopRightRadius: 10 * SCALE,
  },
  summaryDetailRowLast: {
    borderBottomLeftRadius: 10 * SCALE,
    borderBottomRightRadius: 10 * SCALE,
    borderBottomWidth: 0.3,
  },
  summaryDetailLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF80',
  },
  summaryDetailValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    flex: 1,
    justifyContent: 'flex-end',
  },
  summaryAddressText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    maxWidth: 150 * SCALE,
  },
  summaryCompleteButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCompleteButtonText: {
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
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    maxHeight: '90%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  securityModalScrollView: {
    flex: 1,
    width: '100%',
  },
  securityModalScrollContent: {
    alignItems: 'center',
    paddingBottom: 20 * SCALE,
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

  securityProceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60 * SCALE,
    width: '100%',
    marginTop: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  securityProceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  securityProceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000',
  },
});

export default SendFundCrypto;

