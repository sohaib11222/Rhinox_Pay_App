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
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useBrowseP2PAds, useBrowseBuyAds, useBrowseSellAds, useGetP2PAdDetails, useGetP2POrderDetails } from '../../../queries/p2p.queries';
import { useCreateP2POrder, useMarkPaymentMade } from '../../../mutations/p2p.mutations';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetUSDTTokens } from '../../../queries/crypto.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { showSuccessAlert, showErrorAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬', selected: false },
  { id: 2, name: 'Botswana', flag: '🇧🇼', selected: false },
  { id: 3, name: 'Ghana', flag: '🇬🇭', selected: false },
  { id: 4, name: 'Kenya', flag: '🇰🇪', selected: false },
  { id: 5, name: 'South Africa', flag: '🇿🇦', selected: false },
  { id: 6, name: 'Tanzania', flag: '🇹🇿', selected: false },
  { id: 7, name: 'Uganda', flag: '🇺🇬', selected: false },
];

// Types for API integration
interface TradingOffer {
  id: string;
  traderName: string;
  traderAvatar: any;
  isOnline: boolean;
  numberOfTrades: number;
  responseTime: string;
  score: number;
  availableQuantity: string;
  limits: string;
  paymentMethods: string[];
  price: string;
}

interface Asset {
  id: string;
  name: string;
  balance: string;
  icon: any;
  symbol?: string;
  blockchain?: string;
  rawData?: any;
}

interface Bank {
  id: string;
  name: string;
  type: string;
}

