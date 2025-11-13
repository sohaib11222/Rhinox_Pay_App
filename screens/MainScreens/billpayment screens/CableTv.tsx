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
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬' },
  { id: 2, name: 'Botswana', flag: '🇧🇼' },
  { id: 3, name: 'Ghana', flag: '🇬🇭' },
  { id: 4, name: 'Kenya', flag: '🇰🇪' },
  { id: 5, name: 'South Africa', flag: '🇿🇦' },
  { id: 6, name: 'Tanzania', flag: '🇹🇿' },
  { id: 7, name: 'Uganda', flag: '🇺🇬' },
];

const BILLER_TYPES = [
  { id: '1', name: 'DSTV', icon: require('../../../assets/Ellipse 20.png') },
  { id: '2', name: 'GOTV', icon: require('../../../assets/Ellipse 21.png') },
  { id: '3', name: 'StarTimes', icon: require('../../../assets/Ellipse 21 (2).png') },
  { id: '4', name: 'ShowMax', icon: require('../../../assets/Ellipse 22.png') },
];

interface CablePlan {
  id: string;
  title: string; // e.g., "DSTV Premium"
  description: string; // e.g., "Monthly Plan - N15,000"
  category: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  price: string;
}

// Mock data plans - Replace with API calls later
const CABLE_PLANS: CablePlan[] = [
  { id: '1', title: 'DSTV Premium', description: 'Monthly Plan - N15,000', category: 'Monthly', price: 'N15,000' },
  { id: '2', title: 'DSTV Compact', description: 'Monthly Plan - N7,900', category: 'Monthly', price: 'N7,900' },
  { id: '3', title: 'DSTV Confam', description: 'Monthly Plan - N4,620', category: 'Monthly', price: 'N4,620' },
  { id: '4', title: 'GOTV Max', description: 'Monthly Plan - N3,600', category: 'Monthly', price: 'N3,600' },
  { id: '5', title: 'GOTV Jolli', description: 'Monthly Plan - N2,500', category: 'Monthly', price: 'N2,500' },
  { id: '6', title: 'GOTV Jinja', description: 'Monthly Plan - N1,900', category: 'Monthly', price: 'N1,900' },
  { id: '7', title: 'StarTimes Nova', description: 'Monthly Plan - N1,500', category: 'Monthly', price: 'N1,500' },
  { id: '8', title: 'ShowMax Premium', description: 'Monthly Plan - N2,900', category: 'Monthly', price: 'N2,900' },
];

