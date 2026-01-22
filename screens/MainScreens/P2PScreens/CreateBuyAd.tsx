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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { useGetPaymentMethods } from '../../../queries/paymentSettings.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetVirtualAccounts } from '../../../queries/crypto.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useCreateBuyAd, useUpdateP2PAd } from '../../../mutations/p2p.mutations';
import { showSuccessAlert, showErrorAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  name: string;
  type?: string;
}

interface Crypto {
  id: string;
  name: string;
  symbol: string;
  icon: any;
}

interface Country {
  id: number;
  name: string;
  code: string;
  flag: any;
  flagUrl?: string | null;
}

const CreateBuyAd = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const routeParams = route.params as { 
    editMode?: boolean; 
    adId?: string; 
    adData?: any;
  } | undefined;
  
  const isEditMode = routeParams?.editMode || false;
  const adId = routeParams?.adId || '';
  const editAdData = routeParams?.adData;
  
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState('USDT');
  const [selectedCurrency, setSelectedCurrency] = useState('Nigeria');
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState('NGN');
  const [buyPrice, setBuyPrice] = useState('');
  const [volume, setVolume] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxOrder, setMaxOrder] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchPaymentQuery, setSearchPaymentQuery] = useState('');

  // Fetch payment methods from API
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPaymentMethods,
  } = useGetPaymentMethods();

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Fetch virtual accounts to get available crypto currencies
  const {
    data: virtualAccountsData,
    isLoading: isLoadingCrypto,
  } = useGetVirtualAccounts();

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
  } = useGetWalletBalances();

  // Transform payment methods data
  const availablePaymentMethods: PaymentMethod[] = useMemo(() => {
    if (!paymentMethodsData?.data || !Array.isArray(paymentMethodsData.data)) {
      return [];
    }
    return paymentMethodsData.data.map((method: any) => ({
      id: String(method.id),
      name: method.bankName || method.provider?.name || method.type || 'Unknown',
      type: method.type,
    }));
  }, [paymentMethodsData?.data]);

  // Filter payment methods by search query
  const filteredPaymentMethods = useMemo(() => {
    if (!searchPaymentQuery.trim()) {
      return availablePaymentMethods;
    }
    const query = searchPaymentQuery.toLowerCase();
    return availablePaymentMethods.filter((method) =>
      method.name.toLowerCase().includes(query)
    );
  }, [availablePaymentMethods, searchPaymentQuery]);

  // Transform countries data
  const currencies: Country[] = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      // Fallback to default countries
      return [
        { id: 1, name: 'Nigeria', code: 'NG', flag: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 2, name: 'Botswana', code: 'BW', flag: require('../../../assets/login/south-africa-flag.png'), flagUrl: null },
        { id: 3, name: 'Ghana', code: 'GH', flag: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 4, name: 'Kenya', code: 'KE', flag: require('../../../assets/login/south-africa-flag.png'), flagUrl: null },
        { id: 5, name: 'South Africa', code: 'ZA', flag: require('../../../assets/login/south-africa-flag.png'), flagUrl: null },
      ];
    }
    return countriesData.data.map((country: any, index: number) => {
      const flagValue = country.flag || '';
      const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
      const flagUrl = isFlagUrl 
        ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
        : null;
      const defaultFlag = require('../../../assets/login/nigeria-flag.png');
      
      return {
        id: country.id || index + 1,
        name: country.name || '',
        code: country.code || '',
        flag: defaultFlag,
        flagUrl: flagUrl,
      };
    });
  }, [countriesData?.data]);

  // Transform crypto currencies from virtual accounts
  const cryptos: Crypto[] = useMemo(() => {
    // Common crypto currencies list
    const commonCryptos: Crypto[] = [
      { id: '1', name: 'Bitcoin', symbol: 'BTC', icon: require('../../../assets/login/bitcoin-coin.png') },
      { id: '2', name: 'USDT', symbol: 'USDT', icon: require('../../../assets/login/usdt-coin.png') },
      { id: '3', name: 'Ethereum', symbol: 'ETH', icon: require('../../../assets/login/usdt-coin.png') },
      { id: '4', name: 'BNB', symbol: 'BNB', icon: require('../../../assets/login/bitcoin-coin.png') },
      { id: '5', name: 'USDC', symbol: 'USDC', icon: require('../../../assets/login/usdt-coin.png') },
    ];

    // If virtual accounts are available, add unique currencies from there
    if (virtualAccountsData?.data && Array.isArray(virtualAccountsData.data)) {
      const uniqueCurrencies = new Set<string>();
      virtualAccountsData.data.forEach((account: any) => {
        if (account.currency && !uniqueCurrencies.has(account.currency)) {
          uniqueCurrencies.add(account.currency);
        }
      });

      // Add currencies from virtual accounts that aren't already in common list
      uniqueCurrencies.forEach((currency) => {
        const symbol = currency.toUpperCase();
        if (!commonCryptos.find(c => c.symbol === symbol)) {
          commonCryptos.push({
            id: String(commonCryptos.length + 1),
            name: symbol,
            symbol: symbol,
            icon: require('../../../assets/login/usdt-coin.png'),
          });
        }
      });
    }

    return commonCryptos;
  }, [virtualAccountsData?.data]);

  // Get crypto balance for selected crypto
  const cryptoBalance = useMemo(() => {
    if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data)) {
      return '0';
    }
    const account = virtualAccountsData.data.find(
      (acc: any) => acc.currency?.toUpperCase() === selectedCryptoSymbol.toUpperCase()
    );
    return account?.balance || '0';
  }, [virtualAccountsData?.data, selectedCryptoSymbol]);

  // Get fiat balance for selected currency
  const fiatBalance = useMemo(() => {
    if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) {
      return '0';
    }
    const wallet = balancesData.data.fiat.find(
      (w: any) => w.currency === selectedFiatCurrency
    );
    return wallet?.balance || '0';
  }, [balancesData?.data?.fiat, selectedFiatCurrency]);

  // Create buy ad mutation
  const createBuyAdMutation = useCreateBuyAd({
    onSuccess: (data) => {
      showSuccessAlert('Success', 'Buy ad created successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['p2p', 'vendor', 'ads'] });
        queryClient.invalidateQueries({ queryKey: ['p2p', 'ads'] });
        setShowSuccessModal(true);
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to create buy ad');
    },
  });

  // Update ad mutation
  const updateAdMutation = useUpdateP2PAd({
    onSuccess: (data) => {
      showSuccessAlert('Success', 'Ad updated successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['p2p', 'vendor', 'ads'] });
        queryClient.invalidateQueries({ queryKey: ['p2p', 'ads'] });
        queryClient.invalidateQueries({ queryKey: ['p2p', 'ads', adId] });
        navigation.goBack();
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to update ad');
    },
  });

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    if (!selectedPaymentMethods.find(m => m.id === method.id)) {
      setSelectedPaymentMethods([...selectedPaymentMethods, method]);
    }
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    setSelectedPaymentMethods(selectedPaymentMethods.filter(m => m.id !== methodId));
  };

  const handleCreateOrder = () => {
    // Validation
    if (!selectedCryptoSymbol || !selectedFiatCurrency) {
      showErrorAlert('Validation Error', 'Please select crypto and currency');
      return;
    }
    if (!buyPrice || !volume || !minOrder || !maxOrder) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }
    if (selectedPaymentMethods.length === 0) {
      showErrorAlert('Validation Error', 'Please select at least one payment method');
      return;
    }
    if (parseFloat(buyPrice) <= 0 || parseFloat(volume) <= 0 || parseFloat(minOrder) <= 0 || parseFloat(maxOrder) <= 0) {
      showErrorAlert('Validation Error', 'Price, volume, and order limits must be greater than 0');
      return;
    }
    if (parseFloat(minOrder) >= parseFloat(maxOrder)) {
      showErrorAlert('Validation Error', 'Min order must be less than max order');
      return;
    }

    if (isEditMode && adId) {
      // Update existing ad
      updateAdMutation.mutate({
        adId: adId,
        price: buyPrice,
        volume: volume,
        minOrder: minOrder,
        maxOrder: maxOrder,
        autoAccept: autoAccept,
        paymentMethodIds: selectedPaymentMethods.map(m => m.id),
        countryCode: selectedCountryCode,
        description: `Buy ${selectedCryptoSymbol} at best rates`,
      });
    } else {
      // Create new buy ad
      createBuyAdMutation.mutate({
        cryptoCurrency: selectedCryptoSymbol,
        fiatCurrency: selectedFiatCurrency,
        price: buyPrice,
        volume: volume,
        minOrder: minOrder,
        maxOrder: maxOrder,
        autoAccept: autoAccept,
        paymentMethodIds: selectedPaymentMethods.map(m => m.id),
        countryCode: selectedCountryCode,
        description: `Buy ${selectedCryptoSymbol} at best rates`,
      });
    }
  };

  // Populate form fields when in edit mode
  useEffect(() => {
    if (isEditMode && editAdData && !isLoadingPaymentMethods && availablePaymentMethods.length > 0) {
      console.log('[CreateBuyAd] Populating form fields for edit mode:', editAdData);
      
      // Set crypto
      if (editAdData.cryptoCurrency) {
        setSelectedCryptoSymbol(editAdData.cryptoCurrency);
        const crypto = cryptos.find(c => c.symbol === editAdData.cryptoCurrency);
        if (crypto) {
          setSelectedCrypto(crypto.name);
        }
      }
      
      // Set fiat currency and country
      if (editAdData.fiatCurrency) {
        setSelectedFiatCurrency(editAdData.fiatCurrency);
      }
      if (editAdData.countryCode) {
        setSelectedCountryCode(editAdData.countryCode);
        const country = currencies.find(c => c.code === editAdData.countryCode);
        if (country) {
          setSelectedCurrency(country.name);
        }
      }
      
      // Set form values
      if (editAdData.price) setBuyPrice(String(editAdData.price));
      if (editAdData.volume) setVolume(String(editAdData.volume));
      if (editAdData.minOrder) setMinOrder(String(editAdData.minOrder));
      if (editAdData.maxOrder) setMaxOrder(String(editAdData.maxOrder));
      if (editAdData.autoAccept !== undefined) setAutoAccept(editAdData.autoAccept);
      
      // Set payment methods - wait for payment methods to load
      if (editAdData.paymentMethods && Array.isArray(editAdData.paymentMethods) && editAdData.paymentMethods.length > 0) {
        // Map payment methods from ad data to available payment methods
        const matchedPaymentMethods: PaymentMethod[] = [];
        editAdData.paymentMethods.forEach((adPm: any) => {
          const pmId = String(adPm.id || adPm.paymentMethodId || '');
          const matched = availablePaymentMethods.find(apm => String(apm.id) === pmId);
          if (matched) {
            matchedPaymentMethods.push(matched);
          } else {
            console.log('[CreateBuyAd] Payment method not found:', pmId, 'Available:', availablePaymentMethods.map(pm => pm.id));
          }
        });
        console.log('[CreateBuyAd] Matched payment methods:', matchedPaymentMethods);
        setSelectedPaymentMethods(matchedPaymentMethods);
      } else if (editAdData.paymentMethodIds && Array.isArray(editAdData.paymentMethodIds) && editAdData.paymentMethodIds.length > 0) {
        // Fallback: use payment method IDs
        const matchedPaymentMethods: PaymentMethod[] = [];
        editAdData.paymentMethodIds.forEach((pmId: string | number) => {
          const pmIdStr = String(pmId);
          const matched = availablePaymentMethods.find(apm => String(apm.id) === pmIdStr);
          if (matched) {
            matchedPaymentMethods.push(matched);
          } else {
            console.log('[CreateBuyAd] Payment method ID not found:', pmIdStr, 'Available:', availablePaymentMethods.map(pm => pm.id));
          }
        });
        console.log('[CreateBuyAd] Matched payment methods from IDs:', matchedPaymentMethods);
        setSelectedPaymentMethods(matchedPaymentMethods);
      }
    }
  }, [isEditMode, editAdData, cryptos, currencies, availablePaymentMethods, isLoadingPaymentMethods]);

  const selectedCryptoData = cryptos.find(c => c.symbol === selectedCryptoSymbol) || cryptos[0];
  const selectedCurrencyData = currencies.find(c => c.name === selectedCurrency) || currencies[0];

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return selectedCryptoSymbol &&
           selectedFiatCurrency &&
           buyPrice.trim() !== '' &&
           volume.trim() !== '' &&
           minOrder.trim() !== '' &&
           maxOrder.trim() !== '' &&
           selectedPaymentMethods.length > 0 &&
           parseFloat(buyPrice) > 0 &&
           parseFloat(volume) > 0 &&
           parseFloat(minOrder) > 0 &&
           parseFloat(maxOrder) > 0 &&
           parseFloat(minOrder) < parseFloat(maxOrder);
  }, [selectedCryptoSymbol, selectedFiatCurrency, buyPrice, volume, minOrder, maxOrder, selectedPaymentMethods]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonCircle}>
            <MaterialCommunityIcons name="chevron-left" size={20 * SCALE} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{isEditMode ? 'Edit Buy Ad' : 'Create Buy Ad'}</ThemedText>
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => {
            (navigation as any).navigate('Settings', {
              screen: 'Support',
            });
          }}
        >
          <MaterialCommunityIcons name="headphones" size={24 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Select crypto to Buy */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select crypto to Buy</ThemedText>
          <TouchableOpacity
            onPress={() => setShowCryptoModal(true)}
          >
            <LinearGradient
              colors={['#A9EF4533', '#FFFFFF0D']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectorCard}
            >
              <View style={styles.selectorCardLeft}>
                <ThemedText style={styles.balanceLabel}>My Balance</ThemedText>
                <View style={styles.balanceRow}>
                  <Image
                    source={require('../../../assets/Vector (34).png')}
                    style={[{ marginBottom: -1, width: 18, height: 16 }]}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.balanceAmount}>
                    {isLoadingCrypto ? '...' : parseFloat(cryptoBalance).toFixed(8)} {selectedCryptoData.symbol}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.selectorCardRight}>
                <Image
                  source={selectedCryptoData.icon}
                  style={styles.cryptoIcon}
                  resizeMode="contain"
                />
                <ThemedText style={styles.selectorText}>{selectedCryptoData.name}</ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Currency to receive */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Currency to receive</ThemedText>
          <TouchableOpacity
            onPress={() => setShowCurrencyModal(true)}
          >
            <LinearGradient
              colors={['#A9EF4533', '#FFFFFF0D']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectorCard}
            >
              <View style={styles.selectorCardLeft}>
                <ThemedText style={styles.balanceLabel}>My Balance</ThemedText>
                <View style={styles.balanceRow}>
                  <Image
                    source={require('../../../assets/Vector (34).png')}
                    style={[{ marginBottom: -1, width: 18, height: 16 }]}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.balanceAmount}>
                    {isLoadingBalances ? '...' : `N${parseFloat(fiatBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.selectorCardRight}>
                <Image
                  source={selectedCurrencyData.flag}
                  style={styles.currencyFlag}
                  resizeMode="contain"
                />
                <ThemedText style={styles.selectorText}>{selectedCurrency}</ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Order Details */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF08', borderRadius: 10 * SCALE, borderWidth: 0.3, borderColor: 'rgba(255, 255, 255, 0.2)', padding: 15 * SCALE }]}>
          <ThemedText style={styles.sectionTitle}>Order Details</ThemedText>

          {/* Buy Price and Market Price in one card */}
          <View style={styles.priceCard}>
            <TextInput
              style={styles.buyPriceInput}
              placeholder="Enter buy price"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={buyPrice}
              onChangeText={setBuyPrice}
            />
            <View style={styles.priceDivider} />
            <View style={styles.marketPriceRow}>
              <ThemedText style={styles.marketPriceLabel}>Market Price</ThemedText>
              <ThemedText style={styles.marketPriceValue}>N1,500</ThemedText>
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="Volume"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={volume}
            onChangeText={setVolume}
          />

          <View style={styles.orderLimitsRow}>
            <TextInput
              style={[styles.input, styles.textInput, styles.inputHalf]}
              placeholder="Min Order"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={minOrder}
              onChangeText={setMinOrder}
            />
            <TextInput
              style={[styles.input, styles.textInput, styles.inputHalf]}
              placeholder="Max Order"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={maxOrder}
              onChangeText={setMaxOrder}
            />
          </View>

          <View style={styles.autoAcceptRow}>
            <ThemedText style={styles.autoAcceptLabel}>Automatically accept orders</ThemedText>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: '#767577', true: '#A9EF45' }}
              thumbColor={autoAccept ? '#000000' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Payment details */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF08', borderRadius: 10 * SCALE, borderWidth: 0.3, borderColor: 'rgba(255, 255, 255, 0.2)', padding: 15 * SCALE }]}>
          <ThemedText style={styles.sectionTitle}>Payment details</ThemedText>

          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowPaymentMethodModal(true)}
          >
            <ThemedText style={styles.inputPlaceholder}>Select payment method</ThemedText>
            <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          {/* Selected Payment Methods */}
          {selectedPaymentMethods.length > 0 && (
            <View style={styles.selectedMethodsContainer}>
              {selectedPaymentMethods.map((method) => (
                <View key={method.id} style={styles.methodTag}>
                  <ThemedText style={styles.methodTagText}>{method.name}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleRemovePaymentMethod(method.id)}
                    style={styles.methodTagClose}
                  >
                    <MaterialCommunityIcons name="close" size={14 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.createOrderButton,
            (!isFormValid || createBuyAdMutation.isPending || updateAdMutation.isPending) && styles.createOrderButtonDisabled
          ]}
          onPress={handleCreateOrder}
          disabled={!isFormValid || createBuyAdMutation.isPending || updateAdMutation.isPending}
        >
          {(createBuyAdMutation.isPending || updateAdMutation.isPending) ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.createOrderButtonText}>
              {isEditMode ? 'Update Ad' : 'Create Order'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={40 * SCALE} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.successModalTitle}>
              {isEditMode ? 'Buy Ad Updated' : 'Buy Ad Created'}
            </ThemedText>
            <ThemedText style={styles.successModalMessage}>
              {isEditMode 
                ? 'Congratulations, your buy ad has been updated successfully'
                : 'Congratulations, your buy ad has been created successfully'}
            </ThemedText>
            <View style={styles.successModalButtons}>
              <TouchableOpacity
                style={styles.viewAdButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  (navigation as any).navigate('Settings', {
                    screen: 'MyAdsScreen',
                  });
                }}
              >
                <ThemedText style={styles.viewAdButtonText}>View Ad</ThemedText>
              </TouchableOpacity>
              <View style={styles.successModalButtonDivider} />
              <TouchableOpacity
                style={styles.cancelSuccessButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
              >
                <ThemedText style={styles.cancelSuccessButtonText}>Cancel</ThemedText>
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
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Payment Method</ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Payment Method"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchPaymentQuery}
                onChangeText={setSearchPaymentQuery}
              />
            </View>

            {isLoadingPaymentMethods ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading payment methods...
                </ThemedText>
              </View>
            ) : filteredPaymentMethods.length > 0 ? (
              <ScrollView style={styles.paymentMethodList} showsVerticalScrollIndicator={false}>
                {filteredPaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentMethodItem}
                  onPress={() => handleSelectPaymentMethod(method)}
                >
                  <ThemedText style={styles.paymentMethodItemText}>{method.name}</ThemedText>
                  {selectedPaymentMethods.find(m => m.id === method.id) ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', paddingHorizontal: 20 }}>
                  {searchPaymentQuery ? 'No payment methods found' : 'No payment methods available. Please add one in Payment Settings.'}
                </ThemedText>
              </View>
            )}

            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, selectedPaymentMethods.length === 0 && styles.applyButtonDisabled]}
                onPress={() => setShowPaymentMethodModal(false)}
                disabled={selectedPaymentMethods.length === 0}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Crypto Modal */}
      <Modal
        visible={showCryptoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCryptoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Crypto</ThemedText>
              <TouchableOpacity onPress={() => setShowCryptoModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {isLoadingCrypto ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading cryptocurrencies...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {cryptos.map((crypto) => (
                <TouchableOpacity
                  key={crypto.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCrypto(crypto.name);
                    setSelectedCryptoSymbol(crypto.symbol);
                    setShowCryptoModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Image source={crypto.icon} style={styles.modalCryptoIcon} resizeMode="contain" />
                    <ThemedText style={styles.modalItemText}>{crypto.name}</ThemedText>
                  </View>
                  {selectedCryptoSymbol === crypto.symbol && (
                    <MaterialCommunityIcons name="check" size={20 * SCALE} color="#A9EF45" />
                  )}
                </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Select Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.countryModalHeader}>
              <ThemedText style={styles.countryModalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
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
                {currencies.map((currency) => {
                  const flagSource = currency.flagUrl 
                    ? { uri: currency.flagUrl }
                    : currency.flag;
                  
                  return (
                    <TouchableOpacity
                      key={currency.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCurrency(currency.name);
                        setSelectedCountryCode(currency.code);
                        // Map country code to currency code (simplified mapping)
                        const currencyMap: { [key: string]: string } = {
                          'NG': 'NGN',
                          'KE': 'KES',
                          'GH': 'GHS',
                          'ZA': 'ZAR',
                          'BW': 'BWP',
                        };
                        setSelectedFiatCurrency(currencyMap[currency.code] || 'NGN');
                        setShowCurrencyModal(false);
                      }}
                    >
                      <Image source={flagSource} style={styles.countryFlagImage} resizeMode="cover" />
                      <ThemedText style={styles.countryName}>{currency.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={selectedCurrency === currency.name ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={selectedCurrency === currency.name ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.countryApplyButton}
              onPress={() => setShowCurrencyModal(false)}
            >
              <ThemedText style={styles.countryApplyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreateBuyAd;

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
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supportButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 25 * SCALE,
    borderRadius: 10 * SCALE,
    marginHorizontal: 20 * SCALE,
  },
  sectionLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
  },
  selectorCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 84 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectorCardLeft: {
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
  balanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  selectorCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10 * SCALE,
  },
  cryptoIcon: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 15 * SCALE,
  },
  currencyFlag: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 12 * SCALE,
  },
  selectorText: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * 1,
    padding: 15 * SCALE,
    fontSize: 14 * SCALE,
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  inputPlaceholder: {
    fontSize: 14 * 1,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputHalf: {
    flex: 1,
    marginRight: 8 * SCALE,
  },
  priceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * 1,
    marginBottom: 15 * SCALE,
    overflow: 'hidden',

  },
  buyPriceInput: {
    fontSize: 14 * 1,
    color: '#FFFFFF',
    padding: 15 * SCALE,
    paddingBottom: 40 * SCALE,

  },
  priceDivider: {
    height: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15 * SCALE,
  },
  marketPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderBottomRightRadius: 10 * SCALE,
    borderBottomLeftRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10 * SCALE,
  },
  marketPriceLabel: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  marketPriceValue: {
    fontSize: 14 * 1,
    fontWeight: '600',
    color: '#A9EF45',
  },
  orderLimitsRow: {
    flexDirection: 'row',
    gap: 8 * SCALE,
    // marginBottom: 5 * SCALE,
  },
  autoAcceptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 7 * 1,
  },
  autoAcceptLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  selectedMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 * SCALE,
    marginTop: 10 * SCALE,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 8 * SCALE,
    gap: 6 * SCALE,
  },
  methodTagText: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  methodTagClose: {
    width: 16 * SCALE,
    height: 16 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 20 * SCALE,
  },
  backButtonCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingVertical: 20 * SCALE,
    backgroundColor: '#020c19',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  createOrderButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOrderButtonDisabled: {
    opacity: 0.5,
  },
  createOrderButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  applyButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,
  },
  countryItem: {
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
  countryFlagImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  countryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  countryModalTitle: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  countryApplyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  countryApplyButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15 * SCALE,
    marginBottom: 10 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * SCALE,
    flex: 1,
  },
  modalItemText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  modalCryptoIcon: {
    width: 30 * SCALE,
    height: 30 * SCALE,
    borderRadius: 15 * SCALE,
  },
  modalCurrencyFlag: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
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
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80 * SCALE,
    height: 80 * SCALE,
    borderRadius: 40 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20 * SCALE,
  },
  successModalTitle: {
    fontSize: 20 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
    marginBottom: 12 * SCALE,
    textAlign: 'center',
  },
  successModalMessage: {
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
  viewAdButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    borderRightWidth: 0.3,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewAdButtonText: {
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
});