const P2PFundScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route?.params as { initialTab?: 'Buy' | 'Sell' } || {};
  const initialTab = routeParams?.initialTab || 'Buy';

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

  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>(initialTab);
  
  // Update active tab when route params change
  React.useEffect(() => {
    if (routeParams?.initialTab && routeParams.initialTab !== activeTab) {
      setActiveTab(routeParams.initialTab);
    }
  }, [routeParams?.initialTab]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [buyModalToken, setBuyModalToken] = useState<Asset | null>(null);
  const [buyModalAmount, setBuyModalAmount] = useState('');
  const [assetModalContext, setAssetModalContext] = useState<'filter' | 'buy'>('filter');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);

  // Filter states
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [noVerificationRequired, setNoVerificationRequired] = useState(false);
  const [paymentTimeLimit, setPaymentTimeLimit] = useState<'All' | '15' | '30'>('All');
  const [sortBy, setSortBy] = useState<string>('Overall sorting');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Get currency from country code
  const getCurrencyFromCountryCode = (code: string): string => {
    const currencyMap: { [key: string]: string } = {
      'NG': 'NGN',
      'KE': 'KES',
      'GH': 'GHS',
      'ZA': 'ZAR',
      'BW': 'BWP',
      'TZ': 'TZS',
      'UG': 'UGX',
    };
    return currencyMap[code] || 'NGN';
  };

  const fiatCurrency = useMemo(() => getCurrencyFromCountryCode(selectedCountryCode), [selectedCountryCode]);

  // Fetch countries
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return COUNTRIES.map((c, index) => ({
        id: index + 1,
        name: c.name,
        code: c.name === 'Nigeria' ? 'NG' : c.name === 'Kenya' ? 'KE' : 'NG',
        flag: c.flag,
        flagUrl: null,
      }));
    }
    return countriesData.data.map((country: any, index: number) => {
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

  // Fetch USDT tokens for asset selection
  const {
    data: tokensData,
    isLoading: isLoadingTokens,
  } = useGetUSDTTokens();

  // Transform tokens to assets
  const availableAssets = useMemo(() => {
    if (!tokensData?.data || !Array.isArray(tokensData.data)) {
      return [
        { id: '1', name: 'USDT', balance: '0', icon: require('../../../assets/CurrencyBtc.png'), symbol: 'USDT', blockchain: 'ethereum' },
      ];
    }
    return tokensData.data.map((token: any) => ({
      id: token.id || token.blockchain + '_' + token.currency,
      name: token.displayName || `${token.currency} (${token.blockchainName})`,
      balance: '0',
      icon: require('../../../assets/CurrencyBtc.png'),
      symbol: token.currency || token.symbol,
      blockchain: token.blockchain,
      rawData: token,
    }));
  }, [tokensData?.data]);

  // Set default asset if none selected
  useEffect(() => {
    if (!selectedAsset && availableAssets.length > 0) {
      setSelectedAsset(availableAssets[0] as any);
    }
  }, [availableAssets]);

  // Browse P2P ads based on active tab
  // For Buy: Use USER endpoint (auth required) - GET /api/p2p/user/ads/buy
  // For Sell: Use PUBLIC endpoint - GET /api/p2p/ads/browse with type=sell
  const browseBuyParams = useMemo(() => {
    const params: any = {
    cryptoCurrency: selectedAsset?.symbol || 'USDT',
    fiatCurrency: fiatCurrency,
    countryCode: selectedCountryCode,
    limit: 50,
    };
    
    // Only include minPrice and maxPrice if they have valid values
    if (minPrice && minPrice !== '') {
      params.minPrice = minPrice;
    }
    if (maxPrice && maxPrice !== '') {
      params.maxPrice = maxPrice;
    }
    
    return params;
  }, [selectedAsset, fiatCurrency, selectedCountryCode, minPrice, maxPrice]);

  const browseSellParams = useMemo(() => {
    const params: any = {
      cryptoCurrency: selectedAsset?.symbol || 'USDT',
      fiatCurrency: fiatCurrency,
      countryCode: selectedCountryCode,
      limit: 50,
    };
    
    // Only include minPrice and maxPrice if they have valid values
    if (minPrice && minPrice !== '') {
      params.minPrice = minPrice;
    }
    if (maxPrice && maxPrice !== '') {
      params.maxPrice = maxPrice;
    }
    
    return params;
  }, [selectedAsset, fiatCurrency, selectedCountryCode, minPrice, maxPrice]);

  // Use different API endpoints based on active tab
  const {
    data: buyAdsData,
    isLoading: isLoadingBuyAds,
    isError: isBuyAdsError,
    error: buyAdsError,
    refetch: refetchBuyAds,
  } = useBrowseBuyAds(activeTab === 'Buy' ? browseBuyParams : undefined);

  const {
    data: sellAdsData,
    isLoading: isLoadingSellAds,
    isError: isSellAdsError,
    error: sellAdsError,
    refetch: refetchSellAds,
  } = useBrowseSellAds(activeTab === 'Sell' ? browseSellParams : undefined);

  // Combine data based on active tab
  const adsData = activeTab === 'Buy' ? buyAdsData : sellAdsData;
  const isLoadingAds = activeTab === 'Buy' ? isLoadingBuyAds : isLoadingSellAds;
  const isAdsError = activeTab === 'Buy' ? isBuyAdsError : isSellAdsError;
  const adsError = activeTab === 'Buy' ? buyAdsError : sellAdsError;
  const refetchAds = activeTab === 'Buy' ? refetchBuyAds : refetchSellAds;

  // Transform ads to trading offers
  const tradingOffers = useMemo(() => {
    // Handle different response structures: buyAds returns { ads: [...] }, browse returns { data: [...] }
    const adsArray = activeTab === 'Buy' 
      ? (adsData?.data?.ads || adsData?.data || [])
      : (adsData?.data || []);
    
    if (!Array.isArray(adsArray)) {
      return [];
    }
    return adsArray.map((ad: any) => {
      // Extract vendor name - handle different structures
      let vendorName = 'Unknown Vendor';
      if (ad.vendor) {
        if (ad.vendor.name) {
          vendorName = ad.vendor.name;
        } else if (ad.vendor.firstName || ad.vendor.lastName) {
          vendorName = `${ad.vendor.firstName || ''} ${ad.vendor.lastName || ''}`.trim();
        }
      }
      
      return {
      id: String(ad.id),
      adId: ad.id,
      traderName: vendorName,
      traderAvatar: require('../../../assets/Frame 2398.png'),
      isOnline: ad.isOnline || false,
      numberOfTrades: ad.ordersReceived || ad.numberOfTrades || 0,
      responseTime: ad.responseTime ? `${ad.responseTime}min` : 'N/A',
      score: parseFloat(ad.score || '0'),
      // Handle different field names: availableBalance (buy) vs volume (browse)
      availableQuantity: `${ad.availableBalance || ad.volume || '0'} ${ad.cryptoCurrency || 'USDT'}`,
      // Handle different field names: minOrderAmount/maxOrderAmount (buy) vs minOrder/maxOrder (browse)
      limits: `${ad.minOrderAmount || ad.minOrder || '0'} - ${ad.maxOrderAmount || ad.maxOrder || '0'} ${ad.fiatCurrency || 'NGN'}`,
      paymentMethods: ad.paymentMethods?.map((pm: any) => {
        if (pm.type === 'bank_account') return pm.bankName || 'Bank Transfer';
        if (pm.type === 'mobile_money') return pm.phoneNumber || 'Mobile Money';
        return pm.type || 'Unknown';
      }) || [],
      price: parseFloat(ad.price || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rawData: ad,
      };
    });
  }, [adsData?.data, activeTab]);

  // Get ad details when an ad is selected
  const {
    data: adDetailsData,
    isLoading: isLoadingAdDetails,
  } = useGetP2PAdDetails(selectedAd?.id || '');

  // Create order mutation
  const createOrderMutation = useCreateP2POrder({
    onSuccess: (data: any) => {
      console.log('[P2P] Order created successfully:', data);
      setSelectedOrder(data?.data);
      setShowBuyModal(false);
      setShowOrderDetailsModal(true);
      // Refetch ads to update availability
      refetchAds();
    },
    onError: (error: any) => {
      console.error('[P2P] Error creating order:', error);
      showErrorAlert('Error', error?.message || 'Failed to create order');
    },
  });

  // Mark payment made mutation
  const markPaymentMadeMutation = useMarkPaymentMade({
    onSuccess: (data: any) => {
      console.log('[P2P] Payment marked as made:', data);
      showSuccessAlert('Success', 'Payment confirmed. Waiting for vendor to release crypto.');
      // Refetch order details
      if (selectedOrder?.id) {
        // Refetch order details would be handled by the order details query
      }
      setShowPaymentConfirmationModal(false);
    },
    onError: (error: any) => {
      console.error('[P2P] Error marking payment:', error);
      showErrorAlert('Error', error?.message || 'Failed to confirm payment');
    },
  });

  // Get order details
  const {
    data: orderDetailsData,
    isLoading: isLoadingOrderDetails,
    refetch: refetchOrderDetails,
  } = useGetP2POrderDetails(showOrderDetailsModal && selectedOrder?.id ? selectedOrder.id : '');

  // Update selected order when details are fetched
  useEffect(() => {
    if (orderDetailsData?.data && selectedOrder) {
      setSelectedOrder(orderDetailsData.data);
    }
  }, [orderDetailsData, selectedOrder]);

  // Removed mock data - using real API data from tradingOffers

  const assets: Asset[] = [
    { id: '1', name: 'USDT', balance: '0.00001', icon: require('../../../assets/CurrencyBtc.png') },
    { id: '2', name: 'Bitcoin', balance: '0.00001', icon: require('../../../assets/CurrencyBtc.png') },
    { id: '3', name: 'Ethereum', balance: '10', icon: require('../../../assets/CurrencyBtc.png') },
  ];

  const banks: Bank[] = [
    { id: '1', name: 'All', type: 'all' },
    { id: '2', name: 'Opay', type: 'bank' },
    { id: '3', name: 'Palmpay', type: 'bank' },
    { id: '4', name: 'Moniepoint', type: 'bank' },
    { id: '5', name: 'Kudabank', type: 'bank' },
    { id: '6', name: 'Chipper Cash', type: 'bank' },
  ];

  const filteredBanks = banks.filter((bank) => {
    if (searchQuery) {
      return bank.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleNumberPress = (num: string) => {
    setLastPressedButton(num);
    setTimeout(() => setLastPressedButton(null), 150);
    if (num === 'backspace') {
      setSelectedAmount((prev) => prev.slice(0, -1));
    } else if (num === '.') {
      if (!selectedAmount.includes('.')) {
        setSelectedAmount((prev) => prev + '.');
      }
    } else {
      setSelectedAmount((prev) => prev + num);
    }
  };

  const handleAmountConfirm = () => {
    setShowAmountModal(false);
  };

  const handleFilterReset = () => {
    setShowVerifiedOnly(true);
    setShowEligibleOnly(false);
    setNoVerificationRequired(false);
    setPaymentTimeLimit('All');
    setSortBy('Overall sorting');
  };

  const handleFilterConfirm = () => {
    setShowFilterModal(false);
    // TODO: Apply filters to trading offers
  };

  // Handle buy button press - Navigate to BuyOrder screen
  const handleBuyPress = (offer: any) => {
    // Navigate to BuyOrder screen with ad details
    (navigation as any).navigate('Settings', {
      screen: 'BuyOrder',
      params: {
        adId: String(offer.adId || offer.id),
        adData: offer.rawData,
      },
    });
  };

  // Handle sell button press - Navigate to SellOrder screen
  const handleSellPress = (offer: any) => {
    // Navigate to SellOrder screen with ad details (this is the order creation screen)
    (navigation as any).navigate('Settings', {
      screen: 'SellOrder',
      params: {
        adId: String(offer.adId || offer.id),
      },
    });
  };
  
  // Old handleBuyPress (kept for reference but not used)
  const handleBuyPressOld = (offer: any) => {
    // Navigate to BuyOrder screen with ad details
    (navigation as any).navigate('Settings', {
      screen: 'BuyOrder',
      params: {
        adId: String(offer.adId || offer.id),
        adData: offer.rawData,
      },
    });
  };

  // Handle order creation
  const handleCreateOrder = () => {
    if (!selectedAd || !buyModalAmount || !selectedPaymentMethod) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    const numericAmount = parseFloat(buyModalAmount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showErrorAlert('Error', 'Please enter a valid amount');
      return;
    }

    // Check if amount is within limits
    const minOrder = parseFloat(selectedAd.minOrder || '0');
    const maxOrder = parseFloat(selectedAd.maxOrder || '0');
    if (numericAmount < minOrder || numericAmount > maxOrder) {
      showErrorAlert('Error', `Amount must be between ${minOrder} and ${maxOrder} ${fiatCurrency}`);
      return;
    }

    // Calculate crypto amount based on price
    const price = parseFloat(selectedAd.price || '0');
    const cryptoAmount = (numericAmount / price).toFixed(6);

    createOrderMutation.mutate({
      adId: String(selectedAd.id),
      cryptoAmount: cryptoAmount,
      paymentMethodId: String(selectedPaymentMethod),
    });
  };

  // Handle payment confirmation
  const handleConfirmPayment = () => {
    if (!selectedOrder?.id) {
      showErrorAlert('Error', 'Order not found');
      return;
    }

    markPaymentMadeMutation.mutate({
      orderId: String(selectedOrder.id),
    });
  };

  // Check if buy button should be enabled
  const isBuyButtonEnabled = (offer: any) => {
    return offer.isOnline && parseFloat(offer.rawData?.volume || '0') > 0;
  };

  // Check if create order button should be enabled
  const isCreateOrderEnabled = useMemo(() => {
    return (
      !!selectedAd &&
      !!buyModalAmount &&
      buyModalAmount.replace(/,/g, '').length > 0 &&
      !!selectedPaymentMethod &&
      !createOrderMutation.isPending
    );
  }, [selectedAd, buyModalAmount, selectedPaymentMethod, createOrderMutation.isPending]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[P2P] Refreshing P2P trading data...');
    try {
      await Promise.all([
        refetchAds(),
      ]);
      console.log('[P2P] P2P trading data refreshed successfully');
    } catch (error) {
      console.error('[P2P] Error refreshing P2P trading data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{
          width: 40 * SCALE,
          height: 40 * SCALE,
          borderRadius: 20 * SCALE,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 0.3,
          borderColor: '#FFFFFF33',
          alignItems: 'center',
          justifyContent: 'center',
        }} onPress={() => {
          // Navigate back to Home tab instead of Settings tab
          (navigation as any).navigate('Home', { screen: 'HomeMain' });
        }}>
          <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>P2P</ThemedText>
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setShowCountryModal(true)}
        >
          {isLoadingCountries ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (() => {
            const selectedCountryData = countries.find((c: any) => c.code === selectedCountryCode);
            const flagUrl = selectedCountryData?.flagUrl;
            const flagEmoji = selectedCountryData?.flag;
            
            return (
              <>
                {flagUrl ? (
                  <Image
                    source={{ uri: flagUrl }}
                    style={styles.countryFlag}
                    resizeMode="cover"
                  />
                ) : flagEmoji ? (
                  <ThemedText style={styles.countryFlagEmoji}>{flagEmoji}</ThemedText>
                ) : (
                  <Image
                    source={require('../../../assets/login/nigeria-flag.png')}
                    style={styles.countryFlag}
                    resizeMode="cover"
                  />
                )}
                <ThemedText style={styles.countryName}>{selectedCountryName}</ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
              </>
            );
          })()}
        </TouchableOpacity>
      </View>

      {/* Buy/Sell Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Buy' && styles.tabActive]}
          onPress={() => setActiveTab('Buy')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Buy' && styles.tabTextActive]}>Buy</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Sell' && styles.tabActive]}
          onPress={() => setActiveTab('Sell')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Sell' && styles.tabTextActive]}>Sell</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => {
            setAssetModalContext('filter');
            setShowAssetModal(true);
          }}
        >
          <Image
            source={require('../../../assets/CurrencyBtc.png')}
            style={styles.filterAssetIcon}
            resizeMode="cover"
          />
          <ThemedText style={styles.filterItemText} numberOfLines={1} ellipsizeMode="tail">
            {selectedAsset?.name || 'USDT'}
          </ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={10 * SCALE} color="#FFFFFF" style={{ flexShrink: 0 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => setShowAmountModal(true)}
        >
          <ThemedText style={styles.filterItemText} numberOfLines={1} ellipsizeMode="tail">
            Amount
          </ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={10 * SCALE} color="#FFFFFF" style={{ flexShrink: 0 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => setShowPaymentMethodModal(true)}
        >
          <ThemedText style={styles.filterItemText} numberOfLines={1} ellipsizeMode="tail">
            Payment
          </ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={10 * SCALE} color="#FFFFFF" style={{ flexShrink: 0 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialCommunityIcons name="filter" size={20 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Trading Offers List */}
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
        {isLoadingAds ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="small" color="#A9EF45" />
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
              Loading ads...
            </ThemedText>
          </View>
        ) : isAdsError ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
            <ThemedText style={{ color: '#ff0000', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
              {(() => {
                const errorMessage = adsError?.message || 'Failed to load ads. Please try again.';
                // Provide user-friendly error messages
                if (errorMessage.includes('Invalid ad ID format')) {
                  return 'Unable to load ads at this time. Please try again later.';
                }
                if (errorMessage.includes('404') || errorMessage.includes('Not found')) {
                  return 'No ads available. Please try adjusting your filters.';
                }
                if (errorMessage.includes('400')) {
                  return 'Invalid search parameters. Please check your filters.';
                }
                if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                  return 'Session expired. Please log in again.';
                }
                if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                  return 'Server error. Please try again later.';
                }
                return errorMessage;
              })()}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { marginTop: 20 }]}
              onPress={() => refetchAds()}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : tradingOffers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <MaterialCommunityIcons name="information" size={40 * SCALE} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
              No ads available for {selectedAsset?.name || 'selected asset'} in {selectedCountryName}
            </ThemedText>
          </View>
        ) : (
          tradingOffers.map((offer) => (
          <LinearGradient
            key={offer.id}
            colors={['#FFFFFF0D', '#FFFFFF0D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.offerCard}
          >
            {/* Trader Info */}
            <View style={styles.traderInfo}>
              <Image source={offer.traderAvatar} style={styles.traderAvatar} resizeMode="cover" />
              <View style={styles.traderDetails}>
                <ThemedText style={styles.traderName}>{offer.traderName}</ThemedText>
                <ThemedText style={styles.onlineStatus}>Online</ThemedText>
                <View style={styles.traderStats}>

                  <ThemedText style={styles.statText}>No of trades: {offer.numberOfTrades.toLocaleString()}</ThemedText>
                  <ThemedText style={styles.statText}>Response Time: {offer.responseTime}</ThemedText>
                  <ThemedText style={styles.statText}>Score: {offer.score}%</ThemedText>
                </View>
              </View>
            </View>

            {/* Offer Details */}
            <View style={styles.offerDetails}>
              <View style={[styles.offerDetailRow, styles.offerDetailRowFirst]}>
                <ThemedText style={styles.offerDetailLabel}>Available Quantity</ThemedText>
                <ThemedText style={styles.offerDetailValue}>{offer.availableQuantity}</ThemedText>
              </View>
              <View style={styles.offerDetailRow}>
                <ThemedText style={styles.offerDetailLabel}>Limits</ThemedText>
                <ThemedText style={styles.offerDetailValue}>{offer.limits}</ThemedText>
              </View>
              <View style={[styles.offerDetailRow, styles.offerDetailRowLast]}>
                <ThemedText style={styles.offerDetailLabel}>Payment Methods</ThemedText>
                <ThemedText style={styles.offerDetailValue}>{offer.paymentMethods.join(', ')}</ThemedText>
              </View>
            </View>

            {/* Price and Buy Button */}
            <View style={styles.priceSection}>
              <View style={styles.priceInfo}>
                <ThemedText style={styles.priceLabel}>Price / 1 USDT</ThemedText>
                <ThemedText style={styles.priceValue}>{offer.price} NGN</ThemedText>
              </View>
              <TouchableOpacity 
                style={[styles.buyButton, !isBuyButtonEnabled(offer) && styles.buyButtonDisabled]}
                onPress={() => activeTab === 'Buy' ? handleBuyPress(offer) : handleSellPress(offer)}
                disabled={!isBuyButtonEnabled(offer)}
              >
                <ThemedText style={styles.buyButtonText}>
                  {activeTab === 'Buy' ? 'Buy' : 'Sell'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          ))
        )}
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
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
            {isLoadingTokens ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading assets...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {availableAssets.map((asset: any) => {
                  const isSelected = assetModalContext === 'buy' 
                    ? buyModalToken?.id === asset.id 
                    : selectedAsset?.id === asset.id;
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={styles.assetItem}
                      onPress={() => {
                        if (assetModalContext === 'buy') {
                          setBuyModalToken(asset);
                        } else {
                          setSelectedAsset(asset);
                        }
                        setShowAssetModal(false);
                        setAssetModalContext('filter');
                      }}
                    >
                      <Image
                        source={asset.icon}
                        style={styles.assetItemIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.assetItemInfo}>
                        <ThemedText style={styles.assetItemName}>{asset.name}</ThemedText>
                        <ThemedText style={styles.assetItemBalance}>Bal : {asset.balance}</ThemedText>
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24 * SCALE}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowAssetModal(false)}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Amount Modal */}
      <Modal
        visible={showAmountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAmountModal(false)}
      >
        <View style={styles.amountModalOverlay}>
          <View style={styles.amountModalContent}>
            <View style={styles.amountModalHeader}>
              <ThemedText style={styles.amountModalTitle}>Amount</ThemedText>
              <TouchableOpacity onPress={() => setShowAmountModal(false)}>
                <View style={styles.amountModalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputSection}>
              <ThemedText style={styles.amountInputLabel}>Amount</ThemedText>
              <View style={styles.amountInputField}>
                <TextInput
                  style={styles.amountInputText}
                  value={selectedAmount}
                  onChangeText={setSelectedAmount}
                  placeholder="Type amount in NGN"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  editable={false}
                />
              </View>
            </View>

            {/* Numeric Keypad */}
            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                {[1, 2, 3].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <View
                      style={[
                        styles.keypadCircle,
                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.keypadText,
                          lastPressedButton === num.toString() && styles.keypadTextPressed,
                        ]}
                      >
                        {num}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {[4, 5, 6].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <View
                      style={[
                        styles.keypadCircle,
                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.keypadText,
                          lastPressedButton === num.toString() && styles.keypadTextPressed,
                        ]}
                      >
                        {num}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {[7, 8, 9].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <View
                      style={[
                        styles.keypadCircle,
                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.keypadText,
                          lastPressedButton === num.toString() && styles.keypadTextPressed,
                        ]}
                      >
                        {num}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberPress('.')}
                >
                  <View
                    style={[
                      styles.keypadCircle,
                      lastPressedButton === '.' && styles.keypadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.keypadText,
                        lastPressedButton === '.' && styles.keypadTextPressed,
                      ]}
                    >
                      .
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberPress('0')}
                >
                  <View
                    style={[
                      styles.keypadCircle,
                      lastPressedButton === '0' && styles.keypadCirclePressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.keypadText,
                        lastPressedButton === '0' && styles.keypadTextPressed,
                      ]}
                    >
                      0
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberPress('backspace')}
                >
                  <View style={styles.keypadBackspace}>
                    <MaterialCommunityIcons name="backspace" size={24 * SCALE} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.amountModalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAmountConfirm}
              >
                <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAmountModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Payment Method Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <ThemedText style={styles.bankModalTitle}>Select Bank</ThemedText>
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
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView
              style={styles.bankList}
              contentContainerStyle={styles.bankListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={styles.bankListItem}
                  onPress={() => setSelectedPaymentMethod(bank.id)}
                >
                  <ThemedText style={styles.bankListItemText}>{bank.name}</ThemedText>
                  {selectedPaymentMethod === bank.id ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, !selectedPaymentMethod && styles.applyButtonDisabled]}
                onPress={() => setShowPaymentMethodModal(false)}
                disabled={!selectedPaymentMethod}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <ThemedText style={styles.filterModalTitle}>Filter</ThemedText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <View style={styles.filterModalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.filterModalScrollContainer}>
              <ScrollView
                style={styles.filterModalScroll}
                contentContainerStyle={styles.filterModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Ad Types Section */}
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>Ad Types</ThemedText>
                  <TouchableOpacity
                    style={styles.filterCheckboxItem}
                    onPress={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  >
                    <ThemedText style={styles.filterCheckboxText}>Show only verified Advertisers</ThemedText>
                    {showVerifiedOnly ? (
                      <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterCheckboxItem}
                    onPress={() => setShowEligibleOnly(!showEligibleOnly)}
                  >
                    <ThemedText style={styles.filterCheckboxText}>Show only eligible ads</ThemedText>
                    {showEligibleOnly ? (
                      <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterCheckboxItem}
                    onPress={() => setNoVerificationRequired(!noVerificationRequired)}
                  >
                    <ThemedText style={styles.filterCheckboxText}>Ads with no verification required</ThemedText>
                    {noVerificationRequired ? (
                      <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Payment Time Limit Section */}
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>Payment time limit (Min)</ThemedText>
                  <View style={styles.filterButtonGroup}>
                    {['All', '15', '30'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.filterTimeButton,
                          paymentTimeLimit === option && styles.filterTimeButtonActive,
                        ]}
                        onPress={() => setPaymentTimeLimit(option as 'All' | '15' | '30')}
                      >
                        <ThemedText
                          style={[
                            styles.filterTimeButtonText,
                            paymentTimeLimit === option && styles.filterTimeButtonTextActive,
                          ]}
                        >
                          {option}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sort By Section */}
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>Sort by</ThemedText>
                  {[
                    'Overall sorting',
                    'Completed order number',
                    'Completion rate',
                    'Price (Lowest to highest)',
                    'Price (Highest to Lowest)',
                  ].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.filterRadioItem}
                      onPress={() => setSortBy(option)}
                    >
                      <ThemedText style={styles.filterRadioText}>{option}</ThemedText>
                      {sortBy === option ? (
                        <MaterialCommunityIcons name="radiobox-marked" size={24 * SCALE} color="#A9EF45" />
                      ) : (
                        <MaterialCommunityIcons name="radiobox-blank" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterModalButtons}>
              <TouchableOpacity
                style={styles.filterConfirmButton}
                onPress={handleFilterConfirm}
              >
                <ThemedText style={styles.filterConfirmButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleFilterReset}
              >
                <ThemedText style={styles.filterResetButtonText}>Reset</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
              </TouchableOpacity>
            </View>
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading countries...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountryCode(c.code);
                      setSelectedCountryName(c.name);
                      setShowCountryModal(false);
                      // Refetch ads when country changes
                      refetchAds();
                    }}
                  >
                    {c.flagUrl ? (
                      <Image
                        source={{ uri: c.flagUrl }}
                        style={styles.countryFlagImageModal}
                        resizeMode="cover"
                      />
                    ) : c.flag ? (
                      <ThemedText style={styles.countryItemFlag}>{c.flag}</ThemedText>
                    ) : (
                      <View style={styles.countryFlagPlaceholder} />
                    )}
                    <ThemedText style={styles.countryItemName}>{c.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountryCode === c.code ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedCountryCode === c.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.applyButtonContainer}>
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

      {/* P2P Buy Modal */}
      <Modal
        visible={showBuyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBuyModal(false);
          setSelectedAd(null);
          setBuyModalAmount('');
          setSelectedPaymentMethod(null);
        }}
      >
        <View style={styles.buyModalOverlay}>
          <ScrollView 
            style={styles.buyModalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.buyModalScrollContent}
          >
            {/* Header */}
            <View style={styles.buyModalHeader}>
              <ThemedText style={styles.buyModalTitle}>
                {activeTab === 'Buy' ? 'P2P Buy' : 'P2P Sell'}
              </ThemedText>
              <TouchableOpacity onPress={() => {
                setShowBuyModal(false);
                setSelectedAd(null);
                setBuyModalAmount('');
                setSelectedPaymentMethod(null);
              }}>
                <View style={styles.buyModalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            {isLoadingAdDetails ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading ad details...
                </ThemedText>
              </View>
            ) : selectedAd ? (
              <>
                {/* Vendor Info */}
                <View style={styles.buyModalVendorInfo}>
                  <Image 
                    source={require('../../../assets/Frame 2398.png')} 
                    style={styles.buyModalVendorAvatar} 
                    resizeMode="cover" 
                  />
                  <View style={styles.buyModalVendorDetails}>
                    <ThemedText style={styles.buyModalVendorName}>
                      {selectedAd.vendor?.name || 'Unknown Vendor'}
                    </ThemedText>
                    <ThemedText style={styles.buyModalVendorScore}>
                      Score: {parseFloat(selectedAd.score || '0').toFixed(1)}% | 
                      Trades: {selectedAd.ordersReceived || 0} | 
                      Response: {selectedAd.responseTime || 0}min
                    </ThemedText>
                  </View>
                </View>

                {/* Price Info */}
                <View style={styles.buyModalPriceCard}>
                  <View style={styles.buyModalPriceRow}>
                    <ThemedText style={styles.buyModalPriceLabel}>Price per {selectedAd.cryptoCurrency || 'USDT'}</ThemedText>
                    <ThemedText style={styles.buyModalPriceValue}>
                      {parseFloat(selectedAd.price || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedAd.fiatCurrency || 'NGN'}
                    </ThemedText>
                  </View>
                  <View style={styles.buyModalPriceRow}>
                    <ThemedText style={styles.buyModalPriceLabel}>Available</ThemedText>
                    <ThemedText style={styles.buyModalPriceValue}>
                      {selectedAd.volume || '0'} {selectedAd.cryptoCurrency || 'USDT'}
                    </ThemedText>
                  </View>
                  <View style={styles.buyModalPriceRow}>
                    <ThemedText style={styles.buyModalPriceLabel}>Limits</ThemedText>
                    <ThemedText style={styles.buyModalPriceValue}>
                      {selectedAd.minOrder || '0'} - {selectedAd.maxOrder || '0'} {selectedAd.fiatCurrency || 'NGN'}
                    </ThemedText>
                  </View>
                </View>

                {/* Amount Field */}
                <View style={styles.buyModalField}>
                  <ThemedText style={styles.buyModalFieldLabel}>Amount ({selectedAd.fiatCurrency || 'NGN'})</ThemedText>
                  <View style={styles.buyModalInput}>
                    <TextInput
                      style={styles.buyModalInputText}
                      placeholder={`Enter amount (${selectedAd.minOrder || '0'} - ${selectedAd.maxOrder || '0'})`}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={buyModalAmount}
                      onChangeText={(text) => {
                        const numericValue = text.replace(/,/g, '');
                        if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
                          setBuyModalAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  {buyModalAmount && !isNaN(parseFloat(buyModalAmount.replace(/,/g, ''))) && (
                    <ThemedText style={styles.buyModalCalculatedAmount}>
                      You will receive: {((parseFloat(buyModalAmount.replace(/,/g, '')) / parseFloat(selectedAd.price || '1'))).toFixed(6)} {selectedAd.cryptoCurrency || 'USDT'}
                    </ThemedText>
                  )}
                </View>

                {/* Payment Method Selection */}
                <View style={styles.buyModalField}>
                  <ThemedText style={styles.buyModalFieldLabel}>Payment Method</ThemedText>
                  {isLoadingAdDetails ? (
                    <View style={[styles.buyModalInput, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                      <ActivityIndicator size="small" color="#A9EF45" />
                    </View>
                  ) : adDetailsData?.data?.paymentMethods && adDetailsData.data.paymentMethods.length > 0 ? (
                    <ScrollView style={styles.buyModalPaymentMethodsList}>
                      {adDetailsData.data.paymentMethods.map((pm: any) => (
                        <TouchableOpacity
                          key={pm.id}
                          style={[
                            styles.buyModalPaymentMethodItem,
                            selectedPaymentMethod === String(pm.id) && styles.buyModalPaymentMethodItemSelected,
                          ]}
                          onPress={() => setSelectedPaymentMethod(String(pm.id))}
                        >
                          <View style={styles.buyModalPaymentMethodInfo}>
                            <ThemedText style={styles.buyModalPaymentMethodType}>
                              {pm.type === 'bank_account' ? 'Bank Account' : 
                               pm.type === 'mobile_money' ? 'Mobile Money' : 
                               pm.type || 'Unknown'}
                            </ThemedText>
                            {pm.type === 'bank_account' && (
                              <ThemedText style={styles.buyModalPaymentMethodDetails}>
                                {pm.bankName || ''} - {pm.accountNumber || ''}
                              </ThemedText>
                            )}
                            {pm.type === 'mobile_money' && (
                              <ThemedText style={styles.buyModalPaymentMethodDetails}>
                                {pm.phoneNumber || ''}
                              </ThemedText>
                            )}
                          </View>
                          <MaterialCommunityIcons
                            name={selectedPaymentMethod === String(pm.id) ? 'radiobox-marked' : 'radiobox-blank'}
                            size={24 * SCALE}
                            color={selectedPaymentMethod === String(pm.id) ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={[styles.buyModalInput, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                      <ThemedText style={[styles.buyModalInputText, { color: 'rgba(255, 255, 255, 0.5)' }]}>
                        No payment methods available
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Confirm Button */}
                <View style={styles.buyModalButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.buyModalConfirmButton,
                      !isCreateOrderEnabled && styles.buyModalConfirmButtonDisabled,
                    ]}
                    onPress={handleCreateOrder}
                    disabled={!isCreateOrderEnabled}
                  >
                    {createOrderMutation.isPending ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <ThemedText style={styles.buyModalConfirmButtonText}>Create Order</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowOrderDetailsModal(false);
          setSelectedOrder(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.orderDetailsScrollContent}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Order Details</ThemedText>
              <TouchableOpacity onPress={() => {
                setShowOrderDetailsModal(false);
                setSelectedOrder(null);
              }}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {isLoadingOrderDetails ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading order details...
                </ThemedText>
              </View>
            ) : selectedOrder ? (
              <>
                {/* Order Status */}
                <View style={styles.orderStatusCard}>
                  <ThemedText style={styles.orderStatusLabel}>Status</ThemedText>
                  <ThemedText style={[
                    styles.orderStatusValue,
                    selectedOrder.status === 'completed' && { color: '#4CAF50' },
                    selectedOrder.status === 'pending' && { color: '#FFA726' },
                    selectedOrder.status === 'awaiting_payment' && { color: '#2196F3' },
                  ]}>
                    {selectedOrder.status?.toUpperCase().replace('_', ' ') || 'PENDING'}
                  </ThemedText>
                </View>

                {/* Order Info */}
                <View style={styles.orderInfoCard}>
                  <View style={styles.orderInfoRow}>
                    <ThemedText style={styles.orderInfoLabel}>Crypto Amount</ThemedText>
                    <ThemedText style={styles.orderInfoValue}>
                      {selectedOrder.cryptoAmount || '0'} {selectedAd?.cryptoCurrency || 'USDT'}
                    </ThemedText>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <ThemedText style={styles.orderInfoLabel}>Fiat Amount</ThemedText>
                    <ThemedText style={styles.orderInfoValue}>
                      {parseFloat(selectedOrder.fiatAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedAd?.fiatCurrency || 'NGN'}
                    </ThemedText>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <ThemedText style={styles.orderInfoLabel}>Price</ThemedText>
                    <ThemedText style={styles.orderInfoValue}>
                      {parseFloat(selectedOrder.price || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedAd?.fiatCurrency || 'NGN'}
                    </ThemedText>
                  </View>
                  {selectedOrder.vendor && (
                    <View style={styles.orderInfoRow}>
                      <ThemedText style={styles.orderInfoLabel}>Vendor</ThemedText>
                      <ThemedText style={styles.orderInfoValue}>
                        {selectedOrder.vendor.name || 'Unknown'}
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Payment Instructions */}
                {selectedOrder.status === 'awaiting_payment' && selectedOrder.paymentChannel === 'offline' && (
                  <View style={styles.paymentInstructionsCard}>
                    <ThemedText style={styles.paymentInstructionsTitle}>Payment Instructions</ThemedText>
                    <ThemedText style={styles.paymentInstructionsText}>
                      Please make payment to the vendor using the selected payment method.
                      After payment, click "I've Made Payment" below.
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.paymentMadeButton}
                      onPress={() => setShowPaymentConfirmationModal(true)}
                    >
                      <ThemedText style={styles.paymentMadeButtonText}>I've Made Payment</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Auto-accepted message */}
                {selectedOrder.status === 'awaiting_payment' && selectedAd?.autoAccept && (
                  <View style={styles.autoAcceptCard}>
                    <MaterialCommunityIcons name="check-circle" size={24 * SCALE} color="#4CAF50" />
                    <ThemedText style={styles.autoAcceptText}>
                      Order auto-accepted! Please proceed with payment.
                    </ThemedText>
                  </View>
                )}

                {/* Waiting for vendor */}
                {selectedOrder.status === 'pending' && (
                  <View style={styles.waitingCard}>
                    <ActivityIndicator size="small" color="#A9EF45" />
                    <ThemedText style={styles.waitingText}>
                      Waiting for vendor to accept order...
                    </ThemedText>
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentConfirmationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Confirm Payment</ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentConfirmationModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentConfirmationContent}>
              <ThemedText style={styles.paymentConfirmationText}>
                Have you completed the payment to the vendor?
              </ThemedText>
              <ThemedText style={styles.paymentConfirmationSubtext}>
                Please ensure you have made the payment before confirming.
              </ThemedText>

              <View style={styles.paymentConfirmationButtons}>
                <TouchableOpacity
                  style={[styles.paymentConfirmationButton, styles.paymentConfirmationButtonCancel]}
                  onPress={() => setShowPaymentConfirmationModal(false)}
                >
                  <ThemedText style={styles.paymentConfirmationButtonCancelText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentConfirmationButton,
                    styles.paymentConfirmationButtonConfirm,
                    markPaymentMadeMutation.isPending && styles.paymentConfirmationButtonDisabled,
                  ]}
                  onPress={handleConfirmPayment}
                  disabled={markPaymentMadeMutation.isPending}
                >
                  {markPaymentMadeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <ThemedText style={styles.paymentConfirmationButtonConfirmText}>Yes, I've Paid</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default P2PFundScreen;

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
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft:40,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: '#020C19',
    borderWidth: 0.3,
    borderColor: '#FFFFFF80',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 7 * SCALE,
    paddingVertical: 6 * SCALE,
  },
  countryFlag: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 200 * SCALE,
  },
  countryName: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 100,
    padding: 4 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  tab: {
    flex: 1,
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  tabActive: {
    backgroundColor: '#A9EF45',
  },
  tabText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8 * SCALE,
    marginBottom: 20 * SCALE,
    paddingVertical: 6 * SCALE,
    gap: 4 * SCALE,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20 * SCALE,
    flexWrap: 'nowrap',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 6 * SCALE,
    paddingVertical: 4 * SCALE,
    gap: 3 * SCALE,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    maxWidth: '30%',
  },
  filterItemText: {
    fontSize: 9 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    flexShrink: 1,
    maxWidth: '75%',
  },
  filterAssetIcon: {
    width: 12 * SCALE,
    height: 12 * SCALE,
    borderRadius: 6 * SCALE,
    flexShrink: 0,
  },
  filterIconButton: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 2 * SCALE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 100 * SCALE,
  },
  offerCard: {
    borderWidth: 0.3,
    borderColor: '#E8E8E8',
    borderTopColor: '#A9EF45',
    borderRightColor: '#A9EF45',
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 15 * SCALE,
    overflow: 'hidden',
  },
  traderInfo: {
    flexDirection: 'row',
    marginBottom: 15 * SCALE,
  },
  traderAvatar: {
    width: 34 * 1,
    height: 34 * 1,
    borderRadius: 25 * SCALE,
    marginRight: 10 * SCALE,
  },
  traderDetails: {
    flex: 1,
  },
  traderName: {
    fontSize: 14 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  onlineStatus: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#4CAF50',
    marginBottom: 8 * SCALE,
  },
  traderStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10 * SCALE,
    marginTop: 5,
  },
  statText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  offerDetails: {
    marginBottom: 15 * SCALE,
    paddingTop: 30* SCALE,
    gap: 0,
  },
  offerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12 * SCALE,
    paddingTop: 12 * SCALE,
    borderWidth: 0.3,
    backgroundColor: '#FFFFFF08',
    paddingHorizontal: 10 * SCALE,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  offerDetailRowFirst: {
    borderTopLeftRadius: 7 * SCALE,
    borderTopRightRadius: 7 * SCALE,
  },
  offerDetailRowLast: {
    borderBottomLeftRadius: 7 * SCALE,
    borderBottomRightRadius: 7 * SCALE,
  },
  offerDetailLabel: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  offerDetailValue: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10 * SCALE,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4 * SCALE,
  },
  priceValue: {
    fontSize: 20 * 1,
    fontWeight: '600',
    color: '#8BC34A',
  },
  buyButton: {
    backgroundColor: '#8BC34A',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 22 * SCALE,
    paddingVertical: 12 * SCALE,
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#000',
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
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
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
  applyButtonContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  countryItemFlag: {
    fontSize: 20 * SCALE,
    marginRight: 15 * SCALE,
  },
  countryItemName: {
    flex: 1,
    fontSize: 11.2 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  // Amount Modal Styles
  amountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  amountModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
  },
  amountModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  amountModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  amountModalCloseCircle: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInputSection: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 30 * SCALE,
  },
  amountInputLabel: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  amountInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 60 * SCALE,
    paddingHorizontal: 15 * SCALE,
    justifyContent: 'center',
  },
  amountInputText: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  amountInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  keypad: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 30 * SCALE,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20 * SCALE,
  },
  keypadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8 * SCALE,
  },
  keypadCircle: {
    width: 60 * SCALE,
    height: 60 * SCALE,
    borderRadius: 30 * SCALE,
    backgroundColor: '#020C19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadCirclePressed: {
    backgroundColor: '#A9EF45',
  },
  keypadText: {
    fontSize: 20 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  keypadTextPressed: {
    color: '#000000',
  },
  keypadBackspace: {
    width: 60 * SCALE,
    height: 60 * SCALE,
    borderRadius: 30 * SCALE,
    backgroundColor: '#020C19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountModalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20 * SCALE,
    gap: 12 * SCALE,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    // paddingHorizontal: 20 * SCALE,
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17 * SCALE,
  },
  cancelButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Bank Modal Styles
  bankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 29, 51, 0.8)',
  },
  bankModalContent: {
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
  bankModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30* SCALE,
    paddingBottom: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: '#484848',
  },
  bankModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  bankList: {
    flex: 1,
    paddingHorizontal: 20 * SCALE,
    marginTop: 6 * SCALE,
  },
  bankListContent: {
    paddingBottom: 20 * SCALE,
  },
  bankListItem: {
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
  bankListItemText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
    minHeight: '85%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  filterModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterModalCloseCircle: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalScrollContainer: {
    flex: 1,
  },
  filterModalScroll: {
    flex: 1,
  },
  filterModalScrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  filterSection: {
    marginBottom: 30 * SCALE,
  },
  filterSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
  },
  filterCheckboxItem: {
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
  filterCheckboxText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterButtonGroup: {
    flexDirection: 'row',
    gap: 12 * SCALE,
  },
  filterTimeButton: {
    flex: 1,
    backgroundColor: '#020C19',
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF80',
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTimeButtonActive: {
    backgroundColor: '#A9EF45',
  },
  filterTimeButtonText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterTimeButtonTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  filterRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  filterRadioText: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  filterModalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    gap: 12 * SCALE,
  },
  filterConfirmButton: {
    flex: 1,
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterConfirmButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  filterResetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17 * SCALE,
  },
  filterResetButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // P2P Buy Modal Styles
  buyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  buyModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
  },
  buyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  buyModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  buyModalCloseCircle: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyModalField: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  buyModalFieldLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  buyModalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15 * SCALE,
    height: 60 * SCALE,
  },
  buyModalInputText: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  buyModalInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buyModalButtonContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  buyModalConfirmButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyModalConfirmButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  buyModalConfirmButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.5)',
    opacity: 0.5,
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(139, 195, 74, 0.5)',
    opacity: 0.5,
  },
  retryButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingHorizontal: 30 * SCALE,
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  countryFlagEmoji: {
    fontSize: 24 * SCALE,
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
  buyModalScrollContent: {
    paddingBottom: 40 * SCALE,
  },
  buyModalVendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  buyModalVendorAvatar: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    borderRadius: 25 * SCALE,
    marginRight: 15 * SCALE,
  },
  buyModalVendorDetails: {
    flex: 1,
  },
  buyModalVendorName: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  buyModalVendorScore: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buyModalPriceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  buyModalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10 * SCALE,
  },
  buyModalPriceLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buyModalPriceValue: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyModalCalculatedAmount: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#A9EF45',
    marginTop: 8 * SCALE,
  },
  buyModalPaymentMethodsList: {
    maxHeight: 200 * SCALE,
  },
  buyModalPaymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginBottom: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buyModalPaymentMethodItemSelected: {
    borderColor: '#A9EF45',
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
  },
  buyModalPaymentMethodInfo: {
    flex: 1,
    marginRight: 10 * SCALE,
  },
  buyModalPaymentMethodType: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  buyModalPaymentMethodDetails: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  orderDetailsScrollContent: {
    paddingBottom: 40 * SCALE,
  },
  orderStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
  },
  orderStatusLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8 * SCALE,
  },
  orderStatusValue: {
    fontSize: 18 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15 * SCALE,
  },
  orderInfoLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  orderInfoValue: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentInstructionsCard: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: '#A9EF45',
  },
  paymentInstructionsTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
    marginBottom: 8 * SCALE,
  },
  paymentInstructionsText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15 * SCALE,
  },
  paymentMadeButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMadeButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  autoAcceptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    gap: 10 * SCALE,
  },
  autoAcceptText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#4CAF50',
    flex: 1,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    gap: 10 * SCALE,
  },
  waitingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFA726',
    flex: 1,
  },
  paymentConfirmationContent: {
    padding: 20 * SCALE,
  },
  paymentConfirmationText: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
    textAlign: 'center',
  },
  paymentConfirmationSubtext: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30 * SCALE,
    textAlign: 'center',
  },
  paymentConfirmationButtons: {
    flexDirection: 'row',
    gap: 12 * SCALE,
  },
  paymentConfirmationButton: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentConfirmationButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentConfirmationButtonConfirm: {
    backgroundColor: '#A9EF45',
  },
  paymentConfirmationButtonDisabled: {
    opacity: 0.5,
  },
  paymentConfirmationButtonCancelText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  paymentConfirmationButtonConfirmText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
});