const CableTv = () => {
  const navigation = useNavigation();
  
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

  const [selectedBillerType, setSelectedBillerType] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CablePlan | null>(null);
  const [decoderNumber, setDecoderNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBillerTypeModal, setShowBillerTypeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(1);
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '',
    fee: '',
    billerType: '',
    smartCardNumber: '',
    plan: '',
    country: '',
  });

  const handleBillerTypeSelect = (billerId: string) => {
    setSelectedBillerType(billerId);
    setShowBillerTypeModal(false);
  };

  const handlePlanSelect = (plan: CablePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.price.replace('N', '').replace(/,/g, ''));
    setShowPlanModal(false);
  };

  const handleProceed = () => {
    if (selectedBillerType && selectedPlan && decoderNumber && amount && accountName) {
      setShowSummaryModal(true);
    }
  };

  const handleComplete = () => {
    setTransactionDetails({
      amount: `N${amount}`,
      fee: 'N200',
      billerType: BILLER_TYPES.find((b) => b.id === selectedBillerType)?.name || '',
      smartCardNumber: decoderNumber,
      plan: selectedPlan?.title || '',
      country: selectedCountryName,
    });
    setShowSummaryModal(false);
    setShowSuccessModal(true);
  };

  const filteredBillers = BILLER_TYPES.filter((biller) =>
    biller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = CABLE_PLANS.filter((plan) => {
    const matchesSearch = 
      plan.title.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      plan.price.toLowerCase().includes(planSearchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Navigate back to BillPaymentMainScreen (Call tab)
              // @ts-ignore - allow parent route name
              navigation.navigate('Call' as never);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Cable TV</Text>
          </View>
        </View>

        <View style={styles.balanceSectionContainer}>
          <LinearGradient
            colors={['#A9EF4533', '#FFFFFF0D']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardContent}>
              <Text style={styles.balanceLabel}>My Balance</Text>
              <View style={styles.balanceRow}>
                <Image
                  source={require('../../../assets/Vector (34).png')}
                  style={[{ marginBottom: -1, width: 18, height: 16 }]}
                  resizeMode="cover"
                />
                <TextInput
                  style={styles.balanceAmountInput}
                  value={`N${1000000}`}
                  onChangeText={(text) => {
                    // Remove 'N' prefix and format
                    const numericValue = text.replace(/[N,]/g, '');
                    // setBalance(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                  }}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(169, 239, 69, 0.5)"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
            >
              <Image
                source={require('../../../assets/login/nigeria-flag.png')}
                style={styles.countryFlagImage}
                resizeMode="cover"
              />
              <Text style={styles.countryNameText}>{selectedCountryName}</Text>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Biller Type */}
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => setShowBillerTypeModal(true)}
            >
              <Text style={[styles.inputLabel, !selectedBillerType && styles.inputPlaceholder]}>
                {selectedBillerType
                  ? BILLER_TYPES.find((b) => b.id === selectedBillerType)?.name || 'Select Biller Type'
                  : 'Select Biller Type'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Select Plan */}
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => setShowPlanModal(true)}
            >
              <Text style={[styles.inputLabel, !selectedPlan && styles.inputPlaceholder]}>
                {selectedPlan
                  ? `${selectedPlan.title} - ${selectedPlan.price}`
                  : 'Select Plan'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Decoder Number */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Decoder Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={decoderNumber}
                onChangeText={(text) => {
                  setDecoderNumber(text);
                  // TODO: Fetch account name from API based on decoder number
                  if (text.length >= 10) {
                    setAccountName('Qamardeen Abdul Malik');
                  } else {
                    setAccountName('');
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Amount */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Amount"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={amount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/,/g, '');
                  if (numericValue === '' || /^\d+$/.test(numericValue)) {
                    setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Account Name (Auto-filled) */}
            {accountName && (
              <View style={[styles.inputField, { backgroundColor: '#020C19', justifyContent: 'center', alignItems: 'center' }]}>
                <View style={styles.accountNameContainer}>
                  <Text style={styles.accountNameLabel}>Account Name</Text>
                  <Text style={styles.accountNameValue}>{accountName}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Fee Display */}
        <View style={styles.feeSection}>
          <Image
            source={require('../../../assets/CoinVertical.png')}
            style={[{ marginBottom: -1, width: 14, height: 14 }]}
            resizeMode="cover"
          />
          <Text style={styles.feeText}>Fee : N200</Text>
        </View>

        {/* Bottom spacing for proceed button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Proceed Button - Fixed at bottom */}
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, (!selectedBillerType || !selectedPlan || !decoderNumber || !amount || !accountName) && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!selectedBillerType || !selectedPlan || !decoderNumber || !amount || !accountName}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      {/* Biller Type Selection Modal */}
      <Modal
        visible={showBillerTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBillerTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.billerModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Biller Type</Text>
              <TouchableOpacity onPress={() => setShowBillerTypeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Biller List */}
            <ScrollView style={styles.billerList}>
              {filteredBillers.map((biller) => (
                <TouchableOpacity
                  key={biller.id}
                  style={styles.billerItem}
                  onPress={() => handleBillerTypeSelect(biller.id)}
                >
                  <Image source={biller.icon} style={styles.billerIcon} resizeMode="cover" />
                  <Text style={styles.billerName}>{biller.name}</Text>
                  <MaterialCommunityIcons
                    name={selectedBillerType === biller.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24 * SCALE}
                    color={selectedBillerType === biller.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowBillerTypeModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plan Selection Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Plan</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={planSearchQuery}
                onChangeText={setPlanSearchQuery}
              />
            </View>

            {/* Plan List */}
            <ScrollView style={styles.planList}>
              {filteredPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planItem}
                  onPress={() => handlePlanSelect(plan)}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selectedPlan?.id === plan.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24 * SCALE}
                    color={selectedPlan?.id === plan.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowPlanModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(country.id);
                    setSelectedCountryName(country.name);
                  }}
                >
                  <Text style={styles.countryFlagEmoji}>{country.flag}</Text>
                  <Text style={styles.countryNameModal}>{country.name}</Text>
                  <MaterialCommunityIcons
                    name={selectedCountry === country.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24 * SCALE}
                    color={selectedCountry === country.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowCountryModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Summary</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Summary Details */}
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Country</Text>
                <Text style={styles.summaryValue}>{selectedCountryName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biller Type</Text>
                <Text style={styles.summaryValue}>
                  {BILLER_TYPES.find((b) => b.id === selectedBillerType)?.name || ''}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plan</Text>
                <Text style={styles.summaryValue}>
                  {selectedPlan?.title || ''}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Decoder Number</Text>
                <Text style={styles.summaryValue}>{decoderNumber}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee</Text>
                <Text style={styles.summaryValue}>N200</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>N{amount}</Text>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: transactionDetails.amount,
          fee: transactionDetails.fee,
          mobileNumber: transactionDetails.smartCardNumber,
          networkProvider: transactionDetails.billerType,
          country: transactionDetails.country,
          transactionType: 'billPayment',
        }}
        onViewTransaction={() => {
          setShowSuccessModal(false);
          setShowReceiptModal(true);
        }}
        onCancel={() => {
          setShowSuccessModal(false);
        }}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={{
          transactionType: 'billPayment',
          transferAmount: transactionDetails.amount,
          amountNGN: transactionDetails.amount,
          fee: transactionDetails.fee,
          mobileNumber: transactionDetails.smartCardNumber,
          billerType: transactionDetails.billerType,
          plan: transactionDetails.plan,
          recipientName: 'Cable TV Subscription',
          country: transactionDetails.country,
          transactionId: '12dwerkxywurcksc',
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Wallet',
        }}
        onClose={() => {
          setShowReceiptModal(false);
        }}
      />
    </View>
  );
};

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
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 15 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -40 * SCALE,
  },
  balanceSectionContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
  },
  balanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 84 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceCardContent: {
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
  balanceAmountInput: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
    flex: 1,
    padding: 0,
    margin: 0,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  countryFlagImage: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 18 * SCALE,
  },
  countryNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
  },
  formFields: {
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    minHeight: 60 * SCALE,
  },
  inputLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  textInput: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  accountNameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNameLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4 * SCALE,
  },
  accountNameValue: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  feeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    backgroundColor: '#CE56001A',
    marginHorizontal: SCREEN_WIDTH * 0.047,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingVertical: 6 * SCALE,
    marginBottom: 10 * SCALE,
    borderRadius: 10 * SCALE,
  },
  feeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#020c19',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 10 * SCALE,
    paddingBottom: 20 * SCALE,
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  billerModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  planModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  summaryModalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    paddingBottom: 20 * SCALE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 18 * SCALE,
    paddingBottom: 15 * SCALE,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 7 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
    gap: 12 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  billerList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  billerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14 * SCALE,
    gap: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  billerIcon: {
    width: 33 * SCALE,
    height: 33 * SCALE,
    borderRadius: 16.5 * SCALE,
  },
  billerName: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  planList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14 * SCALE,
    paddingHorizontal: 14 * SCALE,
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  planInfo: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  planTitle: {
    fontSize: 14 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  planDescription: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalList: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    gap: 12 * SCALE,
  },
  countryFlagEmoji: {
    fontSize: 24 * 1,
  },
  countryNameModal: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  summaryDetails: {
    paddingHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    padding: 12 * SCALE,
    marginBottom: 10 * SCALE,
  },
  summaryLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryValue: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
});

export default CableTv;

