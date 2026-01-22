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
import { useCreateSellAd, useUpdateP2PAd } from '../../../mutations/p2p.mutations';
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

const CreateSellAd = () => {
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
  const [sellPrice, setSellPrice] = useState('');
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
    return paymentMethodsData.data.map((method: any) => {
      let name = '';
      if (method.type === 'bank_account') {
        name = `${method.bankName || 'Bank'} - ${method.accountNumber || ''}`;
      } else if (method.type === 'mobile_money') {
        name = `${method.providerName || 'Mobile Money'} - ${method.phoneNumber || ''}`;
      } else if (method.type === 'rhinoxpay_id') {
        name = `RhinoxPay ID - ${method.rhinoxpayId || ''}`;
      } else {
        name = method.name || `${method.type} - ${method.accountNumber || method.phoneNumber || ''}`;
      }
      return {
        id: String(method.id),
        name: name,
        type: method.type,
      };
    });
  }, [paymentMethodsData]);

  // Filter payment methods by search query
  const filteredPaymentMethods = useMemo(() => {
    if (!searchPaymentQuery.trim()) {
      return availablePaymentMethods;
    }
    return availablePaymentMethods.filter(method =>
      method.name.toLowerCase().includes(searchPaymentQuery.toLowerCase())
    );
  }, [availablePaymentMethods, searchPaymentQuery]);

  // Transform countries data
  const currencies: Country[] = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return [];
    }
    return countriesData.data.map((country: any) => {
      const flagUrl = country.flagUrl
        ? `${API_BASE_URL.replace('/api', '')}${country.flagUrl}`
        : null;
      
      // Default flag mapping
      let flag = require('../../../assets/login/nigeria-flag.png');
      if (country.code === 'NG') {
        flag = require('../../../assets/login/nigeria-flag.png');
      } else if (country.code === 'ZA') {
        flag = require('../../../assets/login/south-africa-flag.png');
      }
      
      return {
        id: country.id,
        name: country.name,
        code: country.code,
        flag: flagUrl ? { uri: flagUrl } : flag,
        flagUrl: flagUrl,
      };
    });
  }, [countriesData]);

  // Transform crypto currencies from virtual accounts
  const cryptos: Crypto[] = useMemo(() => {
    if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data)) {
      // Default fallback
      return [
        { id: '1', name: 'Bitcoin', symbol: 'BTC', icon: require('../../../assets/login/bitcoin-coin.png') },
        { id: '2', name: 'USDT', symbol: 'USDT', icon: require('../../../assets/login/usdt-coin.png') },
      ];
    }
    
    const cryptoMap = new Map<string, Crypto>();
    
    virtualAccountsData.data.forEach((account: any) => {
      if (account.currency && !cryptoMap.has(account.currency)) {
        let icon = require('../../../assets/login/usdt-coin.png');
        if (account.currency === 'BTC' || account.currency === 'Bitcoin') {
          icon = require('../../../assets/login/bitcoin-coin.png');
        } else if (account.currency === 'USDT' || account.currency === 'Tether') {
          icon = require('../../../assets/login/usdt-coin.png');
        }
        
        cryptoMap.set(account.currency, {
          id: account.currency,
          name: account.currencyName || account.currency,
          symbol: account.currency,
          icon: icon,
        });
      }
    });
    
    return Array.from(cryptoMap.values());
  }, [virtualAccountsData]);

  // Get crypto balance for selected crypto
  const cryptoBalance = useMemo(() => {
    if (!balancesData?.data?.crypto || !Array.isArray(balancesData.data.crypto)) {
      return '0';
    }
    const wallet = balancesData.data.crypto.find(
      (w: any) => w.currency === selectedCryptoSymbol
    );
    return wallet?.balance || '0';
  }, [balancesData?.data?.crypto, selectedCryptoSymbol]);

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

  // Create sell ad mutation
  const createSellAdMutation = useCreateSellAd({
    onSuccess: (data) => {
      showSuccessAlert('Success', 'Sell ad created successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['p2p', 'vendor', 'ads'] });
        queryClient.invalidateQueries({ queryKey: ['p2p', 'ads'] });
        setShowSuccessModal(true);
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to create sell ad');
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

  // Populate form fields when in edit mode
  useEffect(() => {
    if (isEditMode && editAdData && !isLoadingPaymentMethods && availablePaymentMethods.length > 0) {
      console.log('[CreateSellAd] Populating form fields for edit mode:', editAdData);
      
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
      if (editAdData.price) setSellPrice(String(editAdData.price));
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
            console.log('[CreateSellAd] Payment method not found:', pmId, 'Available:', availablePaymentMethods.map(pm => pm.id));
          }
        });
        console.log('[CreateSellAd] Matched payment methods:', matchedPaymentMethods);
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
            console.log('[CreateSellAd] Payment method ID not found:', pmIdStr, 'Available:', availablePaymentMethods.map(pm => pm.id));
          }
        });
        console.log('[CreateSellAd] Matched payment methods from IDs:', matchedPaymentMethods);
        setSelectedPaymentMethods(matchedPaymentMethods);
      }
    }
  }, [isEditMode, editAdData, cryptos, currencies, availablePaymentMethods, isLoadingPaymentMethods]);

  const handleCreateOrder = () => {
    // Validation
    if (!selectedCryptoSymbol || !selectedFiatCurrency) {
      showErrorAlert('Validation Error', 'Please select crypto and currency');
      return;
    }
    if (!sellPrice || !volume || !minOrder || !maxOrder) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }
    if (selectedPaymentMethods.length === 0) {
      showErrorAlert('Validation Error', 'Please select at least one payment method');
      return;
    }
    if (parseFloat(sellPrice) <= 0 || parseFloat(volume) <= 0 || parseFloat(minOrder) <= 0 || parseFloat(maxOrder) <= 0) {
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
        price: sellPrice,
        volume: volume,
        minOrder: minOrder,
        maxOrder: maxOrder,
        autoAccept: autoAccept,
        paymentMethodIds: selectedPaymentMethods.map(m => m.id),
        countryCode: selectedCountryCode,
        description: `Sell ${selectedCryptoSymbol} at best rates`,
      });
    } else {
      // Create new sell ad
      createSellAdMutation.mutate({
        cryptoCurrency: selectedCryptoSymbol,
        fiatCurrency: selectedFiatCurrency,
        price: sellPrice,
        volume: volume,
        minOrder: minOrder,
        maxOrder: maxOrder,
        autoAccept: autoAccept,
        paymentMethodIds: selectedPaymentMethods.map(m => m.id),
        countryCode: selectedCountryCode,
        description: `Sell ${selectedCryptoSymbol} at best rates`,
      });
    }
  };

  const selectedCryptoData = cryptos.find(c => c.symbol === selectedCryptoSymbol) || cryptos[0];
  const selectedCurrencyData = currencies.find(c => c.name === selectedCurrency) || currencies[0];

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return selectedCryptoSymbol &&
           selectedFiatCurrency &&
           sellPrice.trim() !== '' &&
           volume.trim() !== '' &&
           minOrder.trim() !== '' &&
           maxOrder.trim() !== '' &&
           selectedPaymentMethods.length > 0 &&
           parseFloat(sellPrice) > 0 &&
           parseFloat(volume) > 0 &&
           parseFloat(minOrder) > 0 &&
           parseFloat(maxOrder) > 0 &&
           parseFloat(minOrder) < parseFloat(maxOrder);
  }, [selectedCryptoSymbol, selectedFiatCurrency, sellPrice, volume, minOrder, maxOrder, selectedPaymentMethods]);

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
        <ThemedText style={styles.headerTitle}>{isEditMode ? 'Edit Sell Ad' : 'Create Sell Ad'}</ThemedText>
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
        {/* Select crypto to sell */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select crypto to sell</ThemedText>
          <TouchableOpacity
            onPress={() => setShowCryptoModal(true)}
            disabled={isLoadingCrypto}
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
                  {isLoadingCrypto || isLoadingBalances ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <>
                      <Image
                        source={require('../../../assets/Vector (34).png')}
                        style={[{ marginBottom: -1, width: 18, height: 16 }]}
                        resizeMode="cover"
                      />
                      <ThemedText style={styles.balanceAmount}>
                        {parseFloat(cryptoBalance).toFixed(8)} {selectedCryptoData.symbol}
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.selectorCardRight}>
                <Image
                  source={selectedCryptoData.icon}
                  style={styles.cryptoIcon}
                  resizeMode="contain"
                />
                <ThemedText style={styles.selectorText}>{selectedCrypto}</ThemedText>
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
            disabled={isLoadingCountries}
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
                  {isLoadingBalances ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <>
                      <Image
                        source={require('../../../assets/Vector (34).png')}
                        style={[{ marginBottom: -1, width: 18, height: 16 }]}
                        resizeMode="cover"
                      />
                      <ThemedText style={styles.balanceAmount}>
                        {selectedFiatCurrency} {parseFloat(fiatBalance).toLocaleString()}
                      </ThemedText>
                    </>
                  )}
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

          {/* Sell Price and Market Price in one card */}
          <View style={styles.priceCard}>
            <TextInput
              style={styles.sellPriceInput}
              placeholder="Enter sale price"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={sellPrice}
              onChangeText={setSellPrice}
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
            disabled={isLoadingPaymentMethods}
          >
            {isLoadingPaymentMethods ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.inputPlaceholder}>Loading payment methods...</ThemedText>
              </View>
            ) : (
              <>
                <ThemedText style={styles.inputPlaceholder}>Select payment method</ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              </>
            )}
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
            (!isFormValid || createSellAdMutation.isPending) && styles.createOrderButtonDisabled
          ]}
          onPress={handleCreateOrder}
          disabled={!isFormValid || createSellAdMutation.isPending}
        >
          {createSellAdMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.createOrderButtonText}>Create Order</ThemedText>
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
              {isEditMode ? 'Sell Ad Updated' : 'Sell Ad Created'}
            </ThemedText>
            <ThemedText style={styles.successModalMessage}>
              {isEditMode 
                ? 'Congratulations, your sell ad has been updated successfully'
                : 'Congratulations, your sell ad has been created successfully'}
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
              {isLoadingPaymentMethods ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                    Loading payment methods...
                  </ThemedText>
                </View>
              ) : filteredPaymentMethods.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                    {searchPaymentQuery ? 'No payment methods found' : 'No payment methods available. Please add payment methods in Payment Settings.'}
                  </ThemedText>
                </View>
              ) : (
                filteredPaymentMethods.map((method) => (
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
                ))
              )}
            </ScrollView>

            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowPaymentMethodModal(false)}
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
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {isLoadingCrypto ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                    Loading cryptocurrencies...
                  </ThemedText>
                </View>
              ) : cryptos.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                    No cryptocurrencies available
                  </ThemedText>
                </View>
              ) : (
                cryptos.map((crypto) => (
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
                ))
              )}
            </ScrollView>
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
            <ScrollView style={styles.modalList}>
              {isLoadingCountries ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                    Loading countries...
                  </ThemedText>
                </View>
              ) : currencies.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                    No countries available
                  </ThemedText>
                </View>
              ) : (
                currencies.map((currency) => {
                  // Get currency code from country (e.g., NG -> NGN)
                  const currencyCode = currency.code === 'NG' ? 'NGN' : 
                                     currency.code === 'KE' ? 'KES' :
                                     currency.code === 'GH' ? 'GHS' :
                                     currency.code === 'ZA' ? 'ZAR' : 'NGN';
                  
                  return (
                    <TouchableOpacity
                      key={currency.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCurrency(currency.name);
                        setSelectedCountryCode(currency.code);
                        setSelectedFiatCurrency(currencyCode);
                        setShowCurrencyModal(false);
                      }}
                    >
                      <Image source={currency.flag} style={styles.countryFlagImage} resizeMode="cover" />
                      <ThemedText style={styles.countryName}>{currency.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={selectedCountryCode === currency.code ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={selectedCountryCode === currency.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
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

export default CreateSellAd;

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
    fontSize: 16 * SCALE,
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
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  sectionLabel: {
    fontSize: 12 * SCALE,
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
    fontSize: 10 * SCALE,
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
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#A9EF45',
  },
  selectorCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 12 * SCALE,
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
    fontSize: 14 * SCALE,
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
    borderRadius: 12 * SCALE,
    marginBottom: 15 * SCALE,
    overflow: 'hidden',
  },
  sellPriceInput: {
    fontSize: 14 * SCALE,
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
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  marketPriceValue: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#A9EF45',
  },
  orderLimitsRow: {
    flexDirection: 'row',
    gap: 8 * SCALE,
    marginBottom: 15 * SCALE,
  },
  autoAcceptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12 * SCALE,
    padding: 15 * SCALE,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  createOrderButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  createOrderButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
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

