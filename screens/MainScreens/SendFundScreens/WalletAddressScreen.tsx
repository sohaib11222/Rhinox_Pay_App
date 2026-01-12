import React, { useState, useMemo, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { showSuccessAlert, showErrorAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const WalletAddressScreen = () => {
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

  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; balance: string; icon: any; blockchain?: string } | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [balance, setBalance] = useState('0.00000000');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<{ id: string; name: string } | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<string | null>(null);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');

  // Fetch wallet balances
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useGetWalletBalances();

  // Fetch countries
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Get crypto wallets from API
  const cryptoWallets = useMemo(() => {
    if (!balancesData?.data?.crypto || !Array.isArray(balancesData.data.crypto)) {
      return [];
    }
    return balancesData.data.crypto.filter((w: any) => w.active !== false);
  }, [balancesData?.data?.crypto]);

  // Initialize selected asset
  useEffect(() => {
    if (!selectedAsset && cryptoWallets.length > 0) {
      const firstWallet = cryptoWallets[0];
      setSelectedAsset({
        id: String(firstWallet.id || firstWallet.currency),
        name: firstWallet.currency || firstWallet.symbol || 'BTC',
        balance: firstWallet.balance || firstWallet.availableBalance || '0',
        icon: require('../../../assets/CurrencyBtc.png'),
        blockchain: firstWallet.blockchain,
      });
      setBalance(firstWallet.balance || firstWallet.availableBalance || '0');
    }
  }, [cryptoWallets, selectedAsset]);

  // Update balance when asset changes
  useEffect(() => {
    if (selectedAsset) {
      const wallet = cryptoWallets.find((w: any) => 
        w.currency === selectedAsset.name || 
        w.symbol === selectedAsset.name
      );
      if (wallet) {
        setBalance(wallet.balance || wallet.availableBalance || '0');
      }
    }
  }, [selectedAsset, cryptoWallets]);

  // Get networks based on selected asset
  const networks = useMemo(() => {
    if (!selectedAsset?.blockchain) return [];
    // Map blockchain to network options
    const networkMap: { [key: string]: { id: string; name: string }[] } = {
      'ethereum': [
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'arbitrum', name: 'Arbitrum' },
        { id: 'polygon', name: 'Polygon' },
      ],
      'bitcoin': [
        { id: 'bitcoin', name: 'Bitcoin' },
      ],
      'tron': [
        { id: 'tron', name: 'Tron' },
      ],
    };
    return networkMap[selectedAsset.blockchain.toLowerCase()] || [{ id: selectedAsset.blockchain, name: selectedAsset.blockchain }];
  }, [selectedAsset?.blockchain]);

  // Set default network when networks change
  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0]);
    }
  }, [networks, selectedNetwork]);

  const quickAmounts = ['25%', '50%', '75%', '100%'];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await refetchBalances();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace('%', '');
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const calculatedAmount = (balanceNum * parseFloat(numericValue)) / 100;
    setAmount(calculatedAmount.toFixed(8));
    setSelectedPercentage(quickAmount);
  };

  const formatBalanceNoDecimals = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00000000';
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  const handleProceed = () => {
    if (!walletAddress.trim()) {
      showErrorAlert('Validation Error', 'Please enter a wallet address');
      return;
    }
    if (!selectedNetwork) {
      showErrorAlert('Validation Error', 'Please select a network');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid amount');
      return;
    }
    // TODO: Implement external wallet transfer API call
    showErrorAlert('Coming Soon', 'External wallet transfers are coming soon. Please use Rhinox User transfers for now.');
  };

  const isButtonEnabled = useMemo(() => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    return walletAddress.trim() !== '' &&
           selectedNetwork !== null &&
           amount.trim() !== '' &&
           !isNaN(numericAmount) &&
           numericAmount > 0 &&
           numericAmount <= parseFloat(balance.replace(/,/g, ''));
  }, [walletAddress, selectedNetwork, amount, balance]);

  // Filter crypto wallets for asset modal
  const filteredCryptoWallets = useMemo(() => {
    if (!assetSearchTerm.trim()) {
      return cryptoWallets;
    }
    const query = assetSearchTerm.toLowerCase();
    return cryptoWallets.filter((w: any) => {
      const currency = (w.currency || w.symbol || '').toLowerCase();
      return currency.includes(query);
    });
  }, [cryptoWallets, assetSearchTerm]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <ThemedText style={styles.headerTitle}>Send to Wallet Address</ThemedText>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSectionContainer}>
          <LinearGradient
            colors={['#A9EF4533', '#FFFFFF0D']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardContent}>
              <ThemedText style={styles.balanceLabel}>
                {selectedAsset?.name || 'Crypto'} Balance
              </ThemedText>
              <View style={styles.balanceRow}>
                <Image
                  source={require('../../../assets/Vector (34).png')}
                  style={styles.walletIcon}
                  resizeMode="cover"
                />
                {isLoadingBalances ? (
                  <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                ) : (
                  <ThemedText style={styles.balanceAmount}>
                    {formatBalanceNoDecimals(balance)} {selectedAsset?.name || 'BTC'}
                  </ThemedText>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.assetSelector}
              onPress={() => setShowAssetModal(true)}
            >
              {selectedAsset ? (
                <>
                  <Image
                    source={selectedAsset.icon}
                    style={styles.assetSelectorIcon}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.assetSelectorText}>{selectedAsset.name}</ThemedText>
                </>
              ) : (
                <>
                  <Image
                    source={require('../../../assets/CurrencyBtc.png')}
                    style={styles.assetSelectorIcon}
                    resizeMode="cover"
                  />
                  <ThemedText style={styles.assetSelectorText}>Select Asset</ThemedText>
                </>
              )}
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputLabelContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => {
                  // Allow decimal input for crypto
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setAmount(cleaned);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00000000"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <ThemedText style={styles.amountCurrencyLabel}>
                {selectedAsset?.name || 'BTC'}
              </ThemedText>
            </View>
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount) => {
                const isSelected = selectedPercentage === quickAmount;
                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[styles.quickAmountButton, isSelected && styles.quickAmountButtonSelected]}
                    onPress={() => handleAmountSelect(quickAmount)}
                  >
                    <ThemedText style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                      {quickAmount}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Network Selection */}
            <TouchableOpacity
              style={styles.networkField}
              onPress={() => setShowNetworkModal(true)}
              disabled={!selectedAsset || networks.length === 0}
            >
              <ThemedText style={[styles.networkFieldText, !selectedNetwork && styles.placeholder]}>
                {selectedNetwork?.name || 'Select Network'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Wallet Address Input */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste wallet address"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={walletAddress}
                onChangeText={setWalletAddress}
                multiline={false}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {walletAddress.length > 0 && (
                <TouchableOpacity
                  onPress={async () => {
                    const text = await Clipboard.getStringAsync();
                    if (text) {
                      setWalletAddress(text.trim());
                      showSuccessAlert('Pasted', 'Wallet address pasted');
                    }
                  }}
                  style={styles.pasteButton}
                >
                  <MaterialCommunityIcons name="content-paste" size={18 * SCALE} color="#A9EF45" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Warning Messages */}
        <View style={styles.warningSection}>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <ThemedText style={styles.warningText}>
              Make sure to send tokens on the correct blockchain network
            </ThemedText>
          </View>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <ThemedText style={styles.warningText}>Withdrawals take 10-15 mins</ThemedText>
          </View>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <ThemedText style={styles.warningText}>In case of loss of funds contact support</ThemedText>
          </View>
        </View>

        {/* Proceed Button */}
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity
            style={[styles.proceedButton, !isButtonEnabled && styles.proceedButtonDisabled]}
            onPress={handleProceed}
            disabled={!isButtonEnabled}
          >
            <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
          </TouchableOpacity>
        </View>
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
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={assetSearchTerm}
                onChangeText={setAssetSearchTerm}
              />
            </View>
            <ScrollView style={styles.modalList}>
              {isLoadingBalances ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : filteredCryptoWallets.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {assetSearchTerm.trim() ? 'No assets found' : 'No crypto wallets available'}
                  </ThemedText>
                </View>
              ) : (
                filteredCryptoWallets.map((wallet: any) => {
                  let icon = require('../../../assets/CurrencyBtc.png');
                  const currency = wallet.currency || wallet.symbol || '';
                  
                  const asset = {
                    id: String(wallet.id || currency),
                    name: currency,
                    balance: wallet.balance || wallet.availableBalance || '0',
                    icon: icon,
                    blockchain: wallet.blockchain,
                  };
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={styles.assetItem}
                      onPress={() => {
                        setSelectedAsset(asset);
                        setBalance(asset.balance);
                        setShowAssetModal(false);
                        setAssetSearchTerm('');
                      }}
                    >
                      <Image
                        source={asset.icon}
                        style={styles.assetItemIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.assetItemInfo}>
                        <ThemedText style={styles.assetItemName}>{asset.name}</ThemedText>
                        <ThemedText style={styles.assetItemBalance}>
                          Bal : {formatBalanceNoDecimals(asset.balance)}
                        </ThemedText>
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Network Selection Modal */}
      <Modal
        visible={showNetworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Network</ThemedText>
              <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {networks.map((network) => {
                const isSelected = selectedNetwork?.id === network.id;
                return (
                  <TouchableOpacity
                    key={network.id}
                    style={styles.networkItem}
                    onPress={() => {
                      setSelectedNetwork(network);
                      setShowNetworkModal(false);
                    }}
                  >
                    <ThemedText style={styles.networkItemText}>{network.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default WalletAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 30 * SCALE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 45 * SCALE,
    paddingBottom: 13 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
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
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  balanceSectionContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  balanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceCardContent: {
    marginBottom: 12 * SCALE,
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
  walletIcon: {
    width: 18 * SCALE,
    height: 16 * SCALE,
  },
  balanceAmount: {
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#A9EF45',
  },
  assetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    alignSelf: 'flex-start',
  },
  assetSelectorIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  assetSelectorText: {
    fontSize: 14 * SCALE,
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
    marginBottom: 20 * SCALE,
  },
  amountSection: {
    marginBottom: 20 * SCALE,
  },
  amountInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12 * SCALE,
  },
  amountInput: {
    flex: 1,
    fontSize: 32 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  amountCurrencyLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8 * SCALE,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    gap: 8 * SCALE,
  },
  quickAmountButton: {
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 6 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickAmountButtonSelected: {
    backgroundColor: '#A9EF45',
    borderColor: '#A9EF45',
  },
  quickAmountText: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickAmountTextSelected: {
    color: '#000000',
    fontWeight: '500',
  },
  formFields: {
    gap: 12 * SCALE,
  },
  networkField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 15 * SCALE,
  },
  networkFieldText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 15 * SCALE,
  },
  textInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  pasteButton: {
    marginLeft: 8 * SCALE,
    padding: 4 * SCALE,
  },
  warningSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    gap: 8 * SCALE,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8 * SCALE,
  },
  warningText: {
    flex: 1,
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  proceedButtonContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 15 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 16 * SCALE,
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
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 400,
    paddingHorizontal: 20 * SCALE,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10 * SCALE,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
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
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20 * SCALE,
    marginTop: 10 * SCALE,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
  },
  networkItemText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});

