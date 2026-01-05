import React, { useState, useMemo, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetP2PAdDetails } from '../../../queries/p2p.queries';
import { useCreateP2POrder } from '../../../mutations/p2p.mutations';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { showSuccessAlert, showErrorAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

const SellOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const routeParams = route.params as {
    adId?: string;
    amount?: string;
    cryptoAmount?: string;
    paymentMethodId?: string;
  } | undefined;

  const [currencyType, setCurrencyType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [amount, setAmount] = useState(routeParams?.cryptoAmount || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempSelectedPaymentMethod, setTempSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [searchPaymentQuery, setSearchPaymentQuery] = useState('');

  const adId = routeParams?.adId || null;

  // Fetch ad details
  const {
    data: adDetailsData,
    isLoading: isLoadingAdDetails,
    error: adDetailsError,
    refetch: refetchAdDetails,
  } = useGetP2PAdDetails(adId || '');

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
  } = useGetWalletBalances();

  // Extract ad data
  const adData = useMemo(() => {
    if (!adDetailsData?.data) return null;
    return adDetailsData.data;
  }, [adDetailsData]);

  // Transform payment methods from ad details
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    if (!adData?.paymentMethods || !Array.isArray(adData.paymentMethods)) {
      return [];
    }
    return adData.paymentMethods.map((method: any) => {
      let name = '';
      if (method.type === 'bank_account') {
        name = `${method.bankName || 'Bank'} - ${method.accountNumber ? method.accountNumber.replace(/(.{4})$/, '****$1') : ''}`;
      } else if (method.type === 'mobile_money') {
        name = `${method.providerName || 'Mobile Money'} - ${method.phoneNumber ? method.phoneNumber.replace(/(.{4})$/, '****$1') : ''}`;
      } else if (method.type === 'rhinoxpay_id') {
        name = `RhinoxPay ID - ${method.rhinoxpayId || ''}`;
      } else {
        name = method.name || `${method.type} - ${method.accountNumber || method.phoneNumber || ''}`;
      }
      return {
        id: String(method.id),
        name: name,
        type: method.type || 'unknown',
      };
    });
  }, [adData]);

  // Filter payment methods by search query
  const filteredPaymentMethods = useMemo(() => {
    if (!searchPaymentQuery.trim()) {
      return paymentMethods;
    }
    return paymentMethods.filter(method =>
      method.name.toLowerCase().includes(searchPaymentQuery.toLowerCase())
    );
  }, [paymentMethods, searchPaymentQuery]);

  // Get vendor info
  const vendorInfo = useMemo(() => {
    if (!adData?.vendor) {
      return {
        name: 'Unknown Vendor',
        avatar: require('../../../assets/login/memoji.png'),
        status: 'Offline',
        rating: '0%',
      };
    }
    const vendor = adData.vendor;
    return {
      name: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Unknown Vendor',
      avatar: require('../../../assets/login/memoji.png'), // Default avatar
      status: adData.isOnline ? 'Online' : 'Offline',
      rating: vendor.score ? `${(parseFloat(vendor.score) * 20).toFixed(0)}%` : '0%',
    };
  }, [adData]);

  // Get rate and order limits
  const rate = useMemo(() => {
    if (!adData?.price) return '0';
    return parseFloat(adData.price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [adData]);

  const minOrder = useMemo(() => {
    return adData?.minOrder ? parseFloat(adData.minOrder) : 0;
  }, [adData]);

  const maxOrder = useMemo(() => {
    return adData?.maxOrder ? parseFloat(adData.maxOrder) : 0;
  }, [adData]);

  // Get crypto balance
  const cryptoBalance = useMemo(() => {
    if (!balancesData?.data?.crypto || !Array.isArray(balancesData.data.crypto)) {
      return '0';
    }
    const cryptoCurrency = adData?.cryptoCurrency || 'USDT';
    const wallet = balancesData.data.crypto.find(
      (w: any) => w.currency === cryptoCurrency
    );
    return wallet?.balance || '0';
  }, [balancesData?.data?.crypto, adData?.cryptoCurrency]);

  // Get fiat balance
  const fiatBalance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) {
      return '0';
    }
    const fiatCurrency = adData?.fiatCurrency || 'NGN';
    const wallet = balancesData.data.fiat.find(
      (w: any) => w.currency === fiatCurrency
    );
    return wallet?.balance || '0';
  }, [balancesData?.data?.fiat, adData?.fiatCurrency]);

  // Calculate fiat amount from crypto amount
  const fiatAmount = useMemo(() => {
    if (!amount || !adData?.price) return '0.00';
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount)) return '0.00';
    const calculated = numericAmount * parseFloat(adData.price);
    return calculated.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount, adData?.price]);

  // Calculate crypto amount from fiat amount
  const cryptoAmountFromFiat = useMemo(() => {
    if (!amount || !adData?.price) return '0.00';
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount)) return '0.00';
    const calculated = numericAmount / parseFloat(adData.price);
    return calculated.toLocaleString('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  }, [amount, adData?.price]);

  // Create order mutation
  const createOrderMutation = useCreateP2POrder({
    onSuccess: (data) => {
      showSuccessAlert('Success', 'Sell order created successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['p2p', 'orders'] });
        // Navigate to sell order flow screen
        (navigation as any).navigate('Settings', {
          screen: 'SellOrderFlow',
          params: {
            orderId: String(data?.data?.id || ''),
            amount: fiatAmount,
            assetAmount: `${amount.replace(/,/g, '')} ${adData?.cryptoCurrency || 'USDT'}`,
            cryptoAmount: amount.replace(/,/g, ''),
            paymentMethodId: selectedPaymentMethod?.id,
          },
        });
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to create sell order');
    },
  });

  const handleSell = () => {
    if (!amount || !selectedPaymentMethod || !adId) {
      showErrorAlert('Validation Error', 'Please enter amount and select payment method');
      return;
    }

    let cryptoAmount: number;
    let fiatAmount: number;

    if (currencyType === 'Fiat') {
      // User entered fiat amount, calculate crypto amount
      fiatAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(fiatAmount) || fiatAmount <= 0) {
        showErrorAlert('Validation Error', 'Please enter a valid amount');
        return;
      }
      cryptoAmount = fiatAmount / parseFloat(adData?.price || '1');
    } else {
      // User entered crypto amount, calculate fiat amount
      cryptoAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
        showErrorAlert('Validation Error', 'Please enter a valid amount');
        return;
      }
      fiatAmount = cryptoAmount * parseFloat(adData?.price || '0');
    }

    // Validate order limits
    if (fiatAmount < minOrder) {
      showErrorAlert('Validation Error', `Order amount must be at least ${minOrder.toLocaleString()} ${adData?.fiatCurrency || 'NGN'}`);
      return;
    }
    if (fiatAmount > maxOrder) {
      showErrorAlert('Validation Error', `Order amount must not exceed ${maxOrder.toLocaleString()} ${adData?.fiatCurrency || 'NGN'}`);
      return;
    }

    // Check crypto balance
    const availableBalance = parseFloat(cryptoBalance);
    if (cryptoAmount > availableBalance) {
      showErrorAlert('Insufficient Balance', `You have ${availableBalance.toFixed(8)} ${adData?.cryptoCurrency || 'USDT'} available`);
      return;
    }

    // Create order
    createOrderMutation.mutate({
      adId: adId,
      cryptoAmount: cryptoAmount.toFixed(8),
      paymentMethodId: selectedPaymentMethod.id,
    });
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!amount || !selectedPaymentMethod || !adId || !adData) return false;
    
    let cryptoAmount: number;
    let fiatAmount: number;

    if (currencyType === 'Fiat') {
      fiatAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(fiatAmount) || fiatAmount <= 0) return false;
      cryptoAmount = fiatAmount / parseFloat(adData.price || '1');
    } else {
      cryptoAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(cryptoAmount) || cryptoAmount <= 0) return false;
      fiatAmount = cryptoAmount * parseFloat(adData.price || '0');
    }

    if (fiatAmount < minOrder || fiatAmount > maxOrder) return false;
    const availableBalance = parseFloat(cryptoBalance);
    if (cryptoAmount > availableBalance) return false;
    return true;
  }, [amount, selectedPaymentMethod, adId, adData, currencyType, minOrder, maxOrder, cryptoBalance]);

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

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    if (adId) {
      await refetchAdDetails();
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Set initial payment method from route params
  useEffect(() => {
    if (routeParams?.paymentMethodId && paymentMethods.length > 0) {
      const method = paymentMethods.find(m => m.id === routeParams.paymentMethodId);
      if (method) {
        setSelectedPaymentMethod(method);
      }
    }
  }, [routeParams?.paymentMethodId, paymentMethods]);

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
          <ThemedText style={styles.headerTitle}>Sell Order</ThemedText>
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
          <View style={[styles.vendorCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
            <ActivityIndicator size="small" color="#A9EF45" />
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
              Loading ad details...
            </ThemedText>
          </View>
        ) : adDetailsError ? (
          <View style={[styles.vendorCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
            <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
            <ThemedText style={{ color: '#ff0000', marginTop: 10, fontSize: 12 * SCALE, textAlign: 'center' }}>
              {adDetailsError?.message || 'Failed to load ad details'}
            </ThemedText>
            <TouchableOpacity
              style={{ marginTop: 15, backgroundColor: '#A9EF45', paddingHorizontal: 20 * SCALE, paddingVertical: 10 * SCALE, borderRadius: 100 }}
              onPress={() => refetchAdDetails()}
            >
              <ThemedText style={{ color: '#000000', fontSize: 12 * SCALE }}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : adData ? (
          <View style={styles.vendorCard}>
            <Image
              source={vendorInfo.avatar}
              style={styles.vendorAvatar}
              resizeMode="cover"
            />
            <View style={styles.vendorInfo}>
              <ThemedText style={styles.vendorName}>{vendorInfo.name}</ThemedText>
              <ThemedText style={styles.vendorStatus}>{vendorInfo.status}</ThemedText>
            </View>
            <ThemedText style={styles.vendorRating}>{vendorInfo.rating}</ThemedText>
          </View>
        ) : null}

        {/* Vendor Rate */}
        {adData && (
          <>
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
                  <ThemedText style={styles.rateRefresh}>1 {adData.cryptoCurrency} = {adData.fiatCurrency} {rate}</ThemedText>
                </View>
                <ThemedText style={styles.rateValue}>{adData.fiatCurrency} {rate}</ThemedText>
              </View>
            </LinearGradient>
          </>
        )}

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
                <ThemedText style={styles.amountLabel}>Amount to sell ({adData?.fiatCurrency || 'NGN'})</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/,/g, '');
                    if (numericValue === '' || /^\d+(\.\d*)?$/.test(numericValue)) {
                      setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Input amount"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                <View style={styles.balanceRow}>
                  <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                  {isLoadingBalances ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <ThemedText style={styles.balanceValue}>
                      {adData?.fiatCurrency || 'NGN'} {parseFloat(fiatBalance || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* You will Receive */}
              <View style={styles.receiveSection}>
                <ThemedText style={styles.receiveLabel}>You will Receive</ThemedText>
                <View style={styles.receiveValueContainer}>
                  <ThemedText style={styles.receiveValue}>
                    {amount && adData?.price ? `${cryptoAmountFromFiat} ${adData.cryptoCurrency || 'USDT'}` : `0.00 ${adData?.cryptoCurrency || 'USDT'}`}
                  </ThemedText>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.amountSection}>
                <ThemedText style={styles.amountLabel}>Enter {adData?.cryptoCurrency || 'USDT'} Amount</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/,/g, '');
                    if (numericValue === '' || /^\d+(\.\d*)?$/.test(numericValue)) {
                      setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Input amount"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                <View style={styles.balanceRow}>
                  <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                  {isLoadingBalances ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <ThemedText style={styles.balanceValue}>
                      {adData?.cryptoCurrency || 'USDT'} {parseFloat(cryptoBalance).toFixed(8)}
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* You will Receive */}
              <View style={styles.receiveSection}>
                <ThemedText style={styles.receiveLabel}>You will Receive</ThemedText>
                <ThemedText style={styles.payValue}>
                  {adData?.fiatCurrency || 'NGN'} {fiatAmount}
                </ThemedText>
              </View>
            </>
          )}

          {/* Payment Method */}
          <TouchableOpacity
            style={styles.paymentMethodField}
            onPress={() => setShowPaymentMethodModal(true)}
            disabled={isLoadingAdDetails || paymentMethods.length === 0}
          >
            {isLoadingAdDetails ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.placeholder}>Loading payment methods...</ThemedText>
              </View>
            ) : paymentMethods.length === 0 ? (
              <ThemedText style={styles.placeholder}>No payment methods available</ThemedText>
            ) : (
              <>
                <ThemedText style={[styles.paymentMethodText, !selectedPaymentMethod && styles.placeholder]}>
                  {selectedPaymentMethod ? selectedPaymentMethod.name : 'Select payment method'}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sell Button */}
      <TouchableOpacity
        style={[styles.sellButton, (!isFormValid || createOrderMutation.isPending) && styles.sellButtonDisabled]}
        onPress={handleSell}
        disabled={!isFormValid || createOrderMutation.isPending}
      >
        {createOrderMutation.isPending ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <ThemedText style={styles.sellButtonText}>Sell</ThemedText>
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
              <ThemedText style={styles.modalTitle}>Select Bank</ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search payment method"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchPaymentQuery}
                onChangeText={setSearchPaymentQuery}
              />
            </View>

            <ScrollView style={styles.paymentMethodList} showsVerticalScrollIndicator={false}>
              {isLoadingAdDetails ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                    Loading payment methods...
                  </ThemedText>
                </View>
              ) : filteredPaymentMethods.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                    {searchPaymentQuery ? 'No payment methods found' : 'No payment methods available'}
                  </ThemedText>
                </View>
              ) : (
                filteredPaymentMethods.map((method) => (
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
                ))
              )}
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
};

export default SellOrder;

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
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  headerTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 100 * SCALE,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 20 * SCALE,
  },
  vendorAvatar: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    borderRadius: 25 * SCALE,
    marginRight: 15 * SCALE,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 5 * SCALE,
  },
  vendorStatus: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  vendorRating: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  rateTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  rateCard: {
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 20 * SCALE,
  },
  rateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 5 * SCALE,
  },
  rateRefresh: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  rateValue: {
    fontSize: 20 * SCALE,
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
  sellButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButtonDisabled: {
    opacity: 0.5,
  },
  sellButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
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
});
