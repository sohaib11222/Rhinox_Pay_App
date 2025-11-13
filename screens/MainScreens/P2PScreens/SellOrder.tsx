import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [currencyType, setCurrencyType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempSelectedPaymentMethod, setTempSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

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

  // Mock order data - TODO: Replace with API call
  const orderData = {
    vendorName: 'Qamar Malik',
    vendorAvatar: require('../../../assets/login/memoji.png'),
    vendorStatus: 'Online',
    vendorRating: '98%',
    rate: 'N1,520',
  };

  const handleSell = () => {
    if (!amount || !selectedPaymentMethod) {
      Alert.alert('Error', 'Please enter amount and select payment method');
      return;
    }
    // Navigate to sell order flow screen
    (navigation as any).navigate('Settings', {
      screen: 'SellOrderFlow',
      params: {
        amount,
        selectedPaymentMethod,
      },
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
          <Text style={styles.headerTitle}>Sell Order</Text>
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
            <Text style={styles.vendorName}>{orderData.vendorName}</Text>
            <Text style={styles.vendorStatus}>{orderData.vendorStatus}</Text>
          </View>
          <Text style={styles.vendorRating}>{orderData.vendorRating}</Text>
        </View>

        {/* Vendor Rate */}
        <Text style={styles.rateTitle}>Vendor Rate</Text>
        <LinearGradient
          colors={['#FFFFFF0D', '#A9EF4533']}    
        start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rateCard}
        >
          <View style={styles.rateContent}>
            <View>
              <Text style={styles.rateLabel}>Rate</Text>
              <Text style={styles.rateRefresh}>Refreshes in 1 min</Text>
            </View>
            <Text style={styles.rateValue}>{orderData.rate}</Text>
          </View>
        </LinearGradient>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderCardTitle}>Order Details</Text>

          {/* Currency Selectors */}
          <View style={styles.currencySelectors}>
            <TouchableOpacity
              style={[styles.currencySelector, currencyType === 'Fiat' && styles.currencySelectorActive]}
              onPress={() => setCurrencyType('Fiat')}
            >
              <Text style={[styles.currencySelectorText, currencyType === 'Fiat' && styles.currencySelectorTextActive]}>
                Fiat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.currencySelector, currencyType === 'Crypto' && styles.currencySelectorActive]}
              onPress={() => setCurrencyType('Crypto')}
            >
              <Text style={[styles.currencySelectorText, currencyType === 'Crypto' && styles.currencySelectorTextActive]}>
                Crypto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input - Different for Fiat vs Crypto */}
          {currencyType === 'Fiat' ? (
            <>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount to sell</Text>
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
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceValue}>NGN 0.00</Text>
                </View>
              </View>

              {/* You will Receive */}
              <View style={styles.receiveSection}>
                <Text style={styles.receiveLabel}>You will Receive</Text>
                <View style={styles.receiveValueContainer}>
                  <Text style={styles.receiveValue}>0.00 USDT</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Enter USDT Amount</Text>
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
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceValue}>USDT 0.00</Text>
                </View>
              </View>

              {/* You will Pay */}
              <View style={styles.receiveSection}>
                <Text style={styles.receiveLabel}>You will Receive</Text>
                <Text style={styles.payValue}>N10,000</Text>
              </View>
            </>
          )}

          {/* Payment Method */}
          <TouchableOpacity
            style={styles.paymentMethodField}
            onPress={() => setShowPaymentMethodModal(true)}
          >
            <Text style={[styles.paymentMethodText, !selectedPaymentMethod && styles.placeholder]}>
              {selectedPaymentMethod ? selectedPaymentMethod.name : 'Select payment method'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sell Button */}
      <TouchableOpacity
        style={[styles.sellButton, (!amount || !selectedPaymentMethod) && styles.sellButtonDisabled]}
        onPress={handleSell}
        disabled={!amount || !selectedPaymentMethod}
      >
        <Text style={styles.sellButtonText}>Sell</Text>
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
              <Text style={styles.modalTitle}>Select Bank</Text>
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
                  <Text style={styles.paymentMethodItemText}>{method.name}</Text>
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
                <Text style={styles.applyButtonText}>Apply</Text>
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
    paddingTop: 15 * SCALE,
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
    paddingTop: 15 * SCALE,
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
