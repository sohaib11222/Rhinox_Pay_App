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
import * as Clipboard from 'expo-clipboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: require('../../../assets/login/nigeria-flag.png') },
  { id: 2, name: 'Botswana', flag: require('../../../assets/login/nigeria-flag.png') },
  { id: 3, name: 'Ghana', flag: require('../../../assets/login/nigeria-flag.png') },
  { id: 4, name: 'Kenya', flag: require('../../../assets/login/nigeria-flag.png') },
  { id: 5, name: 'South Africa', flag: require('../../../assets/login/south-africa-flag.png') },
];

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const BANKS: BankAccount[] = [
  {
    id: '1',
    bankName: 'Opay',
    accountNumber: '1234567890',
    accountName: 'Qamardeen Abdul Malik',
  },
  {
    id: '2',
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Qamardeen Abdul Malik',
  },
  {
    id: '3',
    bankName: 'GTBank',
    accountNumber: '9876543210',
    accountName: 'Qamardeen Abdul Malik',
  },
];

const Withdrawal = () => {
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

  const [balance, setBalance] = useState('200,000');
  const [amount, setAmount] = useState('2,000');
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(1);
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const quickAmounts = ['N100', 'N200', 'N500', 'N1,000'];

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace(/[N,]/g, '');
    setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  };

  const handleBankSelect = (bank: BankAccount) => {
    setSelectedBank(bank);
  };

  const handleApplyBank = () => {
    if (selectedBank) {
      setShowBankModal(false);
    }
  };

  const handleProceed = () => {
    if (selectedBank && amount) {
      setShowSummaryModal(true);
    }
  };

  const handleCompleteWithdrawal = () => {
    setShowSummaryModal(false);
    setShowSuccessModal(true);
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    await Clipboard.setStringAsync(accountNumber);
    // TODO: Show toast notification
  };

  const filteredBanks = BANKS.filter((bank) =>
    bank.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.accountNumber.includes(searchQuery)
  );

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
            onPress={() => navigation.goBack()}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Withdrawal</Text>
          </View>
        </View>

        {/* Balance Section with Linear Gradient */}
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
                  style={styles.walletIcon}
                  resizeMode="cover"
                />
                <TextInput
                  style={styles.balanceAmountInput}
                  value={`N${balance}`}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[N,]/g, '');
                    setBalance(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
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
                source={COUNTRIES.find((c) => c.id === selectedCountry)?.flag || COUNTRIES[0].flag}
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
          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputLabelContainer}>
              <Text style={styles.amountInputLabel}>N</Text>
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
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => handleAmountSelect(quickAmount)}
                >
                  <Text style={styles.quickAmountText}>{quickAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Withdrawal Account Field */}
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => setShowBankModal(true)}
          >
            <Text style={[styles.inputLabel, !selectedBank && styles.inputPlaceholder]}>
              {selectedBank ? selectedBank.bankName : 'Withdrawal Account'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Fee Display */}
        <View style={styles.feeSection}>
          <Image
            source={require('../../../assets/CoinVertical.png')}
            style={styles.feeIcon}
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
          style={[styles.proceedButton, (!selectedBank || !amount) && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!selectedBank || !amount}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      {/* Select Bank Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bankModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.filterContainer}>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>All</Text>
                <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                <Image
                  source={require('../../../assets/Vector (35).png')}
                  style={[{ marginBottom: -1, width: 14, height: 13, alignItems: 'flex-end', alignSelf:'flex-end', marginLeft: 300 }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
            {/* Bank List */}
            <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
              <Text style={styles.bankListTitle}>Bank Transfer</Text>
              {filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    selectedBank?.id === bank.id && styles.bankItemSelected,
                  ]}
                  onPress={() => handleBankSelect(bank)}
                >
                  {selectedBank?.id === bank.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                  <View style={styles.bankItemContent}>
                    <View style={styles.bankItemRow}>
                      <Text style={styles.bankItemLabel}>Bank Name</Text>
                      <Text style={styles.bankItemValue}>{bank.bankName}</Text>
                    </View>
                    <View style={styles.bankItemRow}>
                      <Text style={styles.bankItemLabel}>Account Number</Text>
                      <View style={styles.accountNumberRow}>
                        <Text style={styles.bankItemValue}>{bank.accountNumber}</Text>
                        <TouchableOpacity
                          onPress={() => handleCopyAccountNumber(bank.accountNumber)}
                          style={styles.copyButton}
                        >
                          <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.bankItemRow}>
                      <Text style={styles.bankItemLabel}>Account Name</Text>
                      <Text style={styles.bankItemValue}>{bank.accountName}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, !selectedBank && styles.applyButtonDisabled]}
              onPress={handleApplyBank}
              disabled={!selectedBank}
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

            {/* Amount Section */}
            <View style={styles.summaryAmountSection}>
              <Text style={styles.summaryAmountLabel}>You are Withdrawing</Text>
              <Text style={styles.summaryAmountValue}>N{amount}</Text>
            </View>

            {/* Account Details */}
            <View style={styles.summaryDetailsCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Account Number</Text>
                <Text style={styles.summaryValue}>{selectedBank?.accountNumber || ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bank Name</Text>
                <Text style={styles.summaryValue}>{selectedBank?.bankName || ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Account Name</Text>
                <Text style={styles.summaryValue}>{selectedBank?.accountName || ''}</Text>
              </View>
            </View>

            {/* Transaction Details */}
            <View style={styles.summaryDetailsCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transaction Fee</Text>
                <Text style={styles.summaryValue}>20 NGN</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Funding Route</Text>
                <Text style={styles.summaryValue}>Instant Transfer</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Provider</Text>
                <Text style={styles.summaryValue}>Yellow card</Text>
              </View>
            </View>

            {/* Warning Section */}
            <View style={styles.warningSection}>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <Text style={styles.warningText}>
                  Ensure you are sending cash to the right bank account number to prevent loss of funds
                </Text>
              </View>
              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                <Text style={styles.warningText}>Payment will arrive in a few minutes</Text>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteWithdrawal}
            >
              <Text style={styles.completeButtonText}>Complete Withdrawal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `N${amount}`,
          fee: 'N200',
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
          transactionType: 'withdrawal',
          transferAmount: `N${amount}`,
          amountNGN: `N${amount}`,
          fee: 'N20',
          bank: selectedBank?.bankName || '',
          accountNumber: selectedBank?.accountNumber || '',
          accountName: selectedBank?.accountName || '',
          country: selectedCountryName,
          transactionId: '12dwerkxywurcksc',
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Instant Transfer',
        }}
        onClose={() => {
          setShowReceiptModal(false);
        }}
      />

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(country.id);
                    setSelectedCountryName(country.name);
                    setShowCountryModal(false);
                  }}
                >
                  <Image source={country.flag} style={styles.countryFlagImage} resizeMode="cover" />
                  <Text style={styles.countryNameText}>{country.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderRadius: 15 * 1,
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
  walletIcon: {
    width: 18 * SCALE,
    height: 16 * SCALE,
    marginBottom: -1,
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
  amountSection: {
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * 1,
  },
  amountInput: {
    fontSize: 50 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingTop: 80,
    paddingBottom: 80 * 1,
    padding: 0,
    margin: 0,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
  },
  amountInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4 * SCALE,
  },
  amountInputLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 30,
    textAlign: 'center',
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 8 * SCALE,
    minWidth: 40 * SCALE,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
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
  feeIcon: {
    width: 14 * SCALE,
    height: 14 * SCALE,
  },
  feeText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 20 * SCALE,
    backgroundColor: '#020c19',
    paddingTop: 10 * SCALE,
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
  bottomSpacer: {
    height: 100 * SCALE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bankModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
    paddingBottom: 20 * SCALE,
  },
  summaryModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '90%',
    paddingBottom: 20 * SCALE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    width: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10 * SCALE,
    marginTop: 20 * SCALE,
    marginLeft: 14 * 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 12 * SCALE,
    gap: 6 * SCALE,
    width: '97%',
  },
  filterText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  bankList: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    maxHeight: 400 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * 1,
    backgroundColor: '#FFFFFF08',
    marginHorizontal: 14 * SCALE,
    marginTop: 20 * SCALE,
  },
  bankListTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  bankItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 14 * SCALE,
    marginBottom: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  bankItemSelected: {
    borderColor: '#A9EF45',
    borderWidth: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: 5 * SCALE,
    left: 14 * SCALE,
    backgroundColor: '#A9EF45',
    borderRadius: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    paddingVertical: 4 * SCALE,
  },
  selectedBadgeText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  bankItemContent: {
    marginTop: 20 * SCALE,
  },
  bankItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 10 * SCALE,
    backgroundColor: '#FFFFFF0D',
  },
  bankItemLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bankItemValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  copyButton: {
    padding: 4 * SCALE,
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 18 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  applyButtonText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  summaryAmountSection: {
    alignItems: 'center',
    paddingVertical: 30 * SCALE,
  },
  summaryAmountLabel: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  summaryAmountValue: {
    fontSize: 40 * 1,
    fontWeight: '700',
    color: '#A9EF45',
  },
  summaryDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 14 * SCALE,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  warningSection: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  warningText: {
    flex: 1,
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 14 * SCALE,
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
  countryModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    maxHeight: '70%',
    paddingBottom: 20 * SCALE,
  },
  countryList: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12 * SCALE,
  },
});

export default Withdrawal;

