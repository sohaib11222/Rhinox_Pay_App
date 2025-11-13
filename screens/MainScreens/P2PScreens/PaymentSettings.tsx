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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  type: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isSelected: boolean;
}

interface Bank {
  id: string;
  name: string;
  type: string;
}

const PaymentSettings = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankType, setSelectedBankType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

  // Form state for Add New modal
  const [accountType, setAccountType] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Hide bottom tab bar when focused
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

  // Mock payment methods data - TODO: Replace with API call
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'Bank Transfer',
      bankName: 'Opay',
      accountNumber: '1234567890',
      accountName: 'Qamardeen Abdul Malik',
      isSelected: true,
    },
    {
      id: '2',
      type: 'Bank Transfer',
      bankName: 'Opay',
      accountNumber: '1234567890',
      accountName: 'Qamardeen Abdul Malik',
      isSelected: false,
    },
  ]);

  // Mock banks data - TODO: Replace with API call
  const banks: Bank[] = [
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

  const filteredBanks = banks.filter((bank) => {
    if (searchQuery) {
      return bank.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Bank Transfer') return bank.type === 'bank';
    return bank.type === selectedFilter.toLowerCase();
  });

  const handleCopyAccountNumber = async (accountNumber: string) => {
    await Clipboard.setStringAsync(accountNumber);
    // TODO: Show toast notification
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethodId(method.id);
    setAccountType(method.type);
    setBankName(method.bankName);
    setAccountNumber(method.accountNumber);
    setAccountName(method.accountName);
    setShowAddNewModal(true);
  };

  const handleSaveAccount = () => {
    // TODO: Implement API call to save/update payment method
    if (editingMethodId) {
      console.log('Updating account:', { id: editingMethodId, accountType, bankName, accountNumber, accountName });
    } else {
      console.log('Saving account:', { accountType, bankName, accountNumber, accountName });
    }
    setShowAddNewModal(false);
    setEditingMethodId(null);
    // Reset form
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleCloseModal = () => {
    setShowAddNewModal(false);
    setEditingMethodId(null);
    // Reset form
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleBankTypeSelect = (bank: Bank) => {
    setSelectedBankType(bank.id);
  };

  const handleApplyBank = () => {
    const selectedBank = banks.find((b) => b.id === selectedBankType);
    if (selectedBank) {
      setAccountType(selectedBank.name);
      setShowBankModal(false);
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
          <Text style={styles.headerTitle}>My Payment Method</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <View style={styles.filterBackground}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>{selectedFilter}</Text>
            <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/Vector (35).png')}
            style={styles.filterIcon}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Payment Methods List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paymentMethodsCard}>
          {/* Bank Transfer Title - Show only once */}
          {paymentMethods.length > 0 && (
            <Text style={styles.paymentMethodType}>{paymentMethods[0].type}</Text>
          )}
          {paymentMethods.map((method, index) => (
            <View key={method.id} style={styles.paymentMethodItem}>
              {method.isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
              <View style={styles.paymentMethodDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bank Name</Text>
                  <Text style={styles.detailValue}>{method.bankName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <View style={styles.accountNumberRow}>
                    <Text style={styles.detailValue}>{method.accountNumber}</Text>
                    <TouchableOpacity
                      onPress={() => handleCopyAccountNumber(method.accountNumber)}
                      style={styles.copyButton}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Name</Text>
                  <Text style={styles.detailValue}>{method.accountName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEdit(method)}
                >
                  <Image
                    source={require('../../../assets/PencilSimpleLine (1).png')}
                    style={styles.actionIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Image
                    source={require('../../../assets/TrashSimple.png')}
                    style={styles.actionIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add New Button */}
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={() => setShowAddNewModal(true)}
      >
        <Text style={styles.addNewButtonText}>Add New</Text>
      </TouchableOpacity>

      {/* Add New Full Screen Modal */}
      <Modal
        visible={showAddNewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddNewModal(false)}
      >
        <View style={styles.addNewModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#020c19" />

          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseModal}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.modalHeaderTitleContainer}>
              <Text style={styles.modalHeaderTitle}>
                {editingMethodId ? 'Edit' : 'Add New'}
              </Text>
            </View>
            <View style={styles.backButton} />
          </View>

          {/* Form */}
          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              {/* Account Type */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account type</Text>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowBankModal(true)}
                >
                  <Text style={[styles.inputText, !accountType && styles.inputPlaceholder]}>
                    {accountType || 'Select Account type'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Bank Name */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Bank Name</Text>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Enter Account type"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={bankName}
                    onChangeText={setBankName}
                  />
                </View>
              </View>

              {/* Account Number */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account Number</Text>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Type account number"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Account Name */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account Name</Text>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Type account name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={accountName}
                    onChangeText={setAccountName}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Save Account Button */}
          <TouchableOpacity
            style={styles.saveAccountButton}
            onPress={handleSaveAccount}
          >
            <Text style={styles.saveAccountButtonText}>Save Account</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Select Bank Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            {/* Modal Header */}
            <View style={styles.bankModalHeader}>
              <Text style={styles.bankModalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
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

            {/* Bank List */}
            <ScrollView 
              style={styles.bankList} 
              contentContainerStyle={styles.bankListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={styles.bankListItem}
                  onPress={() => handleBankTypeSelect(bank)}
                >
                  <Text style={styles.bankListItemText}>{bank.name}</Text>
                  {selectedBankType === bank.id ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, !selectedBankType && styles.applyButtonDisabled]}
                onPress={handleApplyBank}
                disabled={!selectedBankType}
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

export default PaymentSettings;

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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  filterContainer: {
    marginHorizontal: 21 * SCALE,
    marginBottom: 20 * SCALE,
  },
  filterBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 39 * SCALE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15 * SCALE,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  filterText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterIcon: {
    width: 18 * SCALE,
    height: 18 * SCALE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21 * SCALE,
    paddingBottom: 100 * SCALE,
  },
  paymentMethodsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
  },
  paymentMethodItem: {
    marginBottom: 20 * SCALE,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: -14,
    // left:  * SCALE,
    backgroundColor: '#A9EF45',
    // borderRadius: 5 * SCALE,
    borderTopLeftRadius: 5 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    borderBottomRightRadius: 30 * SCALE,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 2 * SCALE,
    zIndex: 1,
  },
  selectedBadgeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#000000',
  },
  paymentMethodType: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 22 * SCALE,
  },
  paymentMethodDetails: {
    borderWidth: 1,
    borderColor: '#A9EF45',
    borderRadius: 10 * SCALE,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  detailValue: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  copyButton: {
    padding: 4 * SCALE,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15 * SCALE,
    marginTop: 10 * SCALE,
  },
  editButton: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  deleteButton: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  actionIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  addNewButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  // Add New Modal Styles
  addNewModalContainer: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 15 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  modalHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 21 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 100 * SCALE,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
  },
  formField: {
    marginBottom: 14 * SCALE,
  },
  fieldLabel: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 60 * SCALE,
    paddingHorizontal: 11 * SCALE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  saveAccountButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAccountButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  // Select Bank Modal Styles
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
    paddingTop: 15 * SCALE,
    paddingBottom: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: '#484848',
  },
  bankModalTitle: {
    fontSize: 16 * 1,
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

