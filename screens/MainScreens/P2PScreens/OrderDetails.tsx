import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { useGetP2POrderDetails } from '../../../queries/p2p.queries';
import { 
  useAcceptOrder, 
  useDeclineOrder, 
  useCancelVendorOrder,
  useCancelUserOrder,
  useMarkVendorPaymentReceived,
  useMarkVendorPaymentMade,
  useMarkPaymentMade,
  useMarkPaymentReceived,
  useCreateP2PReview,
} from '../../../mutations/p2p.mutations';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentUser } from '../../../queries/auth.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

const OrderDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const routeParams = route.params as { orderId?: string; adId?: string } | undefined;
  const orderId = routeParams?.orderId || '';
  
  // Get current user to determine role
  const { data: currentUserData } = useGetCurrentUser();
  const currentUserId = currentUserData?.data?.user?.id || currentUserData?.data?.id;
  
  // Review state
  const [reviewRating, setReviewRating] = useState<'positive' | 'negative' | null>(null);
  const [reviewText, setReviewText] = useState('He is fast and reliable.');

  // Fetch order details
  const {
    data: orderDetailsData,
    isLoading: isLoadingOrderDetails,
    isError: isOrderDetailsError,
    error: orderDetailsError,
    refetch: refetchOrderDetails,
  } = useGetP2POrderDetails(orderId, {
    enabled: !!orderId,
  } as any);

  // Poll for order updates if order is in progress
  useEffect(() => {
    if (orderId && orderDetailsData?.data) {
      const status = orderDetailsData?.data?.status;
      if (status && ['pending', 'awaiting_payment', 'payment_made'].includes(status)) {
        const interval = setInterval(() => {
          refetchOrderDetails();
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [orderId, orderDetailsData?.data?.status, refetchOrderDetails]);

  // Transform order data
  const orderData = useMemo(() => {
    if (!orderDetailsData || !orderDetailsData.data) return null;
    const order = orderDetailsData.data;
    const vendor = order.vendor || {};
    const buyer = order.buyer || {};
    const paymentMethod = order.paymentMethod || {};

    // Determine user role by comparing current user ID with order participants
    const buyerId = order.buyer?.id ? String(order.buyer.id) : null;
    const sellerId = order.seller?.id ? String(order.seller.id) : null;
    const vendorId = order.vendor?.id ? String(order.vendor.id) : null;
    const userId = currentUserId ? String(currentUserId) : null;
    
    // Use API flags if available, otherwise determine by comparing IDs
    let isUserBuyer = order.isUserBuyer || false;
    let isUserSeller = order.isUserSeller || false;
    
    // If flags are not set, determine by comparing user ID with buyer/seller IDs
    if (!isUserBuyer && !isUserSeller && userId) {
      if (buyerId && buyerId === userId) {
        isUserBuyer = true;
      }
      if (sellerId && sellerId === userId) {
        isUserSeller = true;
      }
    }
    
    // If still not determined, use userAction as fallback
    // userAction: 'buy' = user is buying (user is buyer), 'sell' = user is selling (user is seller)
    if (!isUserBuyer && !isUserSeller && order.userAction) {
      if (order.userAction === 'buy') {
        isUserBuyer = true;
      } else if (order.userAction === 'sell') {
        isUserSeller = true;
      }
    }
    
    // User is vendor if:
    // 1. They are the vendor (vendorId matches userId) AND they're not the buyer or seller
    // 2. OR if they're neither buyer nor seller (viewing someone else's order as vendor)
    // Note: If user is buyer or seller, they're NOT vendor (even if they own the ad)
    let isVendor = false;
    if (userId && vendorId && vendorId === userId) {
      // User is the vendor - but only if they're not also the buyer or seller
      // If user is buyer/seller, they're viewing as user, not vendor
      isVendor = !isUserBuyer && !isUserSeller;
    } else if (!isUserBuyer && !isUserSeller && userId) {
      // User is neither buyer nor seller - they must be viewing as vendor
      isVendor = true;
    }

    // Determine current trading role (Buyer or Seller)
    // This is used to show the correct action buttons
    const isBuyer = isUserBuyer || (isVendor && order.type === 'buy');
    const isSeller = isUserSeller || (isVendor && order.type === 'sell');

    // Get names
    const vendorName = vendor.name || 
      (vendor.firstName && vendor.lastName ? `${vendor.firstName} ${vendor.lastName}` : 
      vendor.firstName || vendor.lastName || 'Vendor');
    
    const buyerName = buyer.name || 
      (buyer.firstName && buyer.lastName ? `${buyer.firstName} ${buyer.lastName}` : 
      buyer.firstName || buyer.lastName || 'Buyer');

    // Format amounts
    const fiatAmount = order.fiatAmount 
      ? parseFloat(order.fiatAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
    const cryptoAmount = order.cryptoAmount 
      ? parseFloat(order.cryptoAmount).toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
      : '0.00000000';

    // Format dates
    const createdAt = order.createdAt 
      ? new Date(order.createdAt).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    // Payment method details
    let paymentAccount = 'N/A';
    let bankName = 'N/A';
    let accountNumber = 'N/A';
    let accountName = 'N/A';

    if (paymentMethod.type === 'bank_account') {
      paymentAccount = paymentMethod.bankName || 'Bank Transfer';
      bankName = paymentMethod.bankName || 'N/A';
      accountNumber = paymentMethod.accountNumber || 'N/A';
      accountName = paymentMethod.accountName || 'N/A';
    } else if (paymentMethod.type === 'mobile_money') {
      paymentAccount = paymentMethod.provider?.name || paymentMethod.providerName || 'Mobile Money';
      bankName = paymentMethod.provider?.name || paymentMethod.providerName || 'N/A';
      accountNumber = paymentMethod.phoneNumber || 'N/A';
      accountName = paymentMethod.accountName || 'N/A';
    } else if (paymentMethod.type === 'rhinoxpay_id' || paymentMethod.type === 'rhinoxpay') {
      paymentAccount = 'RhinoxPay ID';
      bankName = 'RhinoxPay ID';
      accountNumber = paymentMethod.rhinoxpayId || paymentMethod.accountNumber || 'N/A';
      accountName = vendorName || buyerName;
    }

    return {
      id: order.id,
      status: order.status || 'pending',
      type: order.type || 'buy',
      userAction: order.userAction || 'buy',
      cryptoCurrency: order.cryptoCurrency || 'USDT',
      fiatCurrency: order.fiatCurrency || 'NGN',
      cryptoAmount: `${cryptoAmount} ${order.cryptoCurrency || 'USDT'}`,
      fiatAmount: `${order.fiatCurrency || 'NGN'}${fiatAmount}`,
      price: `${order.fiatCurrency || 'NGN'}${parseFloat(order.price || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      vendorName,
      buyerName,
      paymentAccount,
      bankName,
      accountNumber,
      accountName,
      createdAt,
      paymentMethod,
      isUserBuyer,
      isUserSeller,
      isVendor,
      isBuyer,
      isSeller,
      adId: order.adId,
      paymentChannel: order.paymentChannel || 'offline',
      rawData: order,
    };
  }, [orderDetailsData?.data, currentUserId]);

  // Determine current step based on order status
  const currentStep = useMemo(() => {
    if (!orderData) return 0;
    const status = orderData.status;
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
      default:
        return 1;
    }
  }, [orderData?.status]);

  // Mutations
  const acceptMutation = useAcceptOrder({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Order accepted');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to accept order');
    },
  });

  const declineMutation = useDeclineOrder({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Order declined');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to decline order');
    },
  });

  const cancelVendorMutation = useCancelVendorOrder({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Order cancelled');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to cancel order');
    },
  });

  const cancelUserMutation = useCancelUserOrder({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Order cancelled');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to cancel order');
    },
  });

  const markVendorPaymentMadeMutation = useMarkVendorPaymentMade({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Payment confirmed. Waiting for seller to release crypto.');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to confirm payment made');
    },
  });

  const markVendorPaymentReceivedMutation = useMarkVendorPaymentReceived({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Payment confirmed. Crypto will be released to buyer.');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to confirm payment received');
    },
  });

  const markPaymentMadeMutation = useMarkPaymentMade({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Payment confirmed. Waiting for coin release.');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to confirm payment');
    },
  });

  const markPaymentReceivedMutation = useMarkPaymentReceived({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Payment confirmed. Crypto has been released to the buyer.');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to confirm payment received');
    },
  });

  const createReviewMutation = useCreateP2PReview({
    onSuccess: () => {
      refetchOrderDetails();
      showSuccessAlert('Success', 'Review submitted successfully');
    },
    onError: (error: any) => {
      showErrorAlert(error?.message || 'Failed to submit review');
    },
  });

  // Handlers
  const handleAccept = () => {
    if (!orderId) return;
    showConfirmAlert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      () => acceptMutation.mutate(orderId),
      undefined,
      'Accept',
      'Cancel'
    );
  };

  const handleDecline = () => {
    if (!orderId) return;
    showConfirmAlert(
      'Decline Order',
      'Are you sure you want to decline this order?',
      () => declineMutation.mutate(orderId),
      undefined,
      'Decline',
      'Cancel'
    );
  };

  const handleCancel = () => {
    if (!orderId || !orderData) return;
    showConfirmAlert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      () => {
        if (orderData.isVendor) {
          cancelVendorMutation.mutate(orderId);
        } else {
          cancelUserMutation.mutate(orderId);
        }
      },
      undefined,
      'Cancel Order',
      'No'
    );
  };

  const handleMarkPayment = () => {
    if (!orderId || !orderData) return;

    // Determine which mutation to use based on role and ad type
    if (orderData.isVendor) {
      // Vendor actions
      if (orderData.type === 'buy') {
        // BUY ad: Vendor is buyer, mark payment made
        showConfirmAlert(
          'Confirm Payment Made',
          'Have you made the payment to the seller? This will notify the seller to release crypto.',
          () => {
            markVendorPaymentMadeMutation.mutate({ orderId });
          },
          undefined,
          'Confirm',
          'Cancel'
        );
      } else {
        // SELL ad: Vendor is seller, mark payment received
        showConfirmAlert(
          'Confirm Payment Received',
          'Have you received the payment from the buyer? This will release the crypto to the buyer.',
          () => {
            markVendorPaymentReceivedMutation.mutate({ orderId, confirmed: true });
          },
          undefined,
          'Confirm',
          'Cancel'
        );
      }
    } else if (orderData.isUserBuyer || orderData.userAction === 'buy') {
      // User is buyer - mark payment made
      showConfirmAlert(
        'Confirm Payment Made',
        'Have you made the payment to the vendor?',
        () => {
          markPaymentMadeMutation.mutate({ orderId });
        },
        undefined,
        'Confirm',
        'Cancel'
      );
    } else if (orderData.isUserSeller || orderData.userAction === 'sell') {
      // User is seller - mark payment received and release crypto
      // For BUY ads: User is seller, Vendor is buyer
      // For SELL ads: User is seller (if user created sell order)
      showConfirmAlert(
        'Confirm Payment Received',
        'Have you received the payment from the buyer? This will automatically release the crypto to the buyer.',
        () => {
          markPaymentReceivedMutation.mutate({ orderId, confirmed: true });
        },
        undefined,
        'Confirm',
        'Cancel'
      );
    }
  };

  const handleCopy = (text: string, label: string) => {
    Clipboard.setStringAsync(text);
    showSuccessAlert('Copied', `${label} copied to clipboard`);
  };

  // Pull to refresh
  const handleRefresh = async () => {
    await refetchOrderDetails();
  };

  // Get status color and background
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#4CAF50', color: '#FFFFFF' };
      case 'cancelled':
        return { backgroundColor: '#ff0000', color: '#FFFFFF' };
      case 'pending':
        return { backgroundColor: '#FFA726', color: '#FFFFFF' };
      case 'awaiting_payment':
        return { backgroundColor: '#2196F3', color: '#FFFFFF' };
      case 'payment_made':
        return { backgroundColor: '#9C27B0', color: '#FFFFFF' };
      case 'awaiting_coin_release':
        return { backgroundColor: '#00BCD4', color: '#FFFFFF' };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)' };
    }
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'awaiting_payment':
        return 'Awaiting Payment';
      case 'payment_made':
        return 'Payment Made';
      case 'awaiting_coin_release':
        return 'Awaiting Coin Release';
      case 'completed':
        return 'Order Completed';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return status.toUpperCase().replace(/_/g, ' ');
    }
  };

  // Get step status text - based on user role
  const getStepStatus = () => {
    if (!orderData) return '';
    
    // Vendor perspective: They receive orders from users
    if (orderData.isVendor) {
      switch (orderData.status) {
        case 'pending':
          return 'Order Received';
        case 'awaiting_payment':
          return 'Awaiting Payment';
        case 'payment_made':
          // Vendor needs to confirm payment received (for offline payments)
          return 'Payment Made - Confirm to Release';
        case 'awaiting_coin_release':
          return 'Awaiting Coin Release';
        case 'completed':
          return 'Order Completed';
        case 'cancelled':
          return 'Order Cancelled';
        default:
          return 'Order Received';
      }
    }
    
    // User perspective: They place orders
    // User is buyer (buying crypto from vendor)
    if (orderData.isUserBuyer || orderData.userAction === 'buy') {
      switch (orderData.status) {
        case 'pending':
          return 'Order Placed'; // User placed order, waiting for vendor to accept
        case 'awaiting_payment':
          return 'Awaiting Payment'; // User needs to make payment
        case 'payment_made':
          return 'Awaiting Coin Release'; // User made payment, waiting for vendor to release crypto
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
    
    // User is seller (selling crypto to vendor)
    if (orderData.isUserSeller || orderData.userAction === 'sell') {
      switch (orderData.status) {
        case 'pending':
          return 'Order Placed'; // User placed order, waiting for vendor to accept
        case 'awaiting_payment':
          return 'Awaiting Payment'; // Vendor needs to make payment
        case 'payment_made':
          // User (seller) needs to confirm payment received (for offline payments)
          return 'Payment Made - Confirm to Release';
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
    
    // Fallback
    return 'Order Details';
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

  const handleSendReview = () => {
    if (!orderId || !reviewRating) {
      showErrorAlert('Error', 'Please select a rating');
      return;
    }
    createReviewMutation.mutate({
      orderId,
      type: reviewRating,
      comment: reviewText,
    });
  };

  if (isLoadingOrderDetails) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020c19" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
          <View style={{ width: 24 * SCALE }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A9EF45" />
          <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
        </View>
      </View>
    );
  }

  if (isOrderDetailsError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020c19" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
          <View style={{ width: 24 * SCALE }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48 * SCALE} color="#ff0000" />
          <ThemedText style={styles.errorText}>
            {orderDetailsError?.message || 'Failed to load order details'}
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020c19" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
          <View style={{ width: 24 * SCALE }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A9EF45" />
          <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {/* Use userAction for display - this is what user sees, not vendor's ad type */}
          {orderData?.userAction === 'buy' ? 'USDT Buy Order' : orderData?.userAction === 'sell' ? 'USDT Sell Order' : (orderData?.type === 'buy' ? 'USDT Sell Order' : 'USDT Buy Order')}
        </ThemedText>
        <View style={{ width: 24 * SCALE }} />
      </View>

      {/* Progress Indicator */}
      {orderData && currentStep > 0 && renderProgressIndicator()}

      {/* Status and Amount Section */}
      {orderData && currentStep > 0 && (
        <View style={styles.statusSection}>
          <ThemedText style={styles.statusText}>{getStepStatus()}</ThemedText>
          <View style={styles.amountSectionHeader}>
            <ThemedText style={styles.amountText}>{orderData.cryptoAmount}</ThemedText>
            <TouchableOpacity
              style={styles.openChatButton}
              onPress={() => {
                (navigation as any).navigate('Settings', {
                  screen: 'ChatScreen',
                  params: {
                    orderId: orderId,
                    chatId: orderId,
                    buyerName: orderData.buyerName,
                  },
                });
              }}
            >
              <ThemedText style={styles.openChatText}>Open Chat</ThemedText>
              {(orderData.status === 'awaiting_payment' || orderData.status === 'payment_made') && (
                <View style={styles.chatNotificationDot} />
              )}
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
            refreshing={isLoadingOrderDetails}
            onRefresh={handleRefresh}
            tintColor="#A9EF45"
            colors={['#A9EF45']}
          />
        }
      >
        {/* Order Details Card */}
        {orderData && (
          <View style={styles.orderDetailsCard}>
            <ThemedText style={styles.orderDetailsTitle}>Order Details</ThemedText>
            <View style={styles.orderDetailsContent}>
          
              <View style={[styles.detailRow, { borderTopRightRadius: 10, borderTopLeftRadius: 10, borderBottomWidth: 1 }]}>
                <ThemedText style={styles.detailLabel}>Buyer name</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.buyerName}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Amount to be paid</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.fiatAmount}</ThemedText>
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
                  <ThemedText style={styles.detailValue}>{String(orderData.id).substring(0, 15)}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleCopy(String(orderData.id), 'Tx id')}
                    style={styles.copyButton}
                  >
                    <MaterialCommunityIcons name="content-copy" size={14 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <ThemedText style={styles.detailLabel}>Order time</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.createdAt}</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Payment Account Card */}
        {orderData && currentStep >= 1 && orderData.paymentMethod && (
          <View style={styles.paymentAccountCard}>
            <View style={styles.paymentAccountHeader}>
              <View style={styles.paymentAccountHeaderLeft}>
                <ThemedText style={styles.paymentAccountTitle}>Payment Account</ThemedText>
                <ThemedText style={styles.paymentAccountSubtitle}>Pay to the account below</ThemedText>
              </View>
            </View>
            <View style={styles.amountToPaySection}>
              <ThemedText style={styles.amountToPayLabel}>Amount to pay</ThemedText>
              <ThemedText style={styles.amountToPayValue}>{orderData.fiatAmount}</ThemedText>
            </View>
            <View style={styles.paymentAccountDetails}>
              <View style={[styles.detailRow, { borderTopRightRadius: 10, borderTopLeftRadius: 10, borderBottomWidth: 1 }]}>
                <ThemedText style={styles.detailLabel}>Bank Name</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.bankName}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
                <View style={styles.accountNumberRow}>
                  <ThemedText style={styles.detailValue}>{orderData.accountNumber}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleCopy(orderData.accountNumber, 'Account Number')}
                    style={styles.copyButton}
                  >
                    <MaterialCommunityIcons name="content-copy" size={14 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <ThemedText style={styles.detailLabel}>Account Name</ThemedText>
                <ThemedText style={styles.detailValue}>{orderData.accountName}</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Review Section (Step 4 only) */}
        {orderData && currentStep === 4 && (
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
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendReview} disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.sendButtonText}>Send</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      
      {/* VENDOR: Accept/Decline buttons for pending orders */}
      {orderData && orderData.status === 'pending' && orderData.isVendor && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.declineButtonBottom}
            onPress={handleDecline}
            disabled={declineMutation.isPending}
          >
            {declineMutation.isPending ? (
              <ActivityIndicator size="small" color="#ff0000" />
            ) : (
              <ThemedText style={styles.declineButtonBottomText}>Decline</ThemedText>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.awaitingButton}
            onPress={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.awaitingButtonText}>Accept Order</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* USER: Cancel button for pending or awaiting_payment orders */}
      {orderData && 
        (orderData.status === 'pending' || orderData.status === 'awaiting_payment') && 
        !orderData.isVendor && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.cancelButtonBottom}
            onPress={handleCancel}
            disabled={cancelUserMutation.isPending}
          >
            {cancelUserMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.cancelButtonBottomText}>Cancel Order</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* VENDOR: Cancel button for awaiting_payment orders (pending already has accept/decline) */}
      {orderData && 
        orderData.status === 'awaiting_payment' && 
        orderData.isVendor && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.cancelButtonBottom}
            onPress={handleCancel}
            disabled={cancelVendorMutation.isPending}
          >
            {cancelVendorMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.cancelButtonBottomText}>Cancel Order</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* BUYER: Mark Payment Made button for awaiting_payment */}
      {orderData && 
        orderData.status === 'awaiting_payment' && 
        orderData.isBuyer && (
        <View style={styles.actionButtonsContainer}>
          {orderData.paymentChannel === 'rhinoxpay_id' ? (
            <TouchableOpacity
              style={styles.paymentMadeButton}
              onPress={() => {
                (navigation as any).navigate('Settings', {
                  screen: 'BuyOrder',
                  params: {
                    orderId: orderId,
                    currentStep: 2,
                    skipInitialScreen: true
                  },
                });
              }}
            >
              <ThemedText style={styles.paymentMadeButtonText}>Pay Now</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.paymentMadeButton}
              onPress={handleMarkPayment}
              disabled={orderData.isVendor ? markVendorPaymentMadeMutation.isPending : markPaymentMadeMutation.isPending}
            >
              {(orderData.isVendor ? markVendorPaymentMadeMutation.isPending : markPaymentMadeMutation.isPending) ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.paymentMadeButtonText}>Mark Payment Made</ThemedText>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.appealButton} 
            onPress={handleCancel}
            disabled={orderData.isVendor ? cancelVendorMutation.isPending : cancelUserMutation.isPending}
          >
            {(orderData.isVendor ? cancelVendorMutation.isPending : cancelUserMutation.isPending) ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.appealButtonText}>Cancel</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* VENDOR BUYER (BUY ad): Mark Payment Made button for awaiting_payment */}
      {orderData && 
        orderData.status === 'awaiting_payment' && 
        orderData.isVendor && 
        orderData.type === 'buy' && (
        <View style={styles.actionButtonsContainer}>
          {orderData.paymentChannel === 'rhinoxpay_id' ? (
            <TouchableOpacity
              style={styles.paymentMadeButton}
              onPress={() => {
                // For vendor buying, they also use the automated flow
                (navigation as any).navigate('Settings', {
                  screen: 'BuyOrder',
                  params: {
                    orderId: orderId,
                    currentStep: 2,
                    skipInitialScreen: true
                  },
                });
              }}
            >
              <ThemedText style={styles.paymentMadeButtonText}>Pay Now</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.paymentMadeButton}
              onPress={handleMarkPayment}
              disabled={markVendorPaymentMadeMutation.isPending}
            >
              {markVendorPaymentMadeMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.paymentMadeButtonText}>Mark Payment Made</ThemedText>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.appealButton} 
            onPress={handleCancel}
            disabled={cancelVendorMutation.isPending}
          >
            {cancelVendorMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.appealButtonText}>Cancel</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* SELLER: Mark Payment Received button for payment_made */}
      {orderData && 
        orderData.status === 'payment_made' && 
        orderData.isSeller && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.paymentMadeButton}
            onPress={handleMarkPayment}
            disabled={orderData.isVendor ? markVendorPaymentReceivedMutation.isPending : markPaymentReceivedMutation.isPending}
          >
            {(orderData.isVendor ? markVendorPaymentReceivedMutation.isPending : markPaymentReceivedMutation.isPending) ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.paymentMadeButtonText}>Mark Payment Received</ThemedText>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.appealButton}>
            <ThemedText style={styles.appealButtonText}>Appeal</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Show Appeal button when awaiting_coin_release or completed */}
      {orderData && 
        (orderData.status === 'awaiting_coin_release' || 
         (orderData.status === 'completed' && currentStep === 4)) && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.appealButton}>
            <ThemedText style={styles.appealButtonText}>
              {orderData.status === 'completed' ? 'Appeal Order' : 'Appeal'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  headerTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 100 * SCALE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14 * SCALE,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14 * SCALE,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    paddingHorizontal: 30 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 100 * SCALE,
    backgroundColor: '#A9EF45',
  },
  retryButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16 * SCALE,
    paddingVertical: 8 * SCALE,
    borderRadius: 100 * SCALE,
    marginBottom: 20 * SCALE,
  },
  statusBadgeText: {
    fontSize: 12 * SCALE,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    padding: 20 * SCALE,
    marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  cardTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.3,
    borderBottomColor: '#FFFFFF33',
  },
  infoLabel: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },
  infoValue: {
    fontSize: 12 * SCALE,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 12 * SCALE,
    marginTop: 20 * SCALE,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 15 * SCALE,
    borderRadius: 100 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#A9EF45',
  },
  acceptButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 0.3,
    borderColor: '#ff0000',
  },
  declineButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#ff0000',
  },
  markPaymentButton: {
    backgroundColor: '#4CAF50',
  },
  markPaymentButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 0.3,
    borderColor: '#A9EF45',
  },
  cancelButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
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
    paddingHorizontal: SCREEN_WIDTH * 0.047,
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
    fontSize: 24 * SCALE,
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
  orderDetailsCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    padding: 20 * SCALE,
    marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  orderDetailsTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  orderDetailsContent: {
    // Content styles
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.3,
    borderBottomColor: '#FFFFFF33',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },
  detailValue: {
    fontSize: 12 * SCALE,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  txIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  paymentAccountCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    padding: 20 * SCALE,
    marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  paymentAccountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  paymentAccountHeaderLeft: {
    flex: 1,
  },
  paymentAccountTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  paymentAccountSubtitle: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  amountToPaySection: {
    backgroundColor: '#A9EF45',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 15,
    alignItems: 'center',
  },
  amountToPayLabel: {
    fontSize: 12 * SCALE,
    color: 'rgba(0, 0, 0, 0.7)',
    marginBottom: 5,
  },
  amountToPayValue: {
    fontSize: 24 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  paymentAccountDetails: {
    // Details container
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    padding: 20 * SCALE,
    marginBottom: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  reviewTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  reviewSubtitle: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 15,
  },
  reviewRatingButtons: {
    flexDirection: 'row',
    gap: 15 * SCALE,
    marginBottom: 15,
  },
  ratingButton: {
    width: 60 * SCALE,
    height: 60 * SCALE,
    borderRadius: 30 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ratingButtonActive: {
    backgroundColor: '#A9EF45',
  },
  ratingButtonActiveNegative: {
    backgroundColor: '#FF0000',
  },
  ratingButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ratingIcon: {
    width: 30 * SCALE,
    height: 30 * SCALE,
  },
  ratingBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30 * SCALE,
    borderWidth: 2,
    borderColor: '#A9EF45',
  },
  ratingBorderNegative: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30 * SCALE,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  reviewInputContainer: {
    marginBottom: 15,
  },
  reviewInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    color: '#FFFFFF',
    fontSize: 14 * SCALE,
    minHeight: 100 * SCALE,
    textAlignVertical: 'top',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  sendButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 100 * SCALE,
    paddingTop: 10 * SCALE,
    gap: 10 * SCALE,
    backgroundColor: '#020c19',
  },
  awaitingButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButtonBottom: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  cancelButtonBottomText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMadeButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMadeButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  appealButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  appealButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButtonBottom: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 100 * SCALE,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: '#ff0000',
  },
  declineButtonBottomText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#ff0000',
  },
});
