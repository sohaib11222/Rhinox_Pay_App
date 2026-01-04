import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { useGetTransferEligibility } from '../../../queries/transfer.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetP2PTransactions } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

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
  return currencyMap[countryCode] || 'NGN';
};

interface RecentTransaction {
  id: string;
  name: string;
  walletId: string;
  country: string;
  date: string;
  avatar: any;
}

const SendFundsScreen = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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
  const [walletId, setWalletId] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(null);

  // Get currency from country code
  const currency = useMemo(() => getCurrencyFromCountryCode(selectedCountry), [selectedCountry]);

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
      return [];
    }
    return countriesData.data.map((country: any, index: number) => ({
      id: country.id || index + 1,
      name: country.name || '',
      code: country.code || '',
      flag: country.flag || null, // Backend path to flag image
    }));
  }, [countriesData?.data]);

  // Check transfer eligibility
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    refetch: refetchEligibility,
  } = useGetTransferEligibility();

  const isEligible = useMemo(() => {
    return eligibilityData?.data?.eligible === true;
  }, [eligibilityData?.data?.eligible]);

  // Fetch recent P2P transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useGetP2PTransactions({
    limit: 10,
    offset: 0,
  });

  // Transform transactions to UI format
  const recentTransactions = useMemo(() => {
    if (!transactionsData?.data?.transactions || !Array.isArray(transactionsData.data.transactions)) {
      return [];
    }

    return transactionsData.data.transactions.map((tx: any) => {
      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A';

      // Get recipient info
      const recipientInfo = tx.recipientInfo || {};
      const recipientName = recipientInfo.name || recipientInfo.userName || 'Unknown User';
      const recipientWalletId = recipientInfo.walletId || tx.recipientWalletId || 'N/A';

      return {
        id: String(tx.id),
        name: recipientName,
        walletId: recipientWalletId,
        country: selectedCountryName,
        date: date,
        avatar: require('../../../assets/Frame 2398.png'),
      };
    });
  }, [transactionsData?.data?.transactions, selectedCountryName]);

  // Initiate transfer mutation
  const initiateMutation = useInitiateTransfer({
    onSuccess: (data: any) => {
      console.log('[SendFundsScreen] Transfer initiated successfully:', JSON.stringify(data, null, 2));
      
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
          setShowSummaryModal(false);
          setShowSecurityModal(true);
        } else {
          Alert.alert('Error', 'Invalid transaction ID received');
        }
      } else {
        Alert.alert('Error', 'Transaction ID not found in response');
      }
    },
    onError: (error: any) => {
      console.error('[SendFundsScreen] Error initiating transfer:', error);
      Alert.alert('Error', error?.message || 'Failed to initiate transfer');
    },
  });

  // Verify transfer mutation
  const verifyMutation = useVerifyTransfer({
    onSuccess: (data) => {
      console.log('[SendFundsScreen] Transfer verified successfully:', data);
      setShowSecurityModal(false);
      setEmailCode('');
      setAuthenticatorCode('');
      setPin('');
      setPendingTransactionId(null);
      setPendingTransactionData(null);
      
      // Reset form
      setAmount('');
      setWalletId('');
      setUserName('');
      
      // Refresh balances and transactions
      refetchBalances();
      refetchTransactions();
      
      // Show success modal
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.error('[SendFundsScreen] Error verifying transfer:', error);
      Alert.alert('Error', error?.message || 'Failed to verify transfer');
    },
  });

  const quickAmounts = ['20%', '50%', '75%', '100%'];

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace('%', '');
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const calculatedAmount = (balanceNum * parseFloat(numericValue)) / 100;
    setAmount(calculatedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }));
  };

  // Request camera permission when QR scanner opens
  useEffect(() => {
    if (showQRScanner && !cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [showQRScanner, cameraPermission, requestCameraPermission]);

  // Handle QR code scan
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scannedQRCode === data) return; // Prevent duplicate scans
    
    setScannedQRCode(data);
    console.log('[SendFundsScreen] QR Code scanned:', data);
    
    // Parse QR code data (could be wallet ID, email, or JSON)
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);
      if (parsed.walletId) {
        setWalletId(parsed.walletId);
        if (parsed.userName) {
          setUserName(parsed.userName);
        }
      } else if (parsed.email) {
        setWalletId(parsed.email);
        if (parsed.name) {
          setUserName(parsed.name);
        }
      }
    } catch {
      // If not JSON, treat as wallet ID or email
      if (data.includes('@')) {
        // It's an email
        setWalletId(data);
      } else {
        // It's a wallet ID
        setWalletId(data);
      }
    }
    
    // Close scanner
    setShowQRScanner(false);
    Alert.alert('QR Code Scanned', 'Wallet ID has been filled in');
  };

  const handleWalletIdChange = (text: string) => {
    setWalletId(text);
    // TODO: Fetch user name from API based on wallet ID
    // For now, we'll validate on proceed
    if (text.length < 8) {
      setUserName('');
    }
  };

  const handleProceed = () => {
    // Check eligibility first
    if (!isEligible) {
      Alert.alert(
        'KYC Required',
        eligibilityData?.data?.message || 'You need to complete KYC verification before sending funds.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to KYC screen if needed
            },
          },
        ]
      );
      return;
    }

    if (!walletId || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate amount
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check balance
    const balanceNum = parseFloat(balance.replace(/,/g, '') || '0');
    if (numericAmount > balanceNum) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Validate wallet ID (should be email or wallet ID)
    if (walletId.length < 5) {
      Alert.alert('Error', 'Please enter a valid wallet ID or email');
      return;
    }

    setShowSummaryModal(true);
  };

  const handleSummaryProceed = () => {
    if (!walletId || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Determine if walletId is an email or wallet ID
    const isEmail = walletId.includes('@');
    
    // Initiate transfer
    const initiateData: any = {
      amount: amount.replace(/,/g, ''),
      currency: currency,
      countryCode: selectedCountry,
      channel: 'rhionx_user',
    };

    if (isEmail) {
      initiateData.recipientEmail = walletId;
    } else {
      // Try to extract user ID if it's a numeric wallet ID
      // For now, we'll use recipientEmail or recipientUserId based on what we have
      initiateData.recipientEmail = walletId; // API might accept wallet ID as email
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


  const handleSecurityComplete = () => {
    if (!emailCode || !pin || pin.length < 4) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!pendingTransactionId) {
      Alert.alert('Error', 'Transaction ID not found. Please try again.');
      return;
    }

    // Verify transfer with email code and PIN
    verifyMutation.mutate({
      transactionId: String(pendingTransactionId),
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
    // Navigate back to Home tab instead of Settings tab
    (navigation as any).navigate('Home', { screen: 'HomeMain' });
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    // Navigate back to Home tab instead of Settings tab
    (navigation as any).navigate('Home', { screen: 'HomeMain' });
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
                {isLoadingBalance ? (
                  <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                ) : (
                  <ThemedText style={styles.balanceAmountInput}>
                    N{formatBalance(balance)}
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
                    const selectedCountryData = countries.find((c) => c.code === selectedCountry);
                    const flagUri = selectedCountryData?.flag
                      ? selectedCountryData.flag.startsWith('/')
                        ? `${API_BASE_URL.replace('/api', '')}${selectedCountryData.flag}`
                        : selectedCountryData.flag
                      : null;
                    
                    return flagUri ? (
                      <Image
                        source={{ uri: flagUri }}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ThemedText style={styles.countryFlagText}>
                        {selectedCountryData?.code || selectedCountry}
                      </ThemedText>
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
              <ThemedText style={styles.amountInputLabel}>
                {currency === 'NGN' ? 'N' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
              </ThemedText>
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
            {/* Enter Unique Wallet ID */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Unique Wallet ID"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={walletId}
                onChangeText={handleWalletIdChange}
                keyboardType="default"
              />
              <TouchableOpacity onPress={() => setShowQRScanner(true)}>
                <Image
                  source={require('../../../assets/Scan.png')}
                  style={[{ marginBottom: -1, width: 19, height: 19 }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            {/* User Name (Auto-filled) */}
            {userName && (
              <View style={[styles.inputField, {backgroundColor: '#020C19', borderWidth: 0.3, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                <View style={styles.accountNameContainer}>
                  <ThemedText style={styles.accountNameLabel}>User Name</ThemedText>
                  <ThemedText style={styles.accountNameValue}>{userName}</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[styles.proceedButton, (!walletId || !amount || initiateMutation.isPending) && styles.proceedButtonDisabled]}
            onPress={handleProceed}
            disabled={!walletId || !amount || initiateMutation.isPending}
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
          <ThemedText style={styles.feeText}>
            Fee : {currency === 'NGN' ? 'N' : currency}200
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

          {isLoadingTransactions ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction: RecentTransaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => {
                    setWalletId(transaction.walletId);
                    setUserName(transaction.name);
                  }}
                >
                  <Image source={transaction.avatar} style={styles.transactionIcon} resizeMode="cover" />
                  <View style={styles.transactionDetails}>
                    <ThemedText style={styles.transactionPhone}>{transaction.name}</ThemedText>
                    <View style={styles.transactionMeta}>
                      <ThemedText style={styles.transactionPlan}>{transaction.walletId} • {transaction.country}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <ThemedText style={styles.transactionDate}>Last Transfer: {transaction.date}</ThemedText>
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
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((country) => {
                  const flagUri = country.flag
                    ? country.flag.startsWith('/')
                      ? `${API_BASE_URL.replace('/api', '')}${country.flag}`
                      : country.flag
                    : null;
                  
                  return (
                    <TouchableOpacity
                      key={country.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountry(country.code);
                        setSelectedCountryName(country.name);
                        setShowCountryModal(false);
                      }}
                    >
                      {flagUri ? (
                        <Image
                          source={{ uri: flagUri }}
                          style={styles.countryFlagModal}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlagTextModal}>
                          {country.code}
                        </ThemedText>
                      )}
                      <ThemedText style={styles.countryNameModal}>{country.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={selectedCountry === country.code ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24 * SCALE}
                        color={selectedCountry === country.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
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

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          setShowQRScanner(false);
          setScannedQRCode(null);
        }}
      >
        <View style={styles.qrScannerContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.qrScannerHeader}>
            <TouchableOpacity
              style={styles.qrScannerBackButton}
              onPress={() => {
                setShowQRScanner(false);
                setScannedQRCode(null);
              }}
            >
              <View style={styles.qrScannerBackCircle}>
                <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.qrScannerTitle}>Scan QR Code</ThemedText>
          </View>
          {!cameraPermission?.granted ? (
            <View style={styles.qrScannerView}>
              <MaterialCommunityIcons name="camera-off" size={60 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.qrScannerPermissionText}>
                Camera permission is required to scan QR codes
              </ThemedText>
              <TouchableOpacity
                style={styles.qrScannerPermissionButton}
                onPress={requestCameraPermission}
              >
                <ThemedText style={styles.qrScannerPermissionButtonText}>Grant Permission</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrScannerView}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scannedQRCode ? undefined : handleBarCodeScanned}
              >
                <View style={styles.qrScannerOverlay}>
                  <View style={styles.qrScannerFrame}>
                    <View style={[styles.qrCorner, styles.qrCornerTopLeft]} />
                    <View style={[styles.qrCorner, styles.qrCornerTopRight]} />
                    <View style={[styles.qrCorner, styles.qrCornerBottomLeft]} />
                    <View style={[styles.qrCorner, styles.qrCornerBottomRight]} />
                    <View style={styles.qrScannerLine} />
                  </View>
                  <ThemedText style={styles.qrScannerHint}>
                    Position the QR code within the frame
                  </ThemedText>
                </View>
              </CameraView>
            </View>
          )}
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
                    {(() => {
                      const selectedCountryData = countries.find((c) => c.code === selectedCountry);
                      const flagUri = selectedCountryData?.flag
                        ? selectedCountryData.flag.startsWith('/')
                          ? `${API_BASE_URL.replace('/api', '')}${selectedCountryData.flag}`
                          : selectedCountryData.flag
                        : null;
                      
                      return flagUri ? (
                        <Image
                          source={{ uri: flagUri }}
                          style={styles.summaryFlag}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlagTextSummary}>
                          {selectedCountryData?.code || selectedCountry}
                        </ThemedText>
                      );
                    })()}
                    <ThemedText style={styles.summaryCountryText}>{selectedCountryName}</ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.summaryAmount}>
                    {currency === 'NGN' ? '₦' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                    {amount.replace(/,/g, '')}.00
                  </ThemedText>
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
                    {(() => {
                      const selectedCountryData = countries.find((c) => c.code === selectedCountry);
                      const flagUri = selectedCountryData?.flag
                        ? selectedCountryData.flag.startsWith('/')
                          ? `${API_BASE_URL.replace('/api', '')}${selectedCountryData.flag}`
                          : selectedCountryData.flag
                        : null;
                      
                      return flagUri ? (
                        <Image
                          source={{ uri: flagUri }}
                          style={styles.summaryFlag}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlagTextSummary}>
                          {selectedCountryData?.code || selectedCountry}
                        </ThemedText>
                      );
                    })()}
                    <ThemedText style={styles.summaryCountryText}>{selectedCountryName}</ThemedText>
                  </View>
                  <ThemedText style={styles.summaryAmount}>
                    {currency === 'NGN' ? '₦' : currency === 'KES' ? 'K' : currency === 'GHS' ? 'G' : currency}
                    {amount.replace(/,/g, '')}.00
                  </ThemedText>
                </View>
              </View>

              {/* Details Card */}
              <View style={styles.summaryDetailsCard}>
                <View style={[styles.summaryDetailRow, {borderTopRightRadius: 10, borderTopLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                  <ThemedText style={styles.summaryDetailLabel}>Country</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{selectedCountryName}</ThemedText>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Rhinoxpay ID</ThemedText>
                  <View style={styles.summaryDetailValueRow}>
                    <Image
                      source={require('../../../assets/login/memoji.png')}
                      style={styles.summaryProfileIcon}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.summaryDetailValue}>{walletId}</ThemedText>
                  </View>
                </View>
                <View style={styles.summaryDetailRow}>
                  <ThemedText style={styles.summaryDetailLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>{userName}</ThemedText>
                </View>
                <View style={[styles.summaryDetailRow, {borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                  <ThemedText style={styles.summaryDetailLabel}>Fee</ThemedText>
                  <ThemedText style={styles.summaryDetailValue}>N0</ThemedText>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.summaryProceedButton}
              onPress={handleSummaryProceed}
            >
              <ThemedText style={styles.summaryProceedButtonText}>Proceed</ThemedText>
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
                {amount}
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
              style={[styles.proceedButton, (!emailCode || !pin || pin.length < 4 || verifyMutation.isPending) && styles.proceedButtonDisabled]}
              onPress={handleSecurityComplete}
              disabled={!emailCode || !pin || pin.length < 4 || verifyMutation.isPending}
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
          amount: `N${amount.replace(/,/g, '')}`,
          fee: 'N0',
          transactionType: 'send',
        }}
        onViewTransaction={handleViewTransaction}
        onCancel={handleSuccessCancel}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={{
          transactionType: 'send',
          transactionTitle: `Send Funds - ${userName}`,
          transferAmount: `N${amount.replace(/,/g, '')}`,
          fee: 'N0',
          paymentAmount: `N${amount.replace(/,/g, '')}`,
          country: selectedCountryName,
          recipientName: userName,
          transactionId: `SF${Date.now().toString().slice(-10)}`,
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'RhinoxPay ID',
        }}
        onClose={handleReceiptClose}
      />
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
  countryFlagText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
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
    fontFamily: 'Agbalumo-Regular',

    padding: 0,
    margin: 0,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 18 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  countryFlagTextModal: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    width: 36 * SCALE,
    height: 36 * SCALE,
    textAlign: 'center',
    lineHeight: 36 * SCALE,
    borderRadius: 18 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryNameModal: {
    flex: 1,
    fontSize: 14 * SCALE,
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
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  // QR Scanner Styles
  qrScannerContainer: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  qrScannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
    backgroundColor: '#1A2332',
  },
  qrScannerBackButton: {
    marginRight: 12 * SCALE,
  },
  qrScannerBackCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrScannerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  qrScannerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  qrScannerFrame: {
    width: 250 * SCALE,
    height: 250 * SCALE,
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderColor: '#A9EF45',
    borderWidth: 3 * SCALE,
  },
  qrCornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  qrCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  qrScannerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2 * SCALE,
    backgroundColor: '#A9EF45',
  },
  qrScannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  qrScannerHint: {
    position: 'absolute',
    bottom: 100 * SCALE,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20 * SCALE,
  },
  qrScannerPermissionText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 30 * SCALE,
    paddingHorizontal: 40 * SCALE,
  },
  qrScannerPermissionButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingHorizontal: 30 * SCALE,
    paddingVertical: 15 * SCALE,
  },
  qrScannerPermissionButtonText: {
    fontSize: 14 * SCALE,
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
  countryFlagTextSummary: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    width: 36 * SCALE,
    height: 38 * SCALE,
    textAlign: 'center',
    lineHeight: 38 * SCALE,
    borderRadius: 12 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    // backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    // borderWidth: 0.3,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
    // padding: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF0D',
    padding: 15 * SCALE,
    // borderRadius: 100 * SCALE,
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
  summaryDetailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  summaryProfileIcon: {
    width: 20 * SCALE,
    height: 20 * SCALE,
    borderRadius: 10 * SCALE,
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
});

export default SendFundsScreen;

