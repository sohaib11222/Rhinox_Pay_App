import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetP2PAdDetails } from '../../../queries/p2p.queries';
import { useCreateP2POrder, useMarkPaymentMade } from '../../../mutations/p2p.mutations';
import { useGetP2POrderDetails } from '../../../queries/p2p.queries';
import { useGetPaymentMethods } from '../../../queries/paymentSettings.queries';
import { useGetCurrentUser } from '../../../queries/auth.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { useGetTransferEligibility } from '../../../queries/transfer.queries';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  paymentMethodData?: any; // Store full payment method data for API calls
}

interface OrderStep {
  step: 1 | 2 | 3 | 4;
  status: 'Order Placed' | 'Awaiting Payment' | 'Awaiting Coin Release' | 'Order Completed';
}

const BuyOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const routeParams = route.params as { 
    skipInitialScreen?: boolean; 
    paymentMethod?: string; 
    orderId?: string; 
    adId?: string;
    amount?: string; 
    assetAmount?: string;
    cryptoAmount?: string;
    paymentMethodId?: string;
    currentStep?: number;
  } | undefined;
  
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(
    routeParams?.skipInitialScreen ? (routeParams?.currentStep as any || 1) : 0
  );

  const [currencyType, setCurrencyType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [amount, setAmount] = useState(routeParams?.cryptoAmount || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempSelectedPaymentMethod, setTempSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [reviewRating, setReviewRating] = useState<'positive' | 'negative' | null>(null);
  const [reviewText, setReviewText] = useState('He is fast and reliable.');
  const [orderId, setOrderId] = useState<string | null>(routeParams?.orderId || null);
  const [adId, setAdId] = useState<string | null>(routeParams?.adId || null);

  // ... (biometric and other states)

  // Fetch order details if orderId is provided
  const {
    data: orderDetailsData,
    isLoading: isLoadingOrderDetails,
    refetch: refetchOrderDetails,
  } = useGetP2POrderDetails(orderId || '', {
    enabled: !!orderId && currentStep > 0,
  } as any);

  // Determine current step based on order status from API
  const apiStep = useMemo(() => {
    if (!orderDetailsData?.data) return null;
    const status = orderDetailsData.data.status;
    switch (status) {
      case 'pending':
        return 1;
      case 'awaiting_payment':
        return 2;
      case 'payment_made':
      case 'awaiting_coin_release':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return 1; // Or handle cancelled state specifically
      default:
        return 1;
    }
  }, [orderDetailsData?.data?.status]);

  // Sync internal currentStep with API step
  useEffect(() => {
    if (apiStep !== null && apiStep !== currentStep) {
      console.log(`[BuyOrder] Syncing step: ${currentStep} -> ${apiStep} (Status: ${orderDetailsData?.data?.status})`);
      setCurrentStep(apiStep as any);
    }
  }, [apiStep, currentStep, orderDetailsData?.data?.status]);

  // PIN states
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  
  // Biometric states
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Fingerprint');
  const [isScanning, setIsScanning] = useState(false);

  // Security verification states
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [transferTransactionId, setTransferTransactionId] = useState<number | null>(null);

  // RhinoxPay ID states
  const [showRhinoxPayModal, setShowRhinoxPayModal] = useState(false);
  const [showEmailCodeModal, setShowEmailCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [rhinoxPayAmount, setRhinoxPayAmount] = useState('20,000');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(1);
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');

  // Hide bottom tab bar when focused
  useFocusEffect(
    React.useCallback(() => {
      // BuyOrder -> SettingsStack -> TabNavigator
      // Go up 2 levels to reach the Tab Navigator
      const settingsStack = navigation.getParent();
      const tabNavigator = settingsStack?.getParent();

      if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
        tabNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Restore tab bar when leaving this screen
        if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
          tabNavigator.setOptions({
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderTopWidth: 0,
              height: 75 * SCALE,
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * SCALE,
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

  // Also hide on mount to ensure it's hidden immediately
  useLayoutEffect(() => {
    const settingsStack = navigation.getParent();
    const tabNavigator = settingsStack?.getParent();

    if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
      tabNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
  }, [navigation]);

  // Countdown timer for Step 1
  useEffect(() => {
    if (currentStep === 1 && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, countdown]);

  // Fetch ad details if adId is provided (enable for all steps if adId exists)
  const {
    data: adDetailsData,
    isLoading: isLoadingAdDetails,
    error: adDetailsError,
    refetch: refetchAdDetails,
  } = useGetP2PAdDetails(adId || '', {
    enabled: !!adId, // Enable whenever adId exists, not just for step 0
  } as any);

  // Fetch current user data
  const {
    data: currentUserData,
    isLoading: isLoadingCurrentUser,
  } = useGetCurrentUser();

  // Fetch user's payment methods from payment settings
  const {
    data: userPaymentMethodsData,
    isLoading: isLoadingUserPaymentMethods,
    refetch: refetchUserPaymentMethods,
  } = useGetPaymentMethods();

  // Transform payment methods from ad details and user's payment settings
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    const methods: PaymentMethod[] = [];
    
    // First, add payment methods from ad details (vendor's payment methods)
    if (adDetailsData?.data?.paymentMethods && Array.isArray(adDetailsData.data.paymentMethods)) {
      adDetailsData.data.paymentMethods.forEach((pm: any) => {
        // Determine display name based on payment method type
        let displayName = 'Unknown';
        if (pm.type === 'bank_account') {
          displayName = pm.bankName || 'Bank Transfer';
          // If account number is partially masked, show it for clarity
          if (pm.accountNumber && pm.accountNumber.includes('****')) {
            displayName = `${pm.bankName || 'Bank'} ${pm.accountNumber}`;
          } else if (pm.accountNumber) {
            // Show last 4 digits if available
            const last4 = pm.accountNumber.slice(-4);
            displayName = `${pm.bankName || 'Bank'} (****${last4})`;
          }
        } else if (pm.type === 'mobile_money') {
          displayName = pm.provider?.name || 'Mobile Money';
          // If phone number is partially masked, show it
          if (pm.phoneNumber && pm.phoneNumber.includes('****')) {
            displayName = `${pm.provider?.name || 'Mobile Money'} ${pm.phoneNumber}`;
          }
        } else if (pm.type === 'rhinoxpay_id') {
          displayName = 'RhinoxPay ID';
        } else {
          displayName = pm.type || 'Unknown';
        }

        methods.push({
          id: String(pm.id),
          name: displayName,
          type: pm.type || 'unknown',
          paymentMethodData: pm, // Store full data for API call
        });
      });
    }
    
    // If no payment methods from ad, or as additional options, add user's payment methods
    // Note: For buy orders, we typically use vendor's payment methods, but we can show user's as fallback
    if (methods.length === 0 && userPaymentMethodsData?.data && Array.isArray(userPaymentMethodsData.data)) {
      userPaymentMethodsData.data.forEach((pm: any) => {
        let displayName = 'Unknown';
        if (pm.type === 'bank_account') {
          displayName = pm.bankName || 'Bank Transfer';
          if (pm.accountNumber) {
            const last4 = pm.accountNumber.slice(-4);
            displayName = `${pm.bankName || 'Bank'} (****${last4})`;
          }
        } else if (pm.type === 'mobile_money') {
          displayName = pm.provider?.name || 'Mobile Money';
          if (pm.phoneNumber) {
            const last4 = pm.phoneNumber.slice(-4);
            displayName = `${pm.provider?.name || 'Mobile Money'} (****${last4})`;
          }
        } else if (pm.type === 'rhinoxpay_id') {
          displayName = 'RhinoxPay ID';
        } else {
          displayName = pm.type || 'Unknown';
        }

        methods.push({
          id: String(pm.id),
          name: displayName,
          type: pm.type || 'unknown',
          paymentMethodData: pm,
        });
      });
    }
    
    return methods;
  }, [adDetailsData?.data?.paymentMethods, userPaymentMethodsData?.data]);

  // Get ad price for rate display (when creating order)
  const adPrice = useMemo(() => {
    if (adDetailsData?.data?.price) {
      return `${adDetailsData.data.fiatCurrency || 'NGN'}${adDetailsData.data.price}`;
    }
    return 'N1,520'; // Default fallback
  }, [adDetailsData?.data?.price, adDetailsData?.data?.fiatCurrency]);

  // Transform order data from API
  const orderData = useMemo(() => {
    if (orderDetailsData?.data) {
      const order = orderDetailsData.data;
      const vendor = order.vendor || {};
      const buyer = order.buyer || {};
      const paymentMethod = order.paymentMethod || {};
      
      // Get vendor name from various possible fields
      const vendorName = vendor.name || 
        (vendor.firstName && vendor.lastName ? `${vendor.firstName} ${vendor.lastName}` : 
        vendor.firstName || vendor.lastName || 'Vendor');
      
      // Get vendor avatar if available
      const vendorAvatar = vendor.avatar || vendor.profilePicture 
        ? { uri: vendor.avatar || vendor.profilePicture }
        : require('../../../assets/login/memoji.png');
      
      // Get vendor status from order or ad details
      const vendorStatus = order.vendor?.isOnline !== undefined 
        ? (order.vendor.isOnline ? 'Online' : 'Offline')
        : 'Online'; // Default
      
      // Get vendor rating/score if available
      const vendorScore = order.vendor?.score 
        ? `${parseFloat(order.vendor.score).toFixed(0)}%`
        : (order.vendor?.rating ? `${order.vendor.rating}%` : '98%');
      
      return {
        vendorName: vendorName,
        vendorAvatar: vendorAvatar,
        vendorStatus: vendorStatus,
        vendorRating: vendorScore,
        rate: `${order.fiatCurrency || 'NGN'}${order.price || '0'}`,
        buyerName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'Buyer',
        amountToBePaid: `${order.fiatCurrency || 'NGN'}${order.fiatAmount || '0'}`,
        paymentAccount: paymentMethod.type === 'bank_account' ? (paymentMethod.bankName || 'Bank Transfer') :
                        paymentMethod.type === 'mobile_money' ? (paymentMethod.provider?.name || 'Mobile Money') :
                        paymentMethod.type === 'rhinoxpay_id' ? 'RhinoxPay ID' :
                        'Payment Method',
        price: `${order.price || '0'} ${order.fiatCurrency || 'NGN'}`,
        txId: order.id ? String(order.id).substring(0, 15) : 'N/A',
        orderTime: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
        amountToPay: `${order.fiatCurrency || 'NGN'}${order.fiatAmount || '0'}`,
        bankName: paymentMethod.bankName || 'N/A',
        accountNumber: paymentMethod.accountNumber || paymentMethod.phoneNumber || 'N/A',
        accountName: paymentMethod.accountName || 'N/A',
        // For RhinoxPay ID, get the actual ID from rhinoxpayId or accountNumber field
        rhinoxPayId: paymentMethod.type === 'rhinoxpay_id' 
          ? (paymentMethod.rhinoxpayId || paymentMethod.accountNumber || 'N/A')
          : null,
        usdtAmount: `${order.cryptoAmount || '0'} ${order.cryptoCurrency || 'USDT'}`,
        orderStatus: order.status || 'pending',
        paymentMethodId: paymentMethod.id ? String(paymentMethod.id) : null,
        // Get vendor email for RhinoxPay transfers
        vendorEmail: vendor.email || null,
        vendorId: vendor.id ? String(vendor.id) : null,
      };
    }
    
    // Get current user name
    const currentUser = currentUserData?.data?.user || currentUserData?.data;
    const currentUserName = currentUser 
      ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'User'
      : 'User';

    // Fallback to route params or defaults - use ad details for vendor info
    const vendor = adDetailsData?.data?.vendor || {};
    const vendorName = vendor.name || 
      (vendor.firstName && vendor.lastName ? `${vendor.firstName} ${vendor.lastName}` : 
      vendor.firstName || vendor.lastName || 'Vendor');
    
    // Get vendor status from ad (isOnline) or default
    const vendorStatus = adDetailsData?.data?.isOnline ? 'Online' : 'Offline';
    
    // Get vendor rating/score from ad if available
    const vendorScore = adDetailsData?.data?.score 
      ? `${parseFloat(adDetailsData.data.score).toFixed(0)}%`
      : '98%'; // Default fallback
    
    // Get vendor avatar if available (from vendor data or default)
    const vendorAvatar = vendor.avatar || vendor.profilePicture 
      ? { uri: vendor.avatar || vendor.profilePicture }
      : require('../../../assets/login/memoji.png');
    
    return {
      vendorName: vendorName,
      vendorAvatar: vendorAvatar,
      vendorStatus: vendorStatus,
      vendorRating: vendorScore,
      rate: adPrice,
      buyerName: currentUserName,
      amountToBePaid: routeParams?.amount ? `N${routeParams.amount.replace(/[^0-9]/g, '')}` : 'N25,000',
      paymentAccount: routeParams?.paymentMethod || 'Bank Transfer',
      price: adDetailsData?.data?.price ? `${adDetailsData.data.price} ${adDetailsData.data.fiatCurrency || 'NGN'}` : '1,500 NGN',
      txId: '128DJ2I3I1DJKQKCM',
      orderTime: 'Oct 16, 2025 - 07:22AM',
      amountToPay: routeParams?.amount ? `N${routeParams.amount.replace(/[^0-9]/g, '')}` : 'N20,000',
      bankName: 'Opay',
      accountNumber: '1234567890',
      accountName: currentUserName,
      usdtAmount: routeParams?.assetAmount || '15 USDT',
      orderStatus: 'pending',
      paymentMethodId: null,
    };
  }, [orderDetailsData?.data, routeParams, adDetailsData?.data, adPrice, currentUserData]);

  // Set default payment method from route params if provided
  useEffect(() => {
    if (routeParams?.paymentMethodId && paymentMethods.length > 0 && !selectedPaymentMethod) {
      const method = paymentMethods.find(m => m.id === routeParams.paymentMethodId);
      if (method) {
        setSelectedPaymentMethod(method);
      }
    }
  }, [routeParams?.paymentMethodId, paymentMethods, selectedPaymentMethod]);

  // Set adId from route params or ad details
  useEffect(() => {
    if (routeParams?.adId) {
      setAdId(String(routeParams.adId));
    } else if (adDetailsData?.data?.id && !adId) {
      // Fallback: get adId from ad details if available
      setAdId(String(adDetailsData.data.id));
    }
  }, [routeParams?.adId, adDetailsData?.data?.id, adId]);

  // Debug: Log adId and payment methods when they change
  useEffect(() => {
    console.log('BuyOrder - adId:', adId);
    console.log('BuyOrder - routeParams?.adId:', routeParams?.adId);
    if (paymentMethods.length > 0) {
      console.log('Payment methods loaded:', paymentMethods);
    } else if (adDetailsData?.data && !isLoadingAdDetails) {
      console.log('Ad details loaded but no payment methods:', adDetailsData.data);
      console.log('Ad payment methods:', adDetailsData.data.paymentMethods);
    } else if (!adId && !isLoadingAdDetails) {
      console.log('No adId set - cannot load payment methods');
    }
  }, [adId, routeParams?.adId, paymentMethods, adDetailsData?.data, isLoadingAdDetails]);

  // Create order mutation
  const createOrderMutation = useCreateP2POrder({
    onSuccess: (data) => {
      const orderId = data?.data?.id ? String(data.data.id) : null;
      if (orderId) {
        setOrderId(orderId);
        queryClient.invalidateQueries({ queryKey: ['p2p', 'orders'] });
        
        // Check order status
        const status = data?.data?.status;
        if (status === 'awaiting_payment') {
          // Auto-accepted, go directly to payment step
          setCurrentStep(2);
          showSuccessAlert('Success', 'Order created successfully. Please proceed to payment.');
        } else {
          // Pending vendor acceptance
          setCurrentStep(1);
          showSuccessAlert('Success', 'Order created successfully. Waiting for vendor acceptance.');
        }
      }
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to create order');
    },
  });

  // Mark payment made mutation
  const markPaymentMadeMutation = useMarkPaymentMade({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'orders', orderId] });
      setPaymentConfirmed(true);
      setCurrentStep(3); // Move to Awaiting Coin Release
      showSuccessAlert('Success', 'Payment confirmed. Waiting for vendor to release coins.');
      // REMOVED: Auto-advancing to step 4. Step 4 should only be reachable via API status 'completed'.
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to confirm payment');
    },
  });

  // Transfer mutations for RhinoxPay payments
  const initiateTransferMutation = useInitiateTransfer({
    onSuccess: (data) => {
      console.log('[BuyOrder] Transfer initiated successfully:', data);
      const transactionId = data?.data?.id || data?.data?.transactionId;
      if (transactionId) {
        setTransferTransactionId(Number(transactionId));
        setShowRhinoxPayModal(false);
        setShowEmailCodeModal(true);
        showSuccessAlert('Success', 'Transfer initiated. Please check your email for verification code.');
      } else {
        showErrorAlert('Error', 'Transfer initiated but transaction ID not received');
      }
    },
    onError: (error: any) => {
      console.error('[BuyOrder] Error initiating transfer:', error);
      showErrorAlert('Error', error?.message || 'Failed to initiate transfer. Please try again.');
    },
  });

  const verifyTransferMutation = useVerifyTransfer({
    onSuccess: (data) => {
      console.log('[BuyOrder] Transfer verified successfully:', data);
      setShowEmailCodeModal(false);
      setEmailCode('');
      setPin('');
      // After successful transfer, mark payment as made
      if (orderId) {
        markPaymentMadeMutation.mutate({ orderId });
      }
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.error('[BuyOrder] Error verifying transfer:', error);
      showErrorAlert('Error', error?.message || 'Failed to verify transfer. Please try again.');
    },
  });

  // Helper to check if amount is valid
  const isValidAmount = useMemo(() => {
    if (!amount || typeof amount !== 'string') return false;
    const trimmedAmount = amount.trim();
    if (trimmedAmount === '') return false;
    const numericAmount = trimmedAmount.replace(/,/g, '').replace(/\s/g, '');
    if (!numericAmount || numericAmount === '') return false;
    const parsed = parseFloat(numericAmount);
    return !isNaN(parsed) && isFinite(parsed) && parsed > 0;
  }, [amount]);

  // Helper to check if button should be enabled
  const isButtonEnabled = useMemo(() => {
    const hasValidAmount = isValidAmount;
    const hasPaymentMethod = !!selectedPaymentMethod;
    const hasAdId = !!adId && adId.trim() !== '';
    const isNotPending = !createOrderMutation.isPending;
    
    return hasValidAmount && hasPaymentMethod && hasAdId && isNotPending;
  }, [isValidAmount, selectedPaymentMethod, adId, createOrderMutation.isPending]);

  // Debug: Log button state
  useEffect(() => {
    console.log('=== Buy Button State ===');
    console.log('amount:', amount);
    console.log('isValidAmount:', isValidAmount);
    console.log('selectedPaymentMethod:', selectedPaymentMethod?.name || 'null');
    console.log('adId:', adId);
    console.log('createOrderMutation.isPending:', createOrderMutation.isPending);
    console.log('isButtonEnabled:', isButtonEnabled);
    if (!isButtonEnabled) {
      console.log('Button disabled because:');
      if (!isValidAmount) console.log('  - Invalid amount');
      if (!selectedPaymentMethod) console.log('  - No payment method selected');
      if (!adId || adId.trim() === '') console.log('  - No adId');
      if (createOrderMutation.isPending) console.log('  - Mutation pending');
    }
  }, [amount, isValidAmount, selectedPaymentMethod, adId, createOrderMutation.isPending, isButtonEnabled]);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Reset PIN when PIN modal opens
  useEffect(() => {
    if (showPinModal) {
      setPin('');
    }
  }, [showPinModal]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setIsBiometricAvailable(false);
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setIsBiometricAvailable(false);
        return;
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsBiometricAvailable(true);

      // Determine biometric type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      } else {
        setBiometricType('Biometric');
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
          // Auto proceed to security verification when PIN is set
          if (storedPin.length >= 4) {
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
        'Authentication Error',
        'An error occurred during biometric authentication. Please enter your PIN manually.'
      );
    }
  };

  const handleBuy = () => {
    if (!isValidAmount) {
      showErrorAlert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedPaymentMethod) {
      showErrorAlert('Error', 'Please select a payment method');
      return;
    }
    if (!adId || adId.trim() === '') {
      showErrorAlert('Error', 'Ad ID is missing. Please go back and select an ad first.');
      return;
    }
    
    // Validate amount format
    const numericAmount = amount.replace(/,/g, '').replace(/\s/g, '').trim();
    if (!numericAmount || numericAmount === '') {
      showErrorAlert('Error', 'Please enter an amount');
      return;
    }
    
    const parsedAmount = parseFloat(numericAmount);
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      showErrorAlert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    // Determine crypto amount based on currency type
    let cryptoAmount: string;
    
    if (currencyType === 'Fiat') {
      // User entered fiat amount, calculate crypto amount from ad price
      const adPrice = parseFloat(adDetailsData?.data?.price || '0');
      if (adPrice <= 0) {
        showErrorAlert('Error', 'Invalid ad price. Please try again.');
        return;
      }
      cryptoAmount = (parsedAmount / adPrice).toFixed(8);
    } else {
      // User entered crypto amount directly
      cryptoAmount = numericAmount;
    }

    // Create order via API
    createOrderMutation.mutate({
      adId: adId,
      cryptoAmount: cryptoAmount,
      paymentMethodId: selectedPaymentMethod.id,
    });
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setTempSelectedPaymentMethod(method);
  };

  const handleApplyPaymentMethod = () => {
    if (tempSelectedPaymentMethod) {
      setSelectedPaymentMethod(tempSelectedPaymentMethod);
      setShowPaymentMethodModal(false);
      setTempSelectedPaymentMethod(null);
    }
  };

  const handleAwaitingButton = () => {
    // Move to step 2
    setCurrentStep(2);
  };

  const handleAcceptOrder = () => {
    // Move to step 2 (Awaiting Payment)
    setCurrentStep(2);
  };

  const handlePaymentMade = () => {
    setShowWarningModal(true);
  };

  const handleWarningComplete = () => {
    setShowWarningModal(false);
    // If RhinoxPay ID is selected, skip verification modals and open payment modal
    if (selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2') {
      setShowRhinoxPayModal(true);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePayNow = () => {
    setShowRhinoxPayModal(true);
  };

  const handleRhinoxPayProceed = () => {
    // Validate required data
    if (!orderData?.vendorEmail && !orderData?.rhinoxPayId) {
      showErrorAlert('Error', 'Vendor payment information not available');
      return;
    }

    if (!orderData?.amountToPay) {
      showErrorAlert('Error', 'Payment amount not available');
      return;
    }

    // Extract amount from "NGN1,800.00" format
    const amountStr = orderData.amountToPay.replace(/[^0-9.]/g, '');
    const numericAmount = parseFloat(amountStr);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showErrorAlert('Error', 'Invalid payment amount');
      return;
    }

    // Determine recipient - use vendor email if available, otherwise use RhinoxPay ID
    const recipientEmail = orderData.vendorEmail;
    const rhinoxPayId = orderData.rhinoxPayId;

    if (!recipientEmail && !rhinoxPayId) {
      showErrorAlert('Error', 'Vendor payment details not found');
      return;
    }

    // Get country code from selected country (default to NG for Nigeria)
    const countryCode = selectedCountryName === 'Nigeria' ? 'NG' : 
                        selectedCountryName === 'South Africa' ? 'ZA' : 'NG';

    // Initiate transfer
    const transferData: any = {
      amount: numericAmount.toFixed(2),
      currency: selectedCurrency || 'NGN',
      countryCode: countryCode,
      channel: 'rhionx_user' as const,
    };

    // Use email if available, otherwise try RhinoxPay ID
    if (recipientEmail) {
      transferData.recipientEmail = recipientEmail;
    } else if (rhinoxPayId && rhinoxPayId !== 'N/A') {
      // If RhinoxPay ID is an email format, use it as email
      if (rhinoxPayId.includes('@')) {
        transferData.recipientEmail = rhinoxPayId;
      } else {
        // Otherwise, try to use it as accountNumber (API might accept it)
        transferData.accountNumber = rhinoxPayId;
      }
    }

    console.log('[BuyOrder] Initiating transfer:', transferData);
    initiateTransferMutation.mutate(transferData);
  };

  const handleEmailCodeVerify = () => {
    if (!emailCode || emailCode.length < 4) {
      showErrorAlert('Error', 'Please enter a valid email verification code');
      return;
    }

    if (!pin || pin.length !== 5) {
      showErrorAlert('Error', 'Please enter your 5-digit PIN');
      return;
    }

    if (!transferTransactionId) {
      showErrorAlert('Error', 'Transaction ID not found');
      return;
    }

    // Verify transfer with email code and PIN
    verifyTransferMutation.mutate({
      transactionId: transferTransactionId,
      emailCode: emailCode,
      pin: pin,
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentConfirmed(true);
    setCurrentStep(3); // Move to Awaiting Coin Release
    // REMOVED: Auto-advancing to step 4.
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
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleSecurityProceed = () => {
    if (emailCode && authenticatorCode && orderId) {
      setShowSecurityModal(false);
      // Mark payment as made via API
      markPaymentMadeMutation.mutate({
        orderId: orderId,
      });
    } else if (emailCode && authenticatorCode) {
      // Fallback if no orderId (shouldn't happen in normal flow)
      setShowSecurityModal(false);
      setPaymentConfirmed(true);
      setCurrentStep(3);
      setTimeout(() => {
        setCurrentStep(4);
      }, 2000);
    }
  };

  const handleCopyAccountNumber = async () => {
    await Clipboard.setStringAsync(orderData.accountNumber);
    // TODO: Show toast notification
  };

  const handleCopyTxId = async () => {
    await Clipboard.setStringAsync(orderData.txId);
    // TODO: Show toast notification
  };

  const handleSendReview = () => {
    // TODO: Implement API call to submit review
    console.log('Review submitted:', { rating: reviewRating, text: reviewText });
    showSuccessAlert('Success', 'Review submitted successfully');
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    if (orderId) {
      await refetchOrderDetails();
    }
    return Promise.resolve();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const getStepStatus = () => {
    if (orderDetailsData?.data?.status) {
      const status = orderDetailsData.data.status;
      switch (status) {
        case 'pending':
          return 'Order Placed';
        case 'awaiting_payment':
          return 'Awaiting Payment';
        case 'payment_made':
        case 'awaiting_coin_release':
          return 'Awaiting Coin Release';
        case 'completed':
          return 'Order Completed';
        case 'cancelled':
          return 'Order Cancelled';
        default:
          return 'Order Placed';
      }
    }

    switch (currentStep) {
      case 1:
        // If coming from AdDetails, show "Order Received", otherwise "Order Placed"
        return routeParams?.skipInitialScreen ? 'Order Received' : 'Order Placed';
      case 2:
        return 'Awaiting Payment';
      case 3:
        return 'Awaiting Coin Release';
      case 4:
        return 'Order Completed';
      default:
        return '';
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressBar,
              step <= currentStep && styles.progressBarActive,
            ]}
          />
        ))}
      </View>
    );
  };

  // Initial Buy Order Screen
  if (currentStep === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020c19" />

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
            <ThemedText style={styles.headerTitle}>Buy Order</ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              (navigation as any).navigate('Settings', {
                screen: 'Support',
              });
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="headset" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
          {/* Vendor Info Card */}
          {isLoadingAdDetails ? (
            <View style={[styles.vendorCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }]}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading ad details...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.vendorCard}>
              <Image
                source={orderData.vendorAvatar}
                style={styles.vendorAvatar}
                resizeMode="cover"
              />
              <View style={styles.vendorInfo}>
                <ThemedText style={styles.vendorName}>{orderData.vendorName}</ThemedText>
                <ThemedText style={styles.vendorStatus}>{orderData.vendorStatus}</ThemedText>
              </View>
              <ThemedText style={styles.vendorRating}>{orderData.vendorRating}</ThemedText>
            </View>
          )}

          {/* Vendor Rate */}
          <ThemedText style={styles.rateTitle}>Vendor Rate</ThemedText>
          <LinearGradient
            colors={['#FFFFFF0D', '#A9EF4533']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rateCard}
          >
            <View style={styles.rateContent}>
              <View>
                <ThemedText style={styles.rateLabel}>Rate</ThemedText>
                <ThemedText style={styles.rateRefresh}>Refreshes in 1 min</ThemedText>
              </View>
              <ThemedText style={styles.rateValue}>{orderData.rate}</ThemedText>
            </View>
          </LinearGradient>

          {/* Order Details Card */}
          <View style={styles.orderCard}>
            <ThemedText style={styles.orderCardTitle}>Order Details</ThemedText>

            {/* Currency Selectors */}
            <View style={styles.currencySelectors}>
              <TouchableOpacity
                style={[styles.currencySelector, currencyType === 'Fiat' && styles.currencySelectorActive]}
                onPress={() => setCurrencyType('Fiat')}
              >
                <ThemedText style={[styles.currencySelectorText, currencyType === 'Fiat' && styles.currencySelectorTextActive]}>
                  Fiat
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencySelector, currencyType === 'Crypto' && styles.currencySelectorActive]}
                onPress={() => setCurrencyType('Crypto')}
              >
                <ThemedText style={[styles.currencySelectorText, currencyType === 'Crypto' && styles.currencySelectorTextActive]}>
                  Crypto
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Amount Input - Different for Fiat vs Crypto */}
            {currencyType === 'Fiat' ? (
              <>
                <View style={styles.amountSection}>
                  <ThemedText style={styles.amountLabel}>Amount to buy</ThemedText>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => {
                      // Remove commas and spaces
                      const numericValue = text.replace(/,/g, '').replace(/\s/g, '');
                      // Allow empty, digits, and one decimal point
                      if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
                        // Format with commas for display
                        const parts = numericValue.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setAmount(parts.join('.'));
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Input amount"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                  <View style={styles.balanceRow}>
                    <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                    <ThemedText style={styles.balanceValue}>NGN 0.00</ThemedText>
                  </View>
                </View>

                {/* You will Receive */}
                <View style={styles.receiveSection}>
                  <ThemedText style={styles.receiveLabel}>You will Receive</ThemedText>
                  <View style={styles.receiveValueContainer}>
                    <ThemedText style={styles.receiveValue}>0.00 USDT</ThemedText>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.amountSection}>
                  <ThemedText style={styles.amountLabel}>Enter USDT Amount</ThemedText>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => {
                      // Remove commas and spaces
                      const numericValue = text.replace(/,/g, '').replace(/\s/g, '');
                      // Allow empty, digits, and one decimal point
                      if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
                        // Format with commas for display
                        const parts = numericValue.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setAmount(parts.join('.'));
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Input amount"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                  <View style={styles.balanceRow}>
                    <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                    <ThemedText style={styles.balanceValue}>USDT 0.00</ThemedText>
                  </View>
                </View>

                {/* You will Pay */}
                <View style={styles.receiveSection}>
                  <ThemedText style={styles.receiveLabel}>You will Pay</ThemedText>
                  <ThemedText style={styles.payValue}>N10,000</ThemedText>
                </View>
              </>
            )}

            {/* Payment Method */}
            <TouchableOpacity
              style={styles.paymentMethodField}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <ThemedText style={[styles.paymentMethodText, !selectedPaymentMethod && styles.placeholder]}>
                {selectedPaymentMethod ? selectedPaymentMethod.name : 'Select payment method'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Buy Button */}
        <TouchableOpacity
          style={[
            styles.buyButton, 
            !isButtonEnabled && styles.buyButtonDisabled
          ]}
          onPress={handleBuy}
          disabled={!isButtonEnabled}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
          )}
        </TouchableOpacity>

        {/* Select Payment Method Modal */}
        <Modal
          visible={showPaymentMethodModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPaymentMethodModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.paymentModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Payment Method</ThemedText>
                <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {(isLoadingAdDetails || isLoadingUserPaymentMethods) ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                    Loading payment methods...
                  </ThemedText>
                </View>
              ) : paymentMethods.length > 0 ? (
                <>
                  <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search payment method"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                  </View>

                  <ScrollView style={styles.paymentMethodList} showsVerticalScrollIndicator={false}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={styles.paymentMethodItem}
                        onPress={() => handlePaymentMethodSelect(method)}
                      >
                        <ThemedText style={styles.paymentMethodItemText}>{method.name}</ThemedText>
                        {tempSelectedPaymentMethod?.id === method.id ? (
                          <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                        ) : (
                          <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.applyButtonContainer}>
                    <TouchableOpacity
                      style={[styles.applyButton, !tempSelectedPaymentMethod && styles.applyButtonDisabled]}
                      onPress={handleApplyPaymentMethod}
                      disabled={!tempSelectedPaymentMethod}
                    >
                      <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', marginBottom: 10 }}>
                    {!adId 
                      ? 'Please select an ad first to view payment methods'
                      : (adDetailsError || (isLoadingAdDetails && isLoadingUserPaymentMethods))
                      ? 'Error loading payment methods. Please try again.'
                      : 'No payment methods available. Please add payment methods in Settings or ensure the ad has payment methods configured.'}
                  </ThemedText>
                  {(adDetailsError || (!isLoadingAdDetails && !isLoadingUserPaymentMethods && paymentMethods.length === 0)) && (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {adId && (
                        <TouchableOpacity
                          style={{ padding: 10, backgroundColor: '#A9EF45', borderRadius: 8 }}
                          onPress={() => {
                            refetchAdDetails();
                            refetchUserPaymentMethods();
                          }}
                        >
                          <ThemedText style={{ color: '#000000', fontSize: 12 * SCALE, fontWeight: '500' }}>
                            Retry
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{ padding: 10 }}
                        onPress={() => {
                          setShowPaymentMethodModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'PaymentSettings',
                          });
                        }}
                      >
                        <ThemedText style={{ color: '#A9EF45', fontSize: 12 * SCALE }}>
                          Add Payment Method
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Order Flow Screen (Steps 1-4)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep((prev) => (prev - 1) as typeof currentStep);
            } else if (currentStep === 1 && routeParams?.skipInitialScreen) {
              // If coming from AdDetails and on step 1, go back to AdDetails
              navigation.goBack();
            } else if (currentStep > 0) {
              setCurrentStep((prev) => (prev - 1) as typeof currentStep);
            } else {
              navigation.goBack();
            }
          }}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>
            USDT Buy Ad
          </ThemedText>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Progress Indicator - Only show in order flow */}
      {currentStep > 0 && renderProgressIndicator()}

      {/* Status and Amount - Only show in order flow */}
      {currentStep > 0 && (
        <View style={styles.statusSection}>
          <ThemedText style={styles.statusText}>{getStepStatus()}</ThemedText>
          <View style={styles.amountSectionHeader}>
            <ThemedText style={styles.amountText}>{orderData.usdtAmount}</ThemedText>
            <TouchableOpacity style={styles.openChatButton}>
              <ThemedText style={styles.openChatText}>Open Chat</ThemedText>
              {currentStep === 2 && <View style={styles.chatNotificationDot} />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        {/* Loading indicator for order details */}
        {currentStep > 0 && isLoadingOrderDetails && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="small" color="#A9EF45" />
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
              Loading order details...
            </ThemedText>
          </View>
        )}

        {/* Order Details Card - Only show in order flow */}
        {currentStep > 0 && !isLoadingOrderDetails && (
          <View style={styles.orderDetailsCard}>
            <ThemedText style={styles.orderDetailsTitle}>Order Details</ThemedText>
            <View style={styles.orderDetailsContent}>
              <View style={[styles.detailRow, { borderTopRightRadius: 10, borderTopLeftRadius: 10, borderBottomWidth: 1, }]}>
                <ThemedText style={styles.detailLabel}>Buyer name</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.buyerName}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Amount to be paid</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.amountToBePaid}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Payment Account</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.paymentAccount}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Price</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.price}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Tx id</ThemedText>
                <View style={styles.txIdRow}>
                  <ThemedText style={styles.detailValue}>{orderData.txId}</ThemedText>
                  <TouchableOpacity onPress={handleCopyTxId} style={styles.copyButton}>
                    <MaterialCommunityIcons name="content-copy" size={14 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <ThemedText style={styles.detailLabel}>Order time</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.orderTime}</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Payment Account Card (All Steps) */}
        {currentStep >= 1 && !isLoadingOrderDetails && (
          <View style={styles.paymentAccountCard}>
            <View style={styles.paymentAccountHeader}>
              <View style={styles.paymentAccountHeaderLeft}>
                <ThemedText style={styles.paymentAccountTitle}>Payment Account</ThemedText>
                <ThemedText style={styles.paymentAccountSubtitle}>
                  {(selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2')
                    ? 'Pay via Rhinoxpay id'
                    : 'Pay to the account below'}
                </ThemedText>
              </View>
              {/* Only show Pay Now button when order status is awaiting_payment (step 2) - vendor has accepted */}
              {(selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2') && 
               (orderDetailsData?.data?.status === 'awaiting_payment' || currentStep === 2) && (
                <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
                  <ThemedText style={styles.payNowButtonText}>Pay Now</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            {/* RhinoxPay ID Payment Method */}
            {(selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2' || selectedPaymentMethod?.type === 'rhinoxpay_id') ? (
              <View style={styles.rhinoxPayCard}>
                <ThemedText style={styles.rhinoxPayLabel}>Rhinoxpay ID</ThemedText>
                <ThemedText style={styles.rhinoxPayValue}>
                  {orderData?.rhinoxPayId || 
                   selectedPaymentMethod?.paymentMethodData?.rhinoxpayId || 
                   selectedPaymentMethod?.paymentMethodData?.accountNumber ||
                   adDetailsData?.data?.paymentMethods?.find((pm: any) => pm.type === 'rhinoxpay_id')?.rhinoxpayId ||
                   adDetailsData?.data?.paymentMethods?.find((pm: any) => pm.type === 'rhinoxpay_id')?.accountNumber ||
                   'N/A'}
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.amountToPaySection}>
                  <ThemedText style={styles.amountToPayLabel}>Amount to pay</ThemedText>
                  <ThemedText style={styles.amountToPayValue}>{orderData.amountToPay}</ThemedText>
                </View>
                <View style={styles.paymentAccountDetails}>
                  <View style={[styles.detailRow, { borderTopRightRadius: 10, borderTopLeftRadius: 10, borderBottomWidth: 1, }]}>
                    <ThemedText style={styles.detailLabel}>Bank Name</ThemedText>
                    <ThemedText style={styles.detailValue}>{orderData.bankName}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
                    <View style={styles.accountNumberRow}>
                      <ThemedText style={styles.detailValue}>{orderData.accountNumber}</ThemedText>
                      <TouchableOpacity onPress={handleCopyAccountNumber} style={styles.copyButton}>
                        <MaterialCommunityIcons name="content-copy" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <ThemedText style={styles.detailLabel}>Account Name</ThemedText>
                    <ThemedText style={styles.detailValue}>{orderData.accountName}</ThemedText>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Review Section (Step 4 only) */}
        {currentStep === 4 && (
          <View style={styles.reviewCard}>
            <ThemedText style={styles.reviewTitle}>Leave a review</ThemedText>
            <ThemedText style={styles.reviewSubtitle}>How was your order</ThemedText>
            <View style={styles.reviewRatingButtons}>
              <TouchableOpacity
                style={[styles.ratingButton, reviewRating === 'positive' && styles.ratingButtonActive, { borderWidth: 0.5, borderColor: '#A9EF45' }]}
                onPress={() => setReviewRating('positive')}
              >
                <View style={styles.ratingButtonInner}>
                  <Image
                    source={require('../../../assets/Group 41.png')}
                    style={styles.ratingIcon}
                    resizeMode="contain"
                  />
                  {reviewRating === 'positive' && <View style={styles.ratingBorder} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, reviewRating === 'negative' && styles.ratingButtonActiveNegative, { borderWidth: 0.5, borderColor: '#FF0000' }]}
                onPress={() => setReviewRating('negative')}
              >
                <View style={styles.ratingButtonInner}>
                  <Image
                    source={require('../../../assets/Group 41 (1).png')}
                    style={styles.ratingIcon}
                    resizeMode="contain"
                  />
                  {reviewRating === 'negative' && <View style={styles.ratingBorderNegative} />}
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.reviewInputContainer}>
              <TextInput
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                placeholder="Enter your review"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.editButton}>
                  <Image
                    source={require('../../../assets/PencilSimpleLine (1).png')}
                    style={styles.actionIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Image
                    source={require('../../../assets/TrashSimple.png')}
                    style={styles.actionIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendReview}>
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {currentStep === 1 && (
        <View style={styles.actionButtonsContainer}>
          {routeParams?.skipInitialScreen ? (
            // If coming from AdDetails, show "Accept Order" button
            <>
              <TouchableOpacity
                style={styles.awaitingButton}
                onPress={handleAcceptOrder}
              >
                <ThemedText style={styles.awaitingButtonText}>Accept Order</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            // Otherwise, show countdown button
            <>
              <TouchableOpacity
                style={styles.awaitingButton}
                onPress={handleAwaitingButton}
              >
                <ThemedText style={styles.awaitingButtonText}>
                  Awaiting {formatCountdown(countdown)} min
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.paymentMadeButton,
              (markPaymentMadeMutation.isPending || !orderId) && styles.paymentMadeButtonDisabled
            ]} 
            onPress={handlePaymentMade}
            disabled={markPaymentMadeMutation.isPending || !orderId}
          >
            {markPaymentMadeMutation.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.paymentMadeButtonText}>Payment Made</ThemedText>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.appealButton}>
            <ThemedText style={styles.appealButtonText}>Appeal</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 3 && (
        <TouchableOpacity style={styles.appealOrderButton}>
          <ThemedText style={styles.appealOrderButtonText}>Appeal Order</ThemedText>
        </TouchableOpacity>
      )}

      {currentStep === 4 && (
        <TouchableOpacity style={styles.closeButton}>
          <ThemedText style={styles.closeButtonText}>Close</ThemedText>
        </TouchableOpacity>
      )}

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.warningModalOverlay}>
          <View style={styles.warningModalContent}>
            <View style={styles.warningIconContainer}>
              <View style={styles.warningIconCircle}>
                <MaterialCommunityIcons name="check" size={40 * SCALE} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText style={styles.warningTitle}>Warning</ThemedText>
            <TouchableOpacity style={styles.confirmationCheckbox}>
              <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
              <ThemedText style={styles.confirmationText}>I confirm that i have made payment for this order</ThemedText>
            </TouchableOpacity>
            <View style={styles.warningModalButtons}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleWarningComplete}
              >
                <ThemedText style={styles.completeButtonText}>Complete</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowWarningModal(false)}
              >
                <ThemedText style={styles.cancelModalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
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
              <ThemedText style={styles.pinInstruction}>Input Pin to Complete p2p Transaction</ThemedText>
              <ThemedText style={styles.pinAmount}>
                {(() => {
                  // If we have order details, use that amount
                  if (orderDetailsData?.data?.fiatAmount) {
                    return `${orderDetailsData.data.fiatCurrency || 'NGN'}${orderDetailsData.data.fiatAmount}`;
                  }
                  // If we have orderData amountToPay, use that
                  if (orderData.amountToPay && orderData.amountToPay !== 'N0') {
                    return orderData.amountToPay;
                  }
                  // Otherwise, calculate from entered amount and currency type
                  if (amount) {
                    const numericAmount = amount.replace(/,/g, '').replace(/\s/g, '');
                    if (currencyType === 'Fiat') {
                      return `NGN${numericAmount}`;
                    } else {
                      // If crypto, calculate fiat equivalent
                      const adPrice = parseFloat(adDetailsData?.data?.price || '0');
                      if (adPrice > 0) {
                        const fiatAmount = parseFloat(numericAmount) * adPrice;
                        return `${adDetailsData?.data?.fiatCurrency || 'NGN'}${fiatAmount.toFixed(2)}`;
                      }
                    }
                  }
                  return 'N0';
                })()}
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
                  <View style={[
                    styles.ghostCircle,
                    isScanning && styles.ghostCircleScanning
                  ]}>
                    {isScanning ? (
                      <ActivityIndicator size="small" color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons 
                        name="fingerprint" 
                        size={24 * SCALE} 
                        color={isBiometricAvailable ? "#A9EF45" : "rgba(169, 239, 69, 0.3)"} 
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
              style={[
                styles.proceedButton, 
                (!emailCode || !authenticatorCode || markPaymentMadeMutation.isPending) && styles.proceedButtonDisabled
              ]}
              onPress={handleSecurityProceed}
              disabled={!emailCode || !authenticatorCode || markPaymentMadeMutation.isPending}
            >
              {markPaymentMadeMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RhinoxPay Payment Modal */}
      <Modal
        visible={showRhinoxPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRhinoxPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rhinoxPayModalContent}>
            <View style={styles.rhinoxPayModalHeader}>
              <ThemedText style={styles.rhinoxPayModalTitle}>Pay via rhinoxpay</ThemedText>
              <TouchableOpacity onPress={() => setShowRhinoxPayModal(false)}>
                <View style={styles.closeIconCircle}>
                  <MaterialCommunityIcons name="close" size={20 * SCALE} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.rhinoxPayModalScroll} showsVerticalScrollIndicator={false}>
              {/* Select Currency Section */}
              <View style={styles.selectCurrencySection}>
                <ThemedText style={styles.selectCurrencyLabel}>Select Currency</ThemedText>
                <LinearGradient
                  colors={['#FFFFFF0D', '#A9EF4533']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.balanceCard}
                >
                  <View style={styles.balanceCardLeft}>
                    <ThemedText style={styles.myBalanceLabel}>My Balance</ThemedText>
                    <View style={styles.balanceAmountRow}>
                      <Image
                        source={require('../../../assets/Vector (34).png')}
                        style={[{ marginBottom: -1, width: 18, height: 16 }]}
                        resizeMode="cover"
                      />
                      <ThemedText style={styles.balanceAmount}>N200,000</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.currencySelectorButton}
                    onPress={() => setShowCountryModal(true)}
                  >
                    {(() => {
                      const countries = [
                        { id: 1, flag: require('../../../assets/login/nigeria-flag.png') },
                        { id: 2, flag: require('../../../assets/login/south-africa-flag.png') },
                        { id: 3, flag: require('../../../assets/login/nigeria-flag.png') },
                        { id: 4, flag: require('../../../assets/login/south-africa-flag.png') },
                        { id: 5, flag: require('../../../assets/login/south-africa-flag.png') },
                        { id: 6, flag: require('../../../assets/login/nigeria-flag.png') },
                        { id: 7, flag: require('../../../assets/login/south-africa-flag.png') },
                      ];
                      const selectedCountryData = countries.find(c => c.id === selectedCountry) || countries[0];
                      return (
                        <Image
                          source={selectedCountryData.flag}
                          style={styles.currencyFlag}
                          resizeMode="contain"
                        />
                      );
                    })()}
                    <ThemedText style={styles.currencySelectorTextModal}>{selectedCountryName}</ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Rhinox Pay ID Section */}
              <View style={styles.rhinoxPayIdSection}>
                <ThemedText style={styles.rhinoxPayIdLabel}>Rhinox Pay ID</ThemedText>
                <View style={styles.rhinoxPayIdInput}>
                  <ThemedText style={styles.rhinoxPayIdPlaceholder}>Rhinoxpay ID</ThemedText>
                  <ThemedText style={styles.rhinoxPayIdValue}>
                    {orderData?.rhinoxPayId || 
                     selectedPaymentMethod?.paymentMethodData?.rhinoxpayId || 
                     selectedPaymentMethod?.paymentMethodData?.accountNumber ||
                     adDetailsData?.data?.paymentMethods?.find((pm: any) => pm.type === 'rhinoxpay_id')?.rhinoxpayId ||
                     adDetailsData?.data?.paymentMethods?.find((pm: any) => pm.type === 'rhinoxpay_id')?.accountNumber ||
                     'N/A'}
                  </ThemedText>
                </View>
                <View style={styles.amountToPaySectionModal}>
                <ThemedText style={styles.amountToPayLabelModal}>Amount to Pay</ThemedText>
                <View style={styles.amountToPayInput}>
                  <ThemedText style={styles.amountToPayValueModal}>
                    {orderData?.amountToPay ? orderData.amountToPay.replace(/[^0-9,.]/g, '') : rhinoxPayAmount}
                  </ThemedText>
                </View>
              </View>
              </View>

              {/* Amount to Pay Section */}
            
            </ScrollView>

            <View style={styles.rhinoxPayModalFooter}>
              <TouchableOpacity style={styles.proceedButtonRhinoxPay} onPress={handleRhinoxPayProceed}>
                <ThemedText style={styles.proceedButtonRhinoxPayText}>Proceed</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Code Verification Modal */}
      <Modal
        visible={showEmailCodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pinModalContent}>
            <View style={styles.pinModalHeader}>
              <ThemedText style={styles.pinModalTitle}>Verify Transfer</ThemedText>
              <TouchableOpacity onPress={() => setShowEmailCodeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.pinModalBody}>
              <ThemedText style={styles.pinModalSubtitle}>
                Enter the verification code sent to your email and your PIN
              </ThemedText>
              
              {/* Email Code Input */}
              <View style={styles.emailCodeInputContainer}>
                <ThemedText style={styles.emailCodeLabel}>Email Verification Code</ThemedText>
                <TextInput
                  style={styles.emailCodeInput}
                  value={emailCode}
                  onChangeText={setEmailCode}
                  placeholder="Enter code"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* PIN Input */}
              <View style={styles.pinInputContainer}>
                <ThemedText style={styles.pinLabel}>Enter PIN</ThemedText>
                <View style={styles.pinDotsContainer}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.pinDot,
                        pin.length > index && styles.pinDotFilled,
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.numpad}>
                  <View style={styles.numpadRow}>
                    {[1, 2, 3].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={styles.numpadButton}
                        onPress={() => handlePinPress(num.toString())}
                      >
                        <View style={styles.numpadCircle}>
                          <ThemedText style={styles.numpadText}>{num}</ThemedText>
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
                        <View style={styles.numpadCircle}>
                          <ThemedText style={styles.numpadText}>{num}</ThemedText>
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
                        <View style={styles.numpadCircle}>
                          <ThemedText style={styles.numpadText}>{num}</ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.numpadRow}>
                    <View style={styles.numpadButton} />
                    <TouchableOpacity
                      style={styles.numpadButton}
                      onPress={() => handlePinPress('0')}
                    >
                      <View style={styles.numpadCircle}>
                        <ThemedText style={styles.numpadText}>0</ThemedText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.numpadButton}
                      onPress={handlePinBackspace}
                    >
                      <View style={styles.numpadCircle}>
                        <MaterialCommunityIcons name="backspace" size={24 * SCALE} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  (!emailCode || !pin || pin.length !== 5 || verifyTransferMutation.isPending) && styles.proceedButtonDisabled
                ]}
                onPress={handleEmailCodeVerify}
                disabled={!emailCode || !pin || pin.length !== 5 || verifyTransferMutation.isPending}
              >
                {verifyTransferMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.proceedButtonText}>Verify & Complete</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={60 * SCALE} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.successTitle}>Complete</ThemedText>
            <ThemedText style={styles.successMessage}>
              You have successfully sent N10,000 from your Rhinoxpay NGN wallet
            </ThemedText>
            <View style={styles.successModalButtons}>
              <TouchableOpacity style={styles.viewTransactionButton} onPress={handleSuccessModalClose}>
                <ThemedText style={styles.viewTransactionButtonText}>View Transaction</ThemedText>
              </TouchableOpacity>
              <View style={styles.successModalButtonDivider} />
              <TouchableOpacity style={styles.cancelSuccessButton} onPress={handleSuccessModalClose}>
                <ThemedText style={styles.cancelSuccessButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
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
          <View style={styles.countryModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryModalList} showsVerticalScrollIndicator={false}>
              {[
                { id: 1, name: 'Nigeria', flag: require('../../../assets/login/nigeria-flag.png') },
                { id: 2, name: 'Botswana', flag: require('../../../assets/login/south-africa-flag.png') },
                { id: 3, name: 'Ghana', flag: require('../../../assets/login/nigeria-flag.png') },
                { id: 4, name: 'Kenya', flag: require('../../../assets/login/south-africa-flag.png') },
                { id: 5, name: 'South Africa', flag: require('../../../assets/login/south-africa-flag.png') },
                { id: 6, name: 'Tanzania', flag: require('../../../assets/login/nigeria-flag.png') },
                { id: 7, name: 'Uganda', flag: require('../../../assets/login/south-africa-flag.png') },
              ].map((country) => {
                const isSelected = selectedCountry === country.id;
                return (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(country.id);
                      setSelectedCountryName(country.name);
                      setShowCountryModal(false);
                    }}
                  >
                    <Image
                      source={country.flag}
                      style={styles.countryFlagModal}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.countryName}>{country.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.countryModalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowCountryModal(false)}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BuyOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 100 * SCALE,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20 * SCALE,
    marginBottom: 10 * SCALE,
    gap: 10 * SCALE,
  },
  progressBar: {
    flex: 1,
    height: 7 * SCALE,
    borderRadius: 3.5 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarActive: {
    backgroundColor: '#A9EF45',
  },
  statusSection: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  statusText: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  amountSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountText: {
    fontSize: 40 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  openChatButton: {
    borderWidth: 1,
    borderColor: '#A9EF45',
    borderRadius: 17.5 * SCALE,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 6.5 * SCALE,
    position: 'relative',
  },
  openChatText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  chatNotificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9 * SCALE,
    height: 9 * SCALE,
    borderRadius: 4.5 * SCALE,
    backgroundColor: '#FF0000',
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15 * SCALE,
    marginBottom: 20 * SCALE,
  },
  vendorAvatar: {
    width: 35 * SCALE,
    height: 35 * SCALE,
    borderRadius: 17.5 * SCALE,
    marginRight: 12 * SCALE,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  vendorStatus: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  vendorRating: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  rateCard: {
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15 * SCALE,
    marginBottom: 20 * SCALE,
    overflow: 'hidden',
  },
  rateTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  rateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  rateRefresh: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  rateValue: {
    fontSize: 24 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  orderCardTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  currencySelectors: {
    flexDirection: 'row',
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 8 * SCALE,
    gap: 4 * SCALE,
  },
  currencySelectorActive: {
    backgroundColor: '#FFFFFF',
  },
  currencySelectorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  currencySelectorTextActive: {
    color: '#000000',
  },
  amountSection: {
    marginBottom: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    // padding: 10 * SCALE,
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  amountLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6 * SCALE,
    textAlign: 'center',
    marginTop: 10 * SCALE,
  },
  amountInput: {
    fontSize: 24 * SCALE,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
    minHeight: 30 * SCALE,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    padding: 10 * SCALE,
    borderBottomRightRadius: 10 * SCALE,
    borderBottomLeftRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  balanceValue: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  receiveSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    padding: 10 * SCALE,
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  receiveLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  receiveValueContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 6 * SCALE,
  },
  receiveValue: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  payValue: {
    fontSize: 12 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMethodField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 11 * SCALE,
    height: 60 * SCALE,
  },
  paymentMethodText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
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
  // Order Details Styles
  orderDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14 * SCALE,
    paddingTop: 14 * SCALE,
    paddingBottom: 0,
    marginBottom: 20 * SCALE,
  },
  orderDetailsTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 18 * SCALE,
  },
  orderDetailsContent: {
    gap: 0,
    paddingBottom: 10 * SCALE,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16 * SCALE,
    borderBottomWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF0D',
    paddingHorizontal: 14 * SCALE,
  },
  detailRowLast: {
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomRightRadius: 10 * SCALE,
    borderBottomLeftRadius: 10 * SCALE,
  },
  detailLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  detailValue: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  txIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  copyButton: {
    padding: 2 * SCALE,
  },
  // Payment Account Card Styles
  paymentAccountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14 * SCALE,
    paddingTop: 14 * SCALE,
    paddingBottom: 14 * SCALE,
    // paddingBottom: 0,
    marginBottom: 20 * SCALE,
  },
  paymentAccountHeader: {
    marginBottom: 20 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentAccountHeaderLeft: {
    flex: 1,
  },
  paymentAccountTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  paymentAccountSubtitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  payNowButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 10 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  amountToPaySection: {
    alignItems: 'center',
    marginBottom: 20 * SCALE,
    paddingVertical: 15 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    // marginHorizontal: 5 * SCALE,
    marginTop: 6 * SCALE,
  },
  amountToPayLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  amountToPayValue: {
    fontSize: 32 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentAccountDetails: {
    gap: 0,
    paddingTop: 20 * SCALE,
  },
  // RhinoxPay ID Card Styles
  rhinoxPayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20 * SCALE,
  },
  rhinoxPayLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rhinoxPayValue: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    gap: 10 * SCALE,
  },
  awaitingButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  paymentMadeButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMadeButtonDisabled: {
    opacity: 0.5,
  },
  paymentMadeButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  appealButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 25 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appealButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  appealOrderButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appealOrderButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  // Warning Modal Styles
  warningModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningModalContent: {
    backgroundColor: '#020c19',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    alignItems: 'center',
    marginHorizontal: 20 * SCALE,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  warningIconContainer: {
    marginBottom: 20 * SCALE,
  },
  warningIconCircle: {
    width: 84 * SCALE,
    height: 84 * SCALE,
    borderRadius: 42 * SCALE,
    backgroundColor: '#FFA500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 20 * SCALE,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 20 * SCALE,
  },
  confirmationCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30 * SCALE,
    gap: 12 * SCALE,
  },
  confirmationText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    flex: 1,
  },
  warningModalButtons: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    // paddingTop: 20 * SCALE,
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
    borderRightWidth: 0.3,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  completeButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  cancelModalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
  },
  cancelModalButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
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
  ghostCircleScanning: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
  },
  backspaceSquare: {
    width: 53 * SCALE,
    height: 53 * SCALE,
    borderRadius: 26.5 * SCALE,
    backgroundColor: '#000914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Security Verification Modal Styles
  securityModalContent: {
    backgroundColor: '#020c19',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 30 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    maxHeight: '90%',
  },
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
  // Review Section Styles
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  reviewTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  reviewSubtitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 20 * SCALE,
  },
  reviewRatingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 23 * SCALE,
    marginBottom: 20 * SCALE,
  },
  ratingButton: {
    width: 48 * SCALE,
    height: 48 * SCALE,
    borderRadius: 24 * SCALE,
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ratingButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ratingIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  ratingBorder: {
    position: 'absolute',
    width: 48 * SCALE,
    height: 48 * SCALE,
    borderRadius: 24 * SCALE,
    borderWidth: 2 * SCALE,
    borderColor: '#A9EF45',
  },
  ratingBorderNegative: {
    position: 'absolute',
    width: 48 * SCALE,
    height: 48 * SCALE,
    borderRadius: 24 * SCALE,
    borderWidth: 2 * SCALE,
    borderColor: '#FF0000',
  },
  ratingButtonActive: {
    backgroundColor: '#A9EF45',
  },
  ratingButtonActiveNegative: {
    backgroundColor: '#FF0000',
  },
  reviewInputContainer: {
    marginBottom: 20 * SCALE,
    position: 'relative',
  },
  reviewInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
    minHeight: 118 * SCALE,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlignVertical: 'top',
  },
  reviewActions: {
    position: 'absolute',
    bottom: 14 * SCALE,
    right: 14 * SCALE,
    flexDirection: 'row',
    gap: 15 * SCALE,
  },
  editButton: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  deleteButton: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  actionIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  sendButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 17.5 * SCALE,
    paddingHorizontal: 27 * SCALE,
    paddingVertical: 12 * SCALE,
    alignSelf: 'flex-start',
  },
  sendButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  // RhinoxPay Modal Styles
  rhinoxPayModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    maxHeight: '60%',
    flex: 1,
  },
  rhinoxPayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  rhinoxPayModalTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  closeIconCircle: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rhinoxPayModalScroll: {
    flex: 1,
    paddingHorizontal: 20 * SCALE,
  },
  selectCurrencySection: {
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  selectCurrencyLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  balanceCard: {
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  balanceCardLeft: {
    flex: 1,
  },
  myBalanceLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8 * SCALE,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  balanceAmount: {
    fontSize: 20 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
  },
  currencySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
  },
  currencyFlag: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  currencySelectorTextModal: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  rhinoxPayIdSection: {
    marginBottom: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15 * SCALE,
  },
  rhinoxPayIdLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  rhinoxPayIdInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 1,
    borderColor: '#A9EF45',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rhinoxPayIdPlaceholder: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  rhinoxPayIdValue: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  amountToPaySectionModal: {
    marginBottom: 20 * SCALE,
    marginTop: 20 * SCALE,
  },
  amountToPayLabelModal: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  amountToPayInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
  },
  amountToPayValueModal: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  rhinoxPayModalFooter: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  proceedButtonRhinoxPay: {
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  proceedButtonRhinoxPayText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  // Email Code Verification Styles
  emailCodeInputContainer: {
    marginBottom: 20 * SCALE,
  },
  emailCodeLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  emailCodeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pinInputContainer: {
    marginBottom: 20 * SCALE,
  },
  pinLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12 * SCALE,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12 * SCALE,
    marginBottom: 20 * SCALE,
  },
  pinDot: {
    width: 12 * SCALE,
    height: 12 * SCALE,
    borderRadius: 6 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pinDotFilled: {
    backgroundColor: '#A9EF45',
    borderColor: '#A9EF45',
  },
  pinModalBody: {
    padding: 20 * SCALE,
  },
  pinModalSubtitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24 * SCALE,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#020c19',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30 * SCALE,
    paddingBottom: 20 * SCALE,
    alignItems: 'center',
    marginHorizontal: 20 * SCALE,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  successIconCircle: {
    width: 100 * SCALE,
    height: 100 * SCALE,
    borderRadius: 50 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20 * SCALE,
  },
  successTitle: {
    fontSize: 24 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
    marginBottom: 15 * SCALE,
  },
  successMessage: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30 * SCALE,
    paddingHorizontal: 10 * SCALE,
  },
  successModalButtons: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewTransactionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    borderRightWidth: 0.3,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewTransactionButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  successModalButtonDivider: {
    width: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelSuccessButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
  },
  cancelSuccessButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  // Country Modal Styles
  countryModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    padding: 10 * SCALE,
    maxHeight: '80%',
  },
  countryModalList: {
    maxHeight: 390 * SCALE,
    padding: 10 * SCALE,
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
  countryFlagModal: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
    marginRight: 15 * SCALE,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  countryModalFooter: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
});

