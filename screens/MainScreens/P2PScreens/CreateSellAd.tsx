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
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  name: string;
}

const CreateSellAd = () => {
  const navigation = useNavigation();
  const [selectedCrypto, setSelectedCrypto] = useState('Bitcoin');
  const [selectedCurrency, setSelectedCurrency] = useState('Nigeria');
  const [sellPrice, setSellPrice] = useState('');
  const [volume, setVolume] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxOrder, setMaxOrder] = useState('');
  const [autoAccept, setAutoAccept] = useState(true);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Mock data - Replace with API calls
  const cryptos = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', icon: require('../../../assets/login/bitcoin-coin.png') },
    { id: '2', name: 'USDT', symbol: 'USDT', icon: require('../../../assets/login/usdt-coin.png') },
  ];

  const currencies = [
    { id: 1, name: 'Nigeria', flag: require('../../../assets/login/nigeria-flag.png') },
    { id: 2, name: 'Botswana', flag: require('../../../assets/login/south-africa-flag.png') },
    { id: 3, name: 'Ghana', flag: require('../../../assets/login/nigeria-flag.png') },
    { id: 4, name: 'Kenya', flag: require('../../../assets/login/south-africa-flag.png') },
    { id: 5, name: 'South Africa', flag: require('../../../assets/login/south-africa-flag.png') },
  ];

  const availablePaymentMethods: PaymentMethod[] = [
    { id: '1', name: 'RhinoxPay ID' },
    { id: '2', name: 'Bank Transfer' },
    { id: '3', name: 'Opay' },
    { id: '4', name: 'Palmpay' },
    { id: '5', name: 'Moniepoint' },
  ];

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    if (!selectedPaymentMethods.find(m => m.id === method.id)) {
      setSelectedPaymentMethods([...selectedPaymentMethods, method]);
    }
    setShowPaymentMethodModal(false);
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    setSelectedPaymentMethods(selectedPaymentMethods.filter(m => m.id !== methodId));
  };

  const selectedCryptoData = cryptos.find(c => c.name === selectedCrypto) || cryptos[0];
  const selectedCurrencyData = currencies.find(c => c.name === selectedCurrency) || currencies[0];

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
        <ThemedText style={styles.headerTitle}>Create Sell Ad</ThemedText>
        <TouchableOpacity style={styles.supportButton}>
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
                  <ThemedText style={styles.balanceAmount}>0.23 {selectedCryptoData.symbol}</ThemedText>
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
                  <ThemedText style={styles.balanceAmount}>N200,000</ThemedText>
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
          style={styles.createOrderButton}
          onPress={() => {
            // TODO: Validate form and call API
            // For now, just show success modal
            setShowSuccessModal(true);
          }}
        >
          <ThemedText style={styles.createOrderButtonText}>Create Order</ThemedText>
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
            <ThemedText style={styles.successModalTitle}>Sell Ad Created</ThemedText>
            <ThemedText style={styles.successModalMessage}>
              Congratulations, your sell ad has been created successfully
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
                placeholder="Search Bank"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <ScrollView style={styles.paymentMethodList} showsVerticalScrollIndicator={false}>
              {availablePaymentMethods.map((method) => (
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
              {cryptos.map((crypto) => (
                <TouchableOpacity
                  key={crypto.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCrypto(crypto.name);
                    setShowCryptoModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Image source={crypto.icon} style={styles.modalCryptoIcon} resizeMode="contain" />
                    <ThemedText style={styles.modalItemText}>{crypto.name}</ThemedText>
                  </View>
                  {selectedCrypto === crypto.name && (
                    <MaterialCommunityIcons name="check" size={20 * SCALE} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
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
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.id}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCurrency(currency.name);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Image source={currency.flag} style={styles.countryFlagImage} resizeMode="cover" />
                  <ThemedText style={styles.countryName}>{currency.name}</ThemedText>
                  <MaterialCommunityIcons
                    name={selectedCurrency === currency.name ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={selectedCurrency === currency.name ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
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

