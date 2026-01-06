import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { showSuccessAlert, showErrorAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface OrderStep {
  step: 1 | 2 | 3 | 4;
  status: 'Order Placed' | 'Awaiting Payment' | 'Awaiting Coin Release' | 'Order Completed';
}

const SellOrderFlow = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as { 
    amount?: string; 
    assetAmount?: string;
    selectedPaymentMethod?: PaymentMethod;
    skipInitialScreen?: boolean;
    orderId?: string;
    paymentMethod?: string;
  } | undefined;
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [currencyType, setCurrencyType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [amount, setAmount] = useState(routeParams?.amount || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(routeParams?.selectedPaymentMethod || null);
  const [tempSelectedPaymentMethod, setTempSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [reviewRating, setReviewRating] = useState<'positive' | 'negative' | null>(null);
  const [reviewText, setReviewText] = useState('He is fast and reliable.');

  // PIN states
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);

  // Security verification states
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');

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

  // Auto-advance to step 3 after 4 seconds when in step 2
  useEffect(() => {
    if (currentStep === 2) {
      const timer = setTimeout(() => {
        setCurrentStep(3);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Mock payment methods - TODO: Replace with API call
  const paymentMethods: PaymentMethod[] = [
    { id: '1', name: 'All', type: 'all' },
    { id: '2', name: 'RhinoxPay ID', type: 'rhinoxpay' },
    { id: '3', name: 'Bank Transfer', type: 'bank' },
    { id: '4', name: 'Mobile Money', type: 'mobile' },
    { id: '5', name: 'Opay', type: 'bank' },
    { id: '6', name: 'Palmpay', type: 'bank' },
    { id: '7', name: 'Kuda Bank', type: 'bank' },
    { id: '8', name: 'Access Bank', type: 'bank' },
    { id: '9', name: 'Ec Bank', type: 'bank' },
  ];

  // Set default payment method if coming from AdDetails (after paymentMethods is defined)
  React.useEffect(() => {
    if (routeParams?.skipInitialScreen && routeParams?.paymentMethod && !selectedPaymentMethod) {
      const method = paymentMethods.find(m => m.name === routeParams.paymentMethod);
      if (method) {
        setSelectedPaymentMethod(method);
      }
    }
  }, [routeParams?.skipInitialScreen, routeParams?.paymentMethod]);

  // Mock order data - TODO: Replace with API call
  // Use route params if available (from AdDetails), otherwise use default values
  const orderData = {
    vendorName: 'Qamar Malik',
    vendorAvatar: require('../../../assets/login/memoji.png'),
    vendorStatus: 'Online',
    vendorRating: '98%',
    rate: 'N1,520',
    buyerName: 'Lawal Afeez',
    amountToBePaid: '25,000',
    paymentAccount: routeParams?.paymentMethod || 'Bank Transfer',
    price: '1,500 NGN',
    txId: '128DJ2I3I1DJKQKCM',
    orderTime: 'Oct 16, 2025 - 07:22AM',
    amountToPay: routeParams?.amount ? `N${routeParams.amount.replace(/[^0-9]/g, '')}` : 'N20,000',
    bankName: 'Opay',
    accountNumber: '1234567890',
    accountName: 'Qamardeen Abdul Malik',
    usdtAmount: routeParams?.assetAmount || '15 USDT',
  };

  const handleSell = () => {
    if (!amount || !selectedPaymentMethod) {
      showErrorAlert('Error', 'Please enter amount and select payment method');
      return;
    }
    // Navigate to order flow screen
    setCurrentStep(1);
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

  const handleReceivedPayment = () => {
    setShowWarningModal(true);
  };

  const handleWarningComplete = () => {
    setShowWarningModal(false);
    // If RhinoxPay ID is selected, skip verification modals and go directly to step 4
    if (selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2') {
      setPaymentConfirmed(true);
      setCurrentStep(4);
    } else {
      setShowPinModal(true);
    }
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
    if (emailCode && authenticatorCode) {
      setShowSecurityModal(false);
      setPaymentConfirmed(true);
      setCurrentStep(3); // Move to Awaiting Coin Release
      // After some time, move to step 4
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

  const getStepStatus = () => {
    switch (currentStep) {
      case 1:
        return 'Order Received';
      case 2:
        return 'Awaiting Payment';
      case 3:
        return 'Payment Made';
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

  // Initial Buy Order Screen - REMOVED (handled in SellOrder.tsx)
  if (false) {
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
          <TouchableOpacity style={styles.backButton}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="headset" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Vendor Info Card */}
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
                      const numericValue = text.replace(/,/g, '');
                      if (numericValue === '' || /^\d+$/.test(numericValue)) {
                        setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                      }
                    }}
                    keyboardType="numeric"
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
                      const numericValue = text.replace(/,/g, '');
                      if (numericValue === '' || /^\d+$/.test(numericValue)) {
                        setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                      }
                    }}
                    keyboardType="numeric"
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
                {selectedPaymentMethod?.name || 'Select payment method'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sell Button */}
        <TouchableOpacity
          style={[styles.buyButton, (!amount || !selectedPaymentMethod) && styles.buyButtonDisabled]}
          onPress={handleSell}
          disabled={!amount || !selectedPaymentMethod}
        >
          <ThemedText style={styles.buyButtonText}>Sell</ThemedText>
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
                <ThemedText style={styles.modalTitle}>Select Bank</ThemedText>
                <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Bank"
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
            USDT Sell Ad
          </ThemedText>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Status and Amount */}
      {(
        <View style={styles.statusSection}>
          <ThemedText style={styles.statusText}>{getStepStatus()}</ThemedText>
          <View style={styles.amountSectionHeader}>
            <ThemedText style={styles.amountText}>{orderData.usdtAmount}</ThemedText>
            <TouchableOpacity 
              style={styles.openChatButton}
              onPress={() => {
                (navigation as any).navigate('Settings', {
                  screen: 'ChatScreen',
                  params: {
                    chatName: orderData.buyerName,
                    chatEmail: 'buyer@example.com',
                    reason: 'P2P Transaction',
                  },
                });
              }}
            >
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
      >
        {/* Order Details Card */}
        {true && (
          <View style={styles.orderDetailsCard}>
            <ThemedText style={styles.orderDetailsTitle}>Order Details</ThemedText>
            <View style={styles.orderDetailsContent}>
              <View style={[styles.detailRow, {borderTopRightRadius:10, borderTopLeftRadius:10, borderBottomWidth:1, }]}>
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
        {currentStep >= 1 && (
          <View style={styles.paymentAccountCard}>
            <View style={styles.paymentAccountHeader}>
              <ThemedText style={styles.paymentAccountTitle}>Payment Account</ThemedText>
              <ThemedText style={styles.paymentAccountSubtitle}>This is the account you selected to receive payment</ThemedText>
            </View>
            {/* RhinoxPay ID Payment Method */}
            {(selectedPaymentMethod?.name === 'RhinoxPay ID' || selectedPaymentMethod?.id === '2') ? (
              <View style={styles.rhinoxPayCard}>
                <ThemedText style={styles.rhinoxPayLabel}>Rhinoxpay ID</ThemedText>
                <ThemedText style={styles.rhinoxPayValue}>NGN1234</ThemedText>
              </View>
            ) : (
              <>
                {/* <View style={styles.amountToPaySection}>
                  <ThemedText style={styles.amountToPayLabel}>Amount to pay</ThemedText>
                  <ThemedText style={styles.amountToPayValue}>{orderData.amountToPay}</ThemedText>
                </View> */}
                <View style={styles.paymentAccountDetails}>
                  <View style={[styles.detailRow, {borderTopRightRadius:10, borderTopLeftRadius:10, borderBottomWidth:1, }]}>
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
                style={[styles.ratingButton, reviewRating === 'positive' && styles.ratingButtonActive, {borderWidth:0.5, borderColor:'#A9EF45'}]}
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
                style={[styles.ratingButton, reviewRating === 'negative' && styles.ratingButtonActiveNegative, {borderWidth:0.5, borderColor:'#FF0000'}]}
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
                  Waiting {formatCountdown(countdown)} min
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
        <TouchableOpacity style={styles.appealOrderButton}>
          <ThemedText style={styles.appealOrderButtonText}>Appeal Order</ThemedText>
        </TouchableOpacity>
      )}

      {currentStep === 3 && (
        <TouchableOpacity style={styles.receivedPaymentButton} onPress={handleReceivedPayment}>
          <ThemedText style={styles.receivedPaymentButtonText}>I have received Payment</ThemedText>
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
              <ThemedText style={styles.pinAmount}>N2,000,000</ThemedText>
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
              style={[styles.proceedButton, (!emailCode || !authenticatorCode) && styles.proceedButtonDisabled]}
              onPress={handleSecurityProceed}
              disabled={!emailCode || !authenticatorCode}
            >
              <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SellOrderFlow;

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
  receivedPaymentButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receivedPaymentButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
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
});

