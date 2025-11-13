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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface Beneficiary {
  id: string;
  name: string;
  phoneNumber: string;
}

const BeneficiariesScreen = () => {
  const navigation = useNavigation();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { id: '1', name: 'Adebisi Lateefat', phoneNumber: '091234567' },
    { id: '2', name: 'Adebisi Lateefat', phoneNumber: '091234567' },
    { id: '3', name: 'Adebisi Lateefat', phoneNumber: '091234567' },
  ]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newBeneficiaryPhone, setNewBeneficiaryPhone] = useState('');
  // Transaction details from summary modal
  const [transactionDetails, setTransactionDetails] = useState({
    amount: 'N2,000',
    fee: 'N20',
    mobileNumber: '0701245678',
    networkProvider: 'MTN',
    country: 'Nigeria',
  });

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Get parent navigator and hide tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Show tab bar when leaving this screen
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

  const handleAddBeneficiary = () => {
    if (newBeneficiaryName && newBeneficiaryPhone) {
      const newBeneficiary: Beneficiary = {
        id: Date.now().toString(),
        name: newBeneficiaryName,
        phoneNumber: newBeneficiaryPhone,
      };
      setBeneficiaries([...beneficiaries, newBeneficiary]);
      setSelectedBeneficiary(newBeneficiary);
      setNewBeneficiaryName('');
      setNewBeneficiaryPhone('');
      setShowAddBeneficiaryModal(false);
    }
  };

  const handleProceed = () => {
    if (selectedBeneficiary) {
      setShowSummaryModal(true);
    }
  };

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
            <Text style={styles.headerTitle}>Beneficiaries</Text>
          </View>
        </View>

        {/* Beneficiaries Card */}
        <View style={styles.beneficiariesCard}>
          <View style={styles.beneficiariesList}>
            {beneficiaries.map((beneficiary) => (
              <TouchableOpacity
                key={beneficiary.id}
                style={[
                  styles.beneficiaryItem,
                  selectedBeneficiary?.id === beneficiary.id && styles.beneficiaryItemSelected,
                ]}
                onPress={() => setSelectedBeneficiary(beneficiary)}
              >
                <View style={styles.beneficiaryInfo}>
                  <Text style={styles.beneficiaryName}>{beneficiary.name}</Text>
                  <Text style={styles.beneficiaryPhone}>{beneficiary.phoneNumber}</Text>
                </View>
                <Image
                source={require('../../../assets/PencilSimpleLine (1).png')}
                style={[{ marginBottom: -1, width: 26, height: 26 }]}
                resizeMode="cover"
              />              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Proceed Button - Only shown when beneficiary is selected */}
        {selectedBeneficiary && (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceed}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        )}

        {/* Bottom spacing for Add New button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add New Button - Fixed at bottom */}
      <View style={styles.addNewButtonContainer}>
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={() => setShowAddBeneficiaryModal(true)}
        >
          <Text style={styles.addNewButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Add New Beneficiary Modal */}
      <Modal
        visible={showAddBeneficiaryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBeneficiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Beneficiary</Text>
              <TouchableOpacity onPress={() => setShowAddBeneficiaryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={[styles.textInput, { fontSize: 14 * 1 }]}
                  placeholder="Enter beneficiary name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={newBeneficiaryName}
                  onChangeText={setNewBeneficiaryName}
                />
              </View>

              {/* Phone Number Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.textInput, { fontSize: 14 * 1 }]}
                  placeholder="Enter phone number"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={newBeneficiaryPhone}
                  onChangeText={setNewBeneficiaryPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, (!newBeneficiaryName || !newBeneficiaryPhone) && styles.saveButtonDisabled]}
              onPress={handleAddBeneficiary}
              disabled={!newBeneficiaryName || !newBeneficiaryPhone}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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
                <Text style={styles.summaryValue}>Nigeria</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Provider</Text>
                <Text style={styles.summaryValue}>MTN</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone Number</Text>
                <Text style={styles.summaryValue}>0701245678</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee</Text>
                <Text style={styles.summaryValue}>N20</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>N2,000</Text>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                // Store transaction details from summary modal
                setTransactionDetails({
                  amount: 'N2,000',
                  fee: 'N20',
                  mobileNumber: '0701245678',
                  networkProvider: 'MTN',
                  country: 'Nigeria',
                });
                setShowSummaryModal(false);
                setShowSuccessModal(true);
              }}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
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
          mobileNumber: transactionDetails.mobileNumber,
          networkProvider: transactionDetails.networkProvider,
          country: transactionDetails.country,
          transactionType: 'airtime',
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
          mobileNumber: transactionDetails.mobileNumber,
          billerType: transactionDetails.networkProvider,
          plan: `${transactionDetails.amount} ${transactionDetails.networkProvider}`, // Format: "N2,000 MTN"
          recipientName: 'Airtime Recharge', // This triggers "Recharged" in the message
          country: transactionDetails.country,
          transactionId: '12dwerkxywurcksc', // Mock transaction ID
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
    paddingBottom: 100 * SCALE, // Space for Add New button at bottom
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
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -40,
  },
  beneficiariesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  beneficiariesList: {
    gap: 14 * SCALE,
  },
  beneficiaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    minHeight: 60 * SCALE,
  },
  beneficiaryItemSelected: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    borderWidth: 1,
    borderColor: '#A9EF45',
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  beneficiaryPhone: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addNewButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 20 * SCALE,
    paddingTop: 10 * SCALE,
    backgroundColor: '#020c19',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  addNewButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 10 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  bottomSpacer: {
    height: 80 * SCALE, // Space for Add New button at bottom
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
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    gap: 20 * SCALE,
  },
  inputContainer: {
    gap: 8 * SCALE,
  },
  inputLabel: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  textInput: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    fontSize: 17 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    minHeight: 60 * SCALE,
  },
  saveButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  saveButtonText: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#000000',
  },
  summaryDetails: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    gap: 0,
    
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16 * SCALE,
    borderWidth: 0.5,
    borderColor: '#FFFFFF1A',
    padding:10,
    borderRadius: 10 * SCALE,
    backgroundColor: '#FFFFFF0D',
    marginTop:10,
  

  },
  summaryLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
  },
  summaryValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
});

export default BeneficiariesScreen;

