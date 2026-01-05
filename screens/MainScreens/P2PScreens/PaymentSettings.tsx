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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import {
  useGetPaymentMethods,
  useGetPaymentSettingsBanks,
  useGetPaymentSettingsMobileMoneyProviders,
} from '../../../queries/paymentSettings.queries';
import {
  useAddBankAccount,
  useAddMobileMoney,
  useAddRhinoxPayId,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from '../../../mutations/paymentSettings.mutations';
import { useGetCountries } from '../../../queries/country.queries';
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showInfoAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Types for API integration
interface PaymentMethod {
  id: string;
  type: string;
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  phoneNumber?: string;
  provider?: any;
  countryCode?: string;
  currency?: string;
  isDefault: boolean;
  isSelected?: boolean; // For UI compatibility
}

interface Bank {
  id?: string;
  name: string;
  type?: string;
  countryCode?: string;
  currency?: string;
}

const PaymentSettings = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [selectedBankType, setSelectedBankType] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'bank_account' | 'mobile_money' | 'rhinoxpay_id' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

  // Form state for Add New modal
  const [paymentMethodType, setPaymentMethodType] = useState<'bank_account' | 'mobile_money' | 'rhinoxpay_id' | null>(null);
  const [accountType, setAccountType] = useState<'savings' | 'current' | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState('NG');
  const [currency, setCurrency] = useState('NGN');
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedMobileMoneyProviderId, setSelectedMobileMoneyProviderId] = useState<number | null>(null);

  // Hide bottom tab bar when focused
  useFocusEffect(
    React.useCallback(() => {
      // PaymentSettings -> SettingsStack -> TabNavigator
      // Go up 2 levels to reach the Tab Navigator
      const settingsStack = navigation.getParent();
      const tabNavigator = settingsStack?.getParent();

      if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
        tabNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Restore tab bar when leaving this screen
        if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
          tabNavigator.setOptions({
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderTopWidth: 0,
              height: 75 * SCALE,
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * SCALE,
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

  // Also hide on mount to ensure it's hidden immediately
  useLayoutEffect(() => {
    const settingsStack = navigation.getParent();
    const tabNavigator = settingsStack?.getParent();

    if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
      tabNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
  }, [navigation]);

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return [];
    }
    return countriesData.data.map((country: any, index: number) => {
      // Check if flag is a URL path (starts with /) or an emoji
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

  // Initialize country name when countries load
  useEffect(() => {
    if (countries.length > 0 && selectedCountryName === 'Nigeria') {
      const defaultCountry = countries.find((c: any) => c.code === countryCode) || countries[0];
      if (defaultCountry && defaultCountry.name !== selectedCountryName) {
        setSelectedCountryName(defaultCountry.name);
      }
    }
  }, [countries, countryCode]);

  // Fetch payment methods from API
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPaymentMethods,
    refetch: refetchPaymentMethods,
  } = useGetPaymentMethods(
    selectedFilter !== 'All' ? { 
      type: selectedFilter === 'Bank Transfer' ? 'bank_account' : 
            selectedFilter === 'Mobile Money' ? 'mobile_money' : 
            selectedFilter === 'RhinoxPay ID' ? 'rhinoxpay_id' : 
            undefined 
    } : undefined
  );

  // Transform payment methods data
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    if (!paymentMethodsData?.data || !Array.isArray(paymentMethodsData.data)) {
      return [];
    }
    return paymentMethodsData.data.map((method: any) => ({
      id: String(method.id),
      type: method.type === 'bank_account' ? 'Bank Transfer' : 
            method.type === 'mobile_money' ? 'Mobile Money' : 
            method.type === 'rhinoxpay_id' ? 'RhinoxPay ID' : 
            method.type,
      accountType: method.accountType,
      bankName: method.bankName || method.provider?.name || 'N/A',
      accountNumber: method.accountNumber || method.phoneNumber || 'N/A',
      accountName: method.accountName || 'N/A',
      phoneNumber: method.phoneNumber,
      provider: method.provider,
      countryCode: method.countryCode,
      currency: method.currency,
      isDefault: method.isDefault || false,
      isSelected: method.isDefault || false,
    }));
  }, [paymentMethodsData?.data]);

  // Fetch banks from API
  const {
    data: banksData,
    isLoading: isLoadingBanks,
  } = useGetPaymentSettingsBanks({
    countryCode: countryCode,
    currency: currency,
  });

  // Transform banks data
  const banks: Bank[] = useMemo(() => {
    if (!banksData?.data || !Array.isArray(banksData.data)) {
      return [];
    }
    return banksData.data.map((bank: any, index: number) => ({
      id: String(bank.name || index + 1),
      name: bank.name || '',
      type: 'bank',
      countryCode: bank.countryCode,
      currency: bank.currency,
    }));
  }, [banksData?.data]);

  // Fetch mobile money providers
  const {
    data: mobileMoneyProvidersData,
    isLoading: isLoadingMobileMoneyProviders,
  } = useGetPaymentSettingsMobileMoneyProviders({
    countryCode: countryCode,
    currency: currency,
  });

  // Transform mobile money providers data
  const mobileMoneyProviders = useMemo(() => {
    if (!mobileMoneyProvidersData?.data || !Array.isArray(mobileMoneyProvidersData.data)) {
      return [];
    }
    return mobileMoneyProvidersData.data.map((provider: any) => ({
      id: provider.id,
      name: provider.name || '',
      code: provider.code || '',
      countryCode: provider.countryCode,
      currency: provider.currency,
      logoUrl: provider.logoUrl,
    }));
  }, [mobileMoneyProvidersData?.data]);

  const filteredBanks = banks.filter((bank) => {
    if (searchQuery) {
      return bank.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const filteredMobileMoneyProviders = mobileMoneyProviders.filter((provider) => {
    if (searchQuery) {
      return provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Mutations
  const addBankAccountMutation = useAddBankAccount({
    onSuccess: () => {
      showSuccessAlert('Success', 'Bank account added successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
        handleCloseModal();
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to add bank account');
    },
  });

  const addMobileMoneyMutation = useAddMobileMoney({
    onSuccess: () => {
      showSuccessAlert('Success', 'Mobile money account added successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
        handleCloseModal();
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to add mobile money account');
    },
  });

  const addRhinoxPayIdMutation = useAddRhinoxPayId({
    onSuccess: () => {
      showSuccessAlert('Success', 'RhinoxPay ID added successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
        handleCloseModal();
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to add RhinoxPay ID');
    },
  });

  const updatePaymentMethodMutation = useUpdatePaymentMethod({
    onSuccess: () => {
      showSuccessAlert('Success', 'Payment method updated successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
        handleCloseModal();
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to update payment method');
    },
  });

  const deletePaymentMethodMutation = useDeletePaymentMethod({
    onSuccess: () => {
      showSuccessAlert('Success', 'Payment method deleted successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to delete payment method');
    },
  });

  const setDefaultPaymentMethodMutation = useSetDefaultPaymentMethod({
    onSuccess: () => {
      showSuccessAlert('Success', 'Default payment method updated', () => {
        queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to set default payment method');
    },
  });

  const handleCopyAccountNumber = async (accountNumber: string) => {
    await Clipboard.setStringAsync(accountNumber);
    showInfoAlert('Copied', 'Account number copied to clipboard');
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethodId(method.id);
    const methodType = method.type === 'Bank Transfer' ? 'bank_account' : 
                      method.type === 'Mobile Money' ? 'mobile_money' : 
                      method.type === 'RhinoxPay ID' ? 'rhinoxpay_id' : null;
    setPaymentMethodType(methodType);
    setAccountType((method.accountType as 'savings' | 'current') || '');
    setBankName(method.bankName || '');
    setAccountNumber(method.accountNumber || method.phoneNumber || '');
    setAccountName(method.accountName || '');
    setPhoneNumber(method.phoneNumber || '');
    setSelectedProviderId(method.provider?.id || null);
    setCountryCode(method.countryCode || 'NG');
    setCurrency(method.currency || 'NGN');
    
    // Set country name from countries list
    const country = countries.find((c: any) => c.code === (method.countryCode || 'NG'));
    setSelectedCountryName(country?.name || 'Nigeria');
    
    setShowAddNewModal(true);
  };

  const handleSaveAccount = () => {
    if (editingMethodId) {
      // Update existing payment method
      const updateData: any = {};
      if (paymentMethodType === 'bank_account') {
        if (accountType) updateData.accountType = accountType;
        if (bankName) updateData.bankName = bankName;
        if (accountNumber) updateData.accountNumber = accountNumber;
        if (accountName) updateData.accountName = accountName;
      } else if (paymentMethodType === 'mobile_money') {
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
      }
      
      updatePaymentMethodMutation.mutate({
        paymentMethodId: editingMethodId,
        ...updateData,
      });
    } else {
      // Add new payment method
      if (!paymentMethodType) {
        showErrorAlert('Validation Error', 'Please select a payment method type');
        return;
      }

      if (paymentMethodType === 'bank_account') {
        if (!accountType || !bankName || !accountNumber || !accountName) {
          showErrorAlert('Validation Error', 'Please fill in all required fields');
          return;
        }
        if (accountNumber.length < 8) {
          showErrorAlert('Validation Error', 'Account number must be at least 8 characters');
          return;
        }
        addBankAccountMutation.mutate({
          accountType: accountType as 'savings' | 'current',
          bankName,
          accountNumber,
          accountName,
          countryCode,
          currency,
          isDefault: false,
        });
      } else if (paymentMethodType === 'mobile_money') {
        if (!selectedProviderId || !phoneNumber) {
          showErrorAlert('Validation Error', 'Please select a provider and enter phone number');
          return;
        }
        if (phoneNumber.length < 10) {
          showErrorAlert('Validation Error', 'Phone number must be at least 10 characters');
          return;
        }
        addMobileMoneyMutation.mutate({
          providerId: selectedProviderId,
          phoneNumber,
          countryCode,
          currency,
          isDefault: false,
        });
      } else if (paymentMethodType === 'rhinoxpay_id') {
        addRhinoxPayIdMutation.mutate({
          countryCode,
          currency,
          isDefault: false,
        });
      }
    }
  };

  const handleDelete = (methodId: string) => {
    showConfirmAlert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method? This action cannot be undone.',
      () => {
        deletePaymentMethodMutation.mutate(methodId);
      }
    );
  };

  const handleSetDefault = (methodId: string) => {
    setDefaultPaymentMethodMutation.mutate(methodId);
  };

  const handleCloseModal = () => {
    setShowAddNewModal(false);
    setEditingMethodId(null);
    // Reset form
    setPaymentMethodType(null);
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setPhoneNumber('');
    setSelectedProviderId(null);
    setShowBankModal(false);
    setShowAccountTypeModal(false);
    setShowMobileMoneyModal(false);
    setShowPaymentTypeModal(false);
    setSelectedBankType(null);
    setSelectedPaymentType(null);
    setSearchQuery('');
  };

  const handleBankTypeSelect = (bank: Bank) => {
    setSelectedBankType(bank.id || null);
  };

  const handleApplyBank = () => {
    const selectedBank = banks.find((b) => b.id === selectedBankType);
    if (selectedBank) {
      setBankName(selectedBank.name);
      setShowBankModal(false);
      setSelectedBankType(null);
      setSearchQuery('');
    }
  };

  const handleAccountTypeSelect = (type: 'savings' | 'current') => {
    setAccountType(type);
    setShowAccountTypeModal(false);
  };

  const handlePaymentTypeSelect = (type: 'bank_account' | 'mobile_money' | 'rhinoxpay_id') => {
    setPaymentMethodType(type);
    setSelectedPaymentType(type);
    setShowPaymentTypeModal(false);
    // Reset form fields when changing payment type
    if (type !== 'bank_account') {
      setAccountType('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
    }
    if (type !== 'mobile_money') {
      setPhoneNumber('');
      setSelectedProviderId(null);
    }
  };

  const handleMobileMoneyProviderSelect = (providerId: number) => {
    setSelectedMobileMoneyProviderId(providerId);
  };

  const handleApplyMobileMoney = () => {
    if (selectedMobileMoneyProviderId) {
      setSelectedProviderId(selectedMobileMoneyProviderId);
      setShowMobileMoneyModal(false);
      setSelectedMobileMoneyProviderId(null);
      setSearchQuery('');
    }
  };

  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setCountryCode(countryCode);
    setSelectedCountryName(countryName);
    // Update currency based on country if needed
    // For now, keep current currency or set default based on country
    if (countryCode === 'NG') {
      setCurrency('NGN');
    } else if (countryCode === 'GH') {
      setCurrency('GHS');
    } else if (countryCode === 'KE') {
      setCurrency('KES');
    } else if (countryCode === 'ZA') {
      setCurrency('ZAR');
    }
    setShowCountryModal(false);
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await refetchPaymentMethods();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Check if all required fields are filled based on payment method type
  const isFormValid = useMemo(() => {
    if (!paymentMethodType) return false;
    
    if (paymentMethodType === 'bank_account') {
      return accountType.trim() !== '' && 
             bankName.trim() !== '' && 
             accountNumber.trim() !== '' && 
             accountNumber.length >= 8 &&
             accountName.trim() !== '' &&
             countryCode.trim() !== '' &&
             currency.trim() !== '';
    } else if (paymentMethodType === 'mobile_money') {
      return selectedProviderId !== null &&
             phoneNumber.trim() !== '' &&
             phoneNumber.length >= 10 &&
             countryCode.trim() !== '' &&
             currency.trim() !== '';
    } else if (paymentMethodType === 'rhinoxpay_id') {
      return countryCode.trim() !== '' &&
             currency.trim() !== '';
    }
    return false;
  }, [paymentMethodType, accountType, bankName, accountNumber, accountName, phoneNumber, selectedProviderId, countryCode, currency]);

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
          <ThemedText style={styles.headerTitle}>My Payment Method</ThemedText>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <View style={styles.filterBackground}>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText style={styles.filterText}>{selectedFilter}</ThemedText>
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
        {isLoadingPaymentMethods ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="small" color="#A9EF45" />
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
              Loading payment methods...
            </ThemedText>
          </View>
        ) : paymentMethods.length > 0 ? (
          <View style={styles.paymentMethodsCard}>
            {/* Group by type */}
            {['Bank Transfer', 'Mobile Money', 'RhinoxPay ID'].map((type) => {
              const methodsOfType = paymentMethods.filter((m) => m.type === type);
              if (methodsOfType.length === 0) return null;
              
              return (
                <View key={type}>
                  <ThemedText style={styles.paymentMethodType}>{type}</ThemedText>
                  {methodsOfType.map((method, index) => (
                    <View key={method.id} style={styles.paymentMethodItem}>
                      {method.isSelected && (
                        <View style={styles.selectedBadge}>
                          <ThemedText style={styles.selectedBadgeText}>Selected</ThemedText>
                        </View>
                      )}
                      <View style={styles.paymentMethodDetails}>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Bank Name</ThemedText>
                          <ThemedText style={styles.detailValue}>{method.bankName || 'N/A'}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
                          <View style={styles.accountNumberRow}>
                            <ThemedText style={styles.detailValue}>{method.accountNumber || method.phoneNumber || 'N/A'}</ThemedText>
                            {(method.accountNumber || method.phoneNumber) && (
                              <TouchableOpacity
                                onPress={() => handleCopyAccountNumber(method.accountNumber || method.phoneNumber || '')}
                                style={styles.copyButton}
                              >
                                <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Account Name</ThemedText>
                          <ThemedText style={styles.detailValue}>{method.accountName || 'N/A'}</ThemedText>
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
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDelete(method.id)}
                        >
                          <Image
                            source={require('../../../assets/TrashSimple.png')}
                            style={styles.actionIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                        {!method.isDefault && (
                          <TouchableOpacity 
                            style={styles.setDefaultButton}
                            onPress={() => handleSetDefault(method.id)}
                          >
                            <ThemedText style={styles.setDefaultButtonText}>Set Default</ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
              No payment methods found. Add one to get started.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Add New Button */}
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={() => setShowAddNewModal(true)}
      >
        <ThemedText style={styles.addNewButtonText}>Add New</ThemedText>
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
              <ThemedText style={styles.modalHeaderTitle}>
                {editingMethodId ? 'Edit' : 'Add New'}
              </ThemedText>
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
              {/* Payment Method Type - Only show if not editing */}
              {!editingMethodId && (
                <View style={styles.formField}>
                  <ThemedText style={styles.fieldLabel}>Payment Method Type</ThemedText>
                  <TouchableOpacity
                    style={styles.inputField}
                    onPress={() => setShowPaymentTypeModal(true)}
                  >
                    <ThemedText style={[styles.inputText, !paymentMethodType && styles.inputPlaceholder]}>
                      {paymentMethodType === 'bank_account' ? 'Bank Account' :
                       paymentMethodType === 'mobile_money' ? 'Mobile Money' :
                       paymentMethodType === 'rhinoxpay_id' ? 'RhinoxPay ID' :
                       'Select Payment Method Type'}
                    </ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Bank Account Fields */}
              {paymentMethodType === 'bank_account' && (
                <>
                  {/* Account Type */}
                  <View style={styles.formField}>
                    <ThemedText style={styles.fieldLabel}>Account Type</ThemedText>
                    <TouchableOpacity
                      style={styles.inputField}
                      onPress={() => setShowAccountTypeModal(true)}
                    >
                      <ThemedText style={[styles.inputText, !accountType && styles.inputPlaceholder]}>
                        {accountType === 'savings' ? 'Savings' :
                         accountType === 'current' ? 'Current' :
                         'Select Account Type'}
                      </ThemedText>
                      <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Bank Name */}
                  <View style={styles.formField}>
                    <ThemedText style={styles.fieldLabel}>Bank Name</ThemedText>
                    <TouchableOpacity
                      style={styles.inputField}
                      onPress={() => setShowBankModal(true)}
                    >
                      <ThemedText style={[styles.inputText, !bankName && styles.inputPlaceholder]}>
                        {bankName || 'Select Bank'}
                      </ThemedText>
                      <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Account Number */}
                  <View style={styles.formField}>
                    <ThemedText style={styles.fieldLabel}>Account Number</ThemedText>
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
                    <ThemedText style={styles.fieldLabel}>Account Name</ThemedText>
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
                </>
              )}

              {/* Mobile Money Fields */}
              {paymentMethodType === 'mobile_money' && (
                <>
                  {/* Mobile Money Provider */}
                  <View style={styles.formField}>
                    <ThemedText style={styles.fieldLabel}>Provider</ThemedText>
                    <TouchableOpacity
                      style={styles.inputField}
                      onPress={() => setShowMobileMoneyModal(true)}
                      disabled={isLoadingMobileMoneyProviders}
                    >
                      {isLoadingMobileMoneyProviders ? (
                        <ActivityIndicator size="small" color="#A9EF45" />
                      ) : (
                        <>
                          <ThemedText style={[styles.inputText, !selectedProviderId && styles.inputPlaceholder]}>
                            {selectedProviderId 
                              ? mobileMoneyProviders.find(p => p.id === selectedProviderId)?.name || 'Select Provider'
                              : 'Select Provider'}
                          </ThemedText>
                          <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Phone Number */}
                  <View style={styles.formField}>
                    <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
                    <View style={styles.inputField}>
                      <TextInput
                        style={styles.inputText}
                        placeholder="Type phone number"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* RhinoxPay ID Fields */}
              {paymentMethodType === 'rhinoxpay_id' && (
                <View style={styles.formField}>
                  <ThemedText style={styles.fieldLabel}>RhinoxPay ID</ThemedText>
                  <ThemedText style={[styles.inputText, { color: 'rgba(255, 255, 255, 0.7)', paddingVertical: 18 }]}>
                    Your RhinoxPay ID will be automatically linked
                  </ThemedText>
                </View>
              )}

              {/* Country Selection - Show for all types */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Country</ThemedText>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowCountryModal(true)}
                  disabled={isLoadingCountries}
                >
                  {isLoadingCountries ? (
                    <ActivityIndicator size="small" color="#A9EF45" />
                  ) : (
                    <>
                      {(() => {
                        const selectedCountry = countries.find((c: any) => c.code === countryCode);
                        const flagUrl = selectedCountry?.flagUrl;
                        const flagEmoji = selectedCountry?.flag;
                        return (
                          <>
                            {flagUrl ? (
                              <Image
                                source={{ uri: flagUrl }}
                                style={styles.countryFlagSmall}
                                resizeMode="cover"
                              />
                            ) : flagEmoji ? (
                              <ThemedText style={styles.countryFlagEmojiSmall}>{flagEmoji}</ThemedText>
                            ) : null}
                            <ThemedText style={styles.inputText}>
                              {selectedCountryName || selectedCountry?.name || 'Select Country'}
                            </ThemedText>
                          </>
                        );
                      })()}
                      <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Currency Selection */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Currency</ThemedText>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Currency (e.g., NGN)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={currency}
                    onChangeText={setCurrency}
                    autoCapitalize="characters"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Save Account Button */}
          <TouchableOpacity
            style={[
              styles.saveAccountButton,
              (!isFormValid || 
               addBankAccountMutation.isPending || 
               addMobileMoneyMutation.isPending ||
               addRhinoxPayIdMutation.isPending ||
               updatePaymentMethodMutation.isPending) && styles.saveAccountButtonDisabled
            ]}
            onPress={handleSaveAccount}
            disabled={!isFormValid || 
                     addBankAccountMutation.isPending || 
                     addMobileMoneyMutation.isPending ||
                     addRhinoxPayIdMutation.isPending ||
                     updatePaymentMethodMutation.isPending}
          >
            {(addBankAccountMutation.isPending || 
              addMobileMoneyMutation.isPending ||
              addRhinoxPayIdMutation.isPending ||
              updatePaymentMethodMutation.isPending) ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ThemedText style={styles.saveAccountButtonText}>
                {editingMethodId ? 'Update Payment Method' : 'Save Payment Method'}
              </ThemedText>
            )}
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
              <ThemedText style={styles.bankModalTitle}>Select Bank</ThemedText>
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
            {isLoadingBanks ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading banks...
                </ThemedText>
              </View>
            ) : (
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
                  <ThemedText style={styles.bankListItemText}>{bank.name}</ThemedText>
                  {selectedBankType === bank.id ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Apply Button */}
            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, !selectedBankType && styles.applyButtonDisabled]}
                onPress={handleApplyBank}
                disabled={!selectedBankType}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Type Modal */}
      <Modal
        visible={showAccountTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountTypeModal(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <ThemedText style={styles.bankModalTitle}>Select Account Type</ThemedText>
              <TouchableOpacity onPress={() => setShowAccountTypeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bankList} contentContainerStyle={styles.bankListContent}>
              <TouchableOpacity
                style={styles.bankListItem}
                onPress={() => handleAccountTypeSelect('savings')}
              >
                <ThemedText style={styles.bankListItemText}>Savings</ThemedText>
                {accountType === 'savings' ? (
                  <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                ) : (
                  <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bankListItem}
                onPress={() => handleAccountTypeSelect('current')}
              >
                <ThemedText style={styles.bankListItemText}>Current</ThemedText>
                {accountType === 'current' ? (
                  <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                ) : (
                  <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Type Modal */}
      <Modal
        visible={showPaymentTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentTypeModal(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <ThemedText style={styles.bankModalTitle}>Select Payment Method Type</ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentTypeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bankList} contentContainerStyle={styles.bankListContent}>
              <TouchableOpacity
                style={styles.bankListItem}
                onPress={() => handlePaymentTypeSelect('bank_account')}
              >
                <ThemedText style={styles.bankListItemText}>Bank Account</ThemedText>
                {paymentMethodType === 'bank_account' ? (
                  <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                ) : (
                  <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bankListItem}
                onPress={() => handlePaymentTypeSelect('mobile_money')}
              >
                <ThemedText style={styles.bankListItemText}>Mobile Money</ThemedText>
                {paymentMethodType === 'mobile_money' ? (
                  <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                ) : (
                  <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bankListItem}
                onPress={() => handlePaymentTypeSelect('rhinoxpay_id')}
              >
                <ThemedText style={styles.bankListItemText}>RhinoxPay ID</ThemedText>
                {paymentMethodType === 'rhinoxpay_id' ? (
                  <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                ) : (
                  <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mobile Money Provider Modal */}
      <Modal
        visible={showMobileMoneyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMobileMoneyModal(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <ThemedText style={styles.bankModalTitle}>Select Mobile Money Provider</ThemedText>
              <TouchableOpacity onPress={() => setShowMobileMoneyModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Provider"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {isLoadingMobileMoneyProviders ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading providers...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.bankList} contentContainerStyle={styles.bankListContent}>
                {filteredMobileMoneyProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.bankListItem}
                    onPress={() => handleMobileMoneyProviderSelect(provider.id)}
                  >
                    {provider.logoUrl ? (
                      <Image
                        source={{ uri: `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}` }}
                        style={styles.providerLogo}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.providerLogoPlaceholder}>
                        <ThemedText style={styles.providerLogoText}>{provider.code || provider.name.charAt(0)}</ThemedText>
                      </View>
                    )}
                    <ThemedText style={styles.bankListItemText}>{provider.name}</ThemedText>
                    {selectedMobileMoneyProviderId === provider.id || selectedProviderId === provider.id ? (
                      <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.applyButtonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, !selectedMobileMoneyProviderId && !selectedProviderId && styles.applyButtonDisabled]}
                onPress={handleApplyMobileMoney}
                disabled={!selectedMobileMoneyProviderId && !selectedProviderId}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
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
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <ThemedText style={styles.bankModalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
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
              <ScrollView style={styles.bankList} contentContainerStyle={styles.bankListContent}>
                {countries.map((country: any) => (
                  <TouchableOpacity
                    key={country.id}
                    style={styles.bankListItem}
                    onPress={() => {
                      handleCountrySelect(country.code, country.name);
                      setSelectedCountryName(country.name);
                    }}
                  >
                    {country.flagUrl ? (
                      <Image
                        source={{ uri: country.flagUrl }}
                        style={styles.countryFlagModal}
                        resizeMode="cover"
                      />
                    ) : country.flag ? (
                      <ThemedText style={styles.countryFlagEmojiModal}>{country.flag}</ThemedText>
                    ) : null}
                    <ThemedText style={styles.bankListItemText}>{country.name}</ThemedText>
                    {countryCode === country.code ? (
                      <MaterialCommunityIcons name="checkbox-marked" size={24 * SCALE} color="#A9EF45" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
    paddingTop: 30* SCALE,
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
    paddingTop: 30* SCALE,
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
  saveAccountButtonDisabled: {
    opacity: 0.5,
  },
  saveAccountButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  setDefaultButton: {
    backgroundColor: 'rgba(169, 239, 69, 0.2)',
    borderRadius: 5 * SCALE,
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 5 * SCALE,
    marginLeft: 10 * SCALE,
  },
  setDefaultButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#A9EF45',
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
  countryFlagSmall: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
    marginRight: 8 * SCALE,
  },
  countryFlagEmojiSmall: {
    fontSize: 18 * SCALE,
    marginRight: 8 * SCALE,
  },
  countryFlagModal: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    marginRight: 12 * SCALE,
  },
  countryFlagEmojiModal: {
    fontSize: 24 * SCALE,
    marginRight: 12 * SCALE,
  },
  providerLogo: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    marginRight: 12 * SCALE,
  },
  providerLogoPlaceholder: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 * SCALE,
  },
  providerLogoText: {
    fontSize: 12 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

