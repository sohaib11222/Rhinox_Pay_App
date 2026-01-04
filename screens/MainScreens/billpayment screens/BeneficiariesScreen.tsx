import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetBillPaymentBeneficiaries } from '../../../queries/billPayment.queries';
import { useCreateBeneficiary, useUpdateBeneficiary, useDeleteBeneficiary } from '../../../mutations/billPayment.mutations';
import { useGetBillPaymentProviders } from '../../../queries/billPayment.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface Beneficiary {
  id: string | number;
  name: string;
  phoneNumber?: string;
  accountNumber?: string;
  accountType?: string;
  provider?: any;
  providerId?: number;
  categoryCode?: string;
}

const BeneficiariesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const categoryCode = (route.params as any)?.categoryCode || 'airtime';
  const selectedProvider = (route.params as any)?.selectedProvider;
  const onSelectBeneficiary = (route.params as any)?.onSelectBeneficiary;
  
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showEditBeneficiaryModal, setShowEditBeneficiaryModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newBeneficiaryPhone, setNewBeneficiaryPhone] = useState('');
  const [selectedProviderForNew, setSelectedProviderForNew] = useState<number | null>(selectedProvider || null);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Fetch beneficiaries from API
  const {
    data: beneficiariesData,
    isLoading: isLoadingBeneficiaries,
    refetch: refetchBeneficiaries,
  } = useGetBillPaymentBeneficiaries({ categoryCode });

  // Fetch providers for the category
  const {
    data: providersData,
    isLoading: isLoadingProviders,
  } = useGetBillPaymentProviders({
    categoryCode: categoryCode,
    countryCode: 'NG', // Default to Nigeria, can be made dynamic
  });

  // Transform providers
  const providers = useMemo(() => {
    if (!providersData?.data || !Array.isArray(providersData.data)) {
      return [];
    }
    return providersData.data.map((provider: any) => ({
      id: provider.id,
      name: provider.name || provider.code || '',
      code: provider.code || '',
      logoUrl: provider.logoUrl,
    }));
  }, [providersData?.data]);

  // Transform beneficiaries from API
  const beneficiaries: Beneficiary[] = useMemo(() => {
    if (!beneficiariesData?.data || !Array.isArray(beneficiariesData.data)) {
      return [];
    }
    return beneficiariesData.data.map((beneficiary: any) => ({
      id: beneficiary.id,
      name: beneficiary.name || '',
      phoneNumber: beneficiary.accountNumber || '',
      accountNumber: beneficiary.accountNumber || '',
      accountType: beneficiary.accountType || '',
      provider: beneficiary.provider,
      providerId: beneficiary.providerId || beneficiary.provider?.id,
      categoryCode: beneficiary.categoryCode || categoryCode,
    }));
  }, [beneficiariesData?.data, categoryCode]);

  // Create beneficiary mutation
  const createMutation = useCreateBeneficiary({
    onSuccess: (data) => {
      console.log('[BeneficiariesScreen] Beneficiary created successfully:', data);
      setNewBeneficiaryName('');
      setNewBeneficiaryPhone('');
      setSelectedProviderForNew(null);
      setShowAddBeneficiaryModal(false);
      refetchBeneficiaries();
      Alert.alert('Success', 'Beneficiary added successfully!');
    },
    onError: (error: any) => {
      console.error('[BeneficiariesScreen] Error creating beneficiary:', error);
      Alert.alert('Error', error?.message || 'Failed to create beneficiary');
    },
  });

  // Update beneficiary mutation
  const updateMutation = useUpdateBeneficiary({
    onSuccess: (data) => {
      console.log('[BeneficiariesScreen] Beneficiary updated successfully:', data);
      setEditingBeneficiary(null);
      setNewBeneficiaryName('');
      setNewBeneficiaryPhone('');
      setSelectedProviderForNew(null);
      setShowEditBeneficiaryModal(false);
      refetchBeneficiaries();
      Alert.alert('Success', 'Beneficiary updated successfully!');
    },
    onError: (error: any) => {
      console.error('[BeneficiariesScreen] Error updating beneficiary:', error);
      Alert.alert('Error', error?.message || 'Failed to update beneficiary');
    },
  });

  // Delete beneficiary mutation
  const deleteMutation = useDeleteBeneficiary({
    onSuccess: (data) => {
      console.log('[BeneficiariesScreen] Beneficiary deleted successfully:', data);
      setEditingBeneficiary(null);
      setShowDeleteConfirmModal(false);
      refetchBeneficiaries();
      Alert.alert('Success', 'Beneficiary deleted successfully!');
    },
    onError: (error: any) => {
      console.error('[BeneficiariesScreen] Error deleting beneficiary:', error);
      Alert.alert('Error', error?.message || 'Failed to delete beneficiary');
    },
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[BeneficiariesScreen] Refreshing beneficiaries data...');
    try {
      await refetchBeneficiaries();
      console.log('[BeneficiariesScreen] Beneficiaries data refreshed successfully');
    } catch (error) {
      console.error('[BeneficiariesScreen] Error refreshing beneficiaries data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // BeneficiariesScreen -> TransactionsStack -> TabNavigator
      // Go up 2 levels to reach the Tab Navigator
      const transactionsStack = navigation.getParent();
      const tabNavigator = transactionsStack?.getParent();

      if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
        tabNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Restore tab bar when leaving this screen
        const transactionsStackNav = navigation.getParent();
        const tabNavigatorNav = transactionsStackNav?.getParent();
        
        if (tabNavigatorNav && typeof tabNavigatorNav.setOptions === 'function') {
          tabNavigatorNav.setOptions({
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

  // Also hide on mount to ensure it's hidden immediately
  React.useLayoutEffect(() => {
    const transactionsStack = navigation.getParent();
    const tabNavigator = transactionsStack?.getParent();

    if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
      tabNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
  }, [navigation]);

  const handleAddBeneficiary = () => {
    if (!newBeneficiaryName || !newBeneficiaryPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedProviderForNew) {
      Alert.alert('Error', 'Please select a provider');
      return;
    }

    if (newBeneficiaryPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    createMutation.mutate({
      categoryCode: categoryCode,
      providerId: selectedProviderForNew,
      name: newBeneficiaryName,
      accountNumber: newBeneficiaryPhone,
    });
  };

  const handleUpdateBeneficiary = () => {
    if (!editingBeneficiary) return;

    if (!newBeneficiaryName || !newBeneficiaryPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newBeneficiaryPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    updateMutation.mutate({
      id: typeof editingBeneficiary.id === 'string' ? parseInt(editingBeneficiary.id) : editingBeneficiary.id,
      name: newBeneficiaryName,
      accountNumber: newBeneficiaryPhone,
      accountType: editingBeneficiary.accountType,
    });
  };

  const handleDeleteBeneficiary = () => {
    if (!editingBeneficiary) return;
    
    const beneficiaryId = typeof editingBeneficiary.id === 'string' 
      ? parseInt(editingBeneficiary.id) 
      : editingBeneficiary.id;
    
    deleteMutation.mutate(beneficiaryId);
  };

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    
    // If there's a callback function, call it and navigate back
    if (onSelectBeneficiary) {
      onSelectBeneficiary(beneficiary);
      navigation.goBack();
    }
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setNewBeneficiaryName(beneficiary.name);
    setNewBeneficiaryPhone(beneficiary.accountNumber || beneficiary.phoneNumber || '');
    setSelectedProviderForNew(beneficiary.providerId || beneficiary.provider?.id || null);
    setShowEditBeneficiaryModal(true);
  };

  const handleDeleteClick = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setShowDeleteConfirmModal(true);
  };

  // Check if buttons should be enabled
  const isAddButtonEnabled = useMemo(() => {
    return (
      newBeneficiaryName.length > 0 &&
      newBeneficiaryPhone.length >= 10 &&
      selectedProviderForNew !== null &&
      !createMutation.isPending
    );
  }, [newBeneficiaryName, newBeneficiaryPhone, selectedProviderForNew, createMutation.isPending]);

  const isUpdateButtonEnabled = useMemo(() => {
    return (
      newBeneficiaryName.length > 0 &&
      newBeneficiaryPhone.length >= 10 &&
      !updateMutation.isPending
    );
  }, [newBeneficiaryName, newBeneficiaryPhone, updateMutation.isPending]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
            <ThemedText style={styles.headerTitle}>Beneficiaries</ThemedText>
          </View>
        </View>

        {/* Beneficiaries Card */}
        <View style={styles.beneficiariesCard}>
          {isLoadingBeneficiaries ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading beneficiaries...
              </ThemedText>
            </View>
          ) : beneficiaries.length > 0 ? (
            <View style={styles.beneficiariesList}>
              {beneficiaries.map((beneficiary) => (
                <TouchableOpacity
                  key={String(beneficiary.id)}
                  style={[
                    styles.beneficiaryItem,
                    selectedBeneficiary?.id === beneficiary.id && styles.beneficiaryItemSelected,
                  ]}
                  onPress={() => handleSelectBeneficiary(beneficiary)}
                >
                  <View style={styles.beneficiaryInfo}>
                    <ThemedText style={styles.beneficiaryName}>{beneficiary.name}</ThemedText>
                    <ThemedText style={styles.beneficiaryPhone}>
                      {beneficiary.accountNumber || beneficiary.phoneNumber || ''}
                    </ThemedText>
                    {beneficiary.provider && (
                      <ThemedText style={styles.beneficiaryProvider}>
                        {beneficiary.provider.name || beneficiary.provider.code || ''}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.beneficiaryActions}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditBeneficiary(beneficiary);
                      }}
                      style={styles.editButton}
                    >
                      <Image
                        source={require('../../../assets/PencilSimpleLine (1).png')}
                        style={[{ marginBottom: -1, width: 26, height: 26 }]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(beneficiary);
                      }}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={24 * SCALE} color="#ff0000" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="account-plus-outline" size={48 * SCALE} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center' }}>
                No beneficiaries found. Add your first beneficiary below.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Proceed Button - Only shown when beneficiary is selected and no callback */}
        {selectedBeneficiary && !onSelectBeneficiary && (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => {
              // Navigate back with selected beneficiary
              // @ts-ignore - navigation typing
              navigation.navigate('Airtime', { selectedBeneficiary });
            }}
          >
            <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
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
          <ThemedText style={styles.addNewButtonText}>Add New</ThemedText>
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
              <ThemedText style={styles.modalTitle}>Add New Beneficiary</ThemedText>
              <TouchableOpacity onPress={() => setShowAddBeneficiaryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Name</ThemedText>
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
                <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
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
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Beneficiary Modal */}
      <Modal
        visible={showEditBeneficiaryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditBeneficiaryModal(false);
          setEditingBeneficiary(null);
          setNewBeneficiaryName('');
          setNewBeneficiaryPhone('');
          setSelectedProviderForNew(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Beneficiary</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowEditBeneficiaryModal(false);
                  setEditingBeneficiary(null);
                  setNewBeneficiaryName('');
                  setNewBeneficiaryPhone('');
                  setSelectedProviderForNew(null);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Name</ThemedText>
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
                <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
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

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.saveButton, !isUpdateButtonEnabled && styles.saveButtonDisabled]}
              onPress={handleUpdateBeneficiary}
              disabled={!isUpdateButtonEnabled}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Update</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowDeleteConfirmModal(false);
          setEditingBeneficiary(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <ThemedText style={styles.confirmModalTitle}>Delete Beneficiary</ThemedText>
            <ThemedText style={styles.confirmModalMessage}>
              Are you sure you want to delete {editingBeneficiary?.name}? This action cannot be undone.
            </ThemedText>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
                onPress={() => {
                  setShowDeleteConfirmModal(false);
                  setEditingBeneficiary(null);
                }}
              >
                <ThemedText style={styles.confirmModalButtonTextCancel}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalButtonDelete]}
                onPress={handleDeleteBeneficiary}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.confirmModalButtonTextDelete}>Delete</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Provider Selection Modal */}
      <Modal
        visible={showProviderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProviderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Provider</ThemedText>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {isLoadingProviders ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {providers.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.providerItem}
                    onPress={() => {
                      setSelectedProviderForNew(provider.id);
                      setShowProviderModal(false);
                    }}
                  >
                    <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedProviderForNew === provider.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedProviderForNew === provider.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
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
    paddingTop: 30 * SCALE,
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
  beneficiaryProvider: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2 * SCALE,
  },
  beneficiaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * SCALE,
  },
  editButton: {
    padding: 4 * SCALE,
  },
  deleteButton: {
    padding: 4 * SCALE,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF08',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 21 * SCALE,
    minHeight: 60 * SCALE,
  },
  selectInputText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  selectInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  providerName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  modalList: {
    paddingHorizontal: 20 * SCALE,
    maxHeight: 400,
  },
  confirmModalContent: {
    backgroundColor: '#020C19',
    borderRadius: 20 * SCALE,
    padding: 20 * SCALE,
    marginHorizontal: 20 * SCALE,
    maxWidth: '90%',
  },
  confirmModalTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 25 * SCALE,
    textAlign: 'center',
    lineHeight: 20 * SCALE,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12 * SCALE,
  },
  confirmModalButton: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmModalButtonDelete: {
    backgroundColor: '#ff0000',
  },
  confirmModalButtonTextCancel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  confirmModalButtonTextDelete: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});

export default BeneficiariesScreen;

