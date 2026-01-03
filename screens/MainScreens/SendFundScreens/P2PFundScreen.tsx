import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

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
}

interface Bank {
  id: string;
  name: string;
  type: string;
}

const P2PFundScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>('Buy');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>({
    id: '1',
    name: 'USDT',
    balance: '0.00001',
    icon: require('../../../assets/CurrencyBtc.png'),
  });
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(1);
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyModalToken, setBuyModalToken] = useState<Asset | null>(null);
  const [buyModalAmount, setBuyModalAmount] = useState('');
  const [assetModalContext, setAssetModalContext] = useState<'filter' | 'buy'>('filter');

  // Filter states
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [noVerificationRequired, setNoVerificationRequired] = useState(false);
  const [paymentTimeLimit, setPaymentTimeLimit] = useState<'All' | '15' | '30'>('All');
  const [sortBy, setSortBy] = useState<string>('Overall sorting');

  // Mock data - TODO: Replace with API call
  const tradingOffers: TradingOffer[] = [
    {
      id: '1',
      traderName: 'Qamardeen Abdul Malik',
      traderAvatar: require('../../../assets/Frame 2398.png'),
      isOnline: true,
      numberOfTrades: 1200,
      responseTime: '15min',
      score: 98,
      availableQuantity: '50 USDT',
      limits: '1,600 - 75,000 NGN',
      paymentMethods: ['Opay', 'Palmpay', 'Moniepoint', 'Kudabank', 'Chipper Cash'],
      price: '1,550.70',
    },
    {
      id: '2',
      traderName: 'Qamardeen Abdul Malik',
      traderAvatar: require('../../../assets/Frame 2398.png'),
      isOnline: true,
      numberOfTrades: 1200,
      responseTime: '15min',
      score: 98,
      availableQuantity: '50 USDT',
      limits: '1,600 - 75,000 NGN',
      paymentMethods: ['Opay', 'Palmpay', 'Moniepoint', 'Kudabank', 'Chipper Cash'],
      price: '1,550.70',
    },
    {
      id: '3',
      traderName: 'Qamardeen Abdul Malik',
      traderAvatar: require('../../../assets/Frame 2398.png'),
      isOnline: true,
      numberOfTrades: 1200,
      responseTime: '15min',
      score: 98,
      availableQuantity: '50 USDT',
      limits: '1,600 - 75,000 NGN',
      paymentMethods: ['Opay', 'Palmpay', 'Moniepoint', 'Kudabank', 'Chipper Cash'],
      price: '1,550.70',
    },
  ];

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

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // Simulate data fetching - replace with actual API calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Here you would typically:
        // - Fetch latest trading offers
        // - Fetch latest asset prices
        // - Fetch latest payment methods
        // - Update any other data that needs refreshing
        console.log('Refreshing P2P trading data...');
        resolve();
      }, 1000);
    });
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
          <Image
            source={require('../../../assets/login/nigeria-flag.png')}
            style={styles.countryFlag}
            resizeMode="cover"
          />
          <ThemedText style={styles.countryName}>{selectedCountryName}</ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
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
          <ThemedText style={styles.filterItemText}>{selectedAsset?.name || 'USDT'}</ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => setShowAmountModal(true)}
        >
          <ThemedText style={styles.filterItemText}>Amount</ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => setShowPaymentMethodModal(true)}
        >
          <ThemedText style={styles.filterItemText}>Payment Method</ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
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
        {tradingOffers.map((offer) => (
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
                style={styles.buyButton}
                onPress={() => setShowBuyModal(true)}
              >
                <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ))}
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
            <ScrollView style={styles.modalList}>
              {assets.map((asset) => {
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
            <ScrollView style={styles.modalList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(c.id);
                    setSelectedCountryName(c.name);
                  }}
                >
                  <ThemedText style={styles.countryItemFlag}>{c.flag}</ThemedText>
                  <ThemedText style={styles.countryItemName}>{c.name}</ThemedText>
                  <MaterialCommunityIcons
                    name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24 * SCALE}
                    color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.buyModalOverlay}>
          <View style={styles.buyModalContent}>
            {/* Header */}
            <View style={styles.buyModalHeader}>
              <ThemedText style={styles.buyModalTitle}>P2P Buy</ThemedText>
              <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                <View style={styles.buyModalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Token Field */}
            <View style={styles.buyModalField}>
              <ThemedText style={styles.buyModalFieldLabel}>Token</ThemedText>
              <TouchableOpacity
                style={styles.buyModalInput}
                onPress={() => {
                  // Open asset modal for token selection
                  setAssetModalContext('buy');
                  setShowAssetModal(true);
                }}
              >
                <ThemedText style={[styles.buyModalInputText, !buyModalToken && styles.buyModalInputPlaceholder]}>
                  {buyModalToken ? buyModalToken.name : 'Select Asset'}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Amount Field */}
            <View style={styles.buyModalField}>
              <ThemedText style={styles.buyModalFieldLabel}>Amount</ThemedText>
              <View style={styles.buyModalInput}>
                <TextInput
                  style={styles.buyModalInputText}
                  placeholder="Enter Amount"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={buyModalAmount}
                  onChangeText={setBuyModalAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Confirm Button */}
            <View style={styles.buyModalButtonContainer}>
              <TouchableOpacity
                style={styles.buyModalConfirmButton}
                onPress={() => {
                  // TODO: Handle buy confirmation
                  setShowBuyModal(false);
                }}
              >
                <ThemedText style={styles.buyModalConfirmButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
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
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    paddingVertical: 5,
    gap: 8 * SCALE,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    textAlign: 'center',
    marginHorizontal: 20,

  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    // paddingVertical: 8 * SCALE,
    gap: 6 * SCALE,
  },
  filterItemText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterAssetIcon: {
    width: 14 * SCALE,
    height: 14 * SCALE,
    borderRadius: 7 * SCALE,
  },
  filterIconButton: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 18 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
});

