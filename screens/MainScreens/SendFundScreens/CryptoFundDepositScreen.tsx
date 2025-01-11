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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetUSDTTokens, useGetDepositAddress, useGetVirtualAccounts } from '../../../queries/crypto.queries';
import * as Clipboard from 'expo-clipboard';
import { showSuccessAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface Token {
  id: string;
  blockchain: string;
  blockchainName: string;
  currency: string;
  symbol: string;
  name: string;
  displayName: string;
  contractAddress?: string;
  decimals: number;
  isToken: boolean;
  price: string;
  nairaPrice: string;
}

const CryptoFundDepositScreen = () => {
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

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch available tokens
  const {
    data: tokensData,
    isLoading: isLoadingTokens,
    isError: isTokensError,
    error: tokensError,
    refetch: refetchTokens,
  } = useGetUSDTTokens();

  // Fetch virtual accounts first (includes balances and deposit addresses)
  const {
    data: virtualAccountsData,
    isLoading: isLoadingVirtualAccounts,
    isError: isVirtualAccountsError,
    error: virtualAccountsError,
    refetch: refetchVirtualAccounts,
  } = useGetVirtualAccounts();

  // Transform tokens
  const availableTokens = useMemo(() => {
    if (!tokensData?.data || !Array.isArray(tokensData.data)) {
      return [];
    }
    return tokensData.data.map((token: any) => ({
      id: token.id || `${token.blockchain}_${token.currency}`,
      blockchain: token.blockchain || '',
      blockchainName: token.blockchainName || token.blockchain || '',
      currency: token.currency || token.symbol || '',
      symbol: token.symbol || token.currency || '',
      name: token.name || token.currency || '',
      displayName: token.displayName || `${token.currency} (${token.blockchainName})`,
      contractAddress: token.contractAddress,
      decimals: token.decimals || 6,
      isToken: token.isToken || false,
      price: token.price || '0',
      nairaPrice: token.nairaPrice || '0',
    }));
  }, [tokensData?.data]);

  // Set default token
  useEffect(() => {
    if (!selectedToken && availableTokens.length > 0) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  // Get deposit address from virtual accounts first, then fetch if not available
  const depositAddressFromVirtualAccount = useMemo(() => {
    if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data) || !selectedToken) {
      return null;
    }
    const account = virtualAccountsData.data.find(
      (va: any) =>
        va.currency === selectedToken.currency &&
        va.blockchain === selectedToken.blockchain
    );
    
    // Check if depositAddresses array exists and has addresses
    if (account?.depositAddresses && Array.isArray(account.depositAddresses) && account.depositAddresses.length > 0) {
      // Get the first (most recent) deposit address
      const depositAddr = account.depositAddresses[0];
      return depositAddr?.address || null;
    }
    return null;
  }, [virtualAccountsData?.data, selectedToken]);

  // Fetch deposit address from API only if not found in virtual accounts
  const shouldFetchDepositAddress = useMemo(() => {
    return (
      !!selectedToken?.currency &&
      !!selectedToken?.blockchain &&
      !depositAddressFromVirtualAccount &&
      !isLoadingVirtualAccounts
    );
  }, [selectedToken, depositAddressFromVirtualAccount, isLoadingVirtualAccounts]);

  const {
    data: depositAddressData,
    isLoading: isLoadingDepositAddress,
    isError: isDepositAddressError,
    error: depositAddressError,
    refetch: refetchDepositAddress,
  } = useGetDepositAddress(
    selectedToken?.currency || '',
    selectedToken?.blockchain || '',
    {
      enabled: shouldFetchDepositAddress,
      queryKey: ['crypto', 'deposit-address', selectedToken?.currency || '', selectedToken?.blockchain || ''],
    } as any
  );

  // Set deposit address from virtual account or API
  useEffect(() => {
    if (depositAddressFromVirtualAccount) {
      setDepositAddress(depositAddressFromVirtualAccount);
    } else if (depositAddressData?.data?.address) {
      setDepositAddress(depositAddressData.data.address);
    } else if (selectedToken && !shouldFetchDepositAddress && !isLoadingDepositAddress) {
      // Clear address when token changes and no address available
      setDepositAddress(null);
    }
  }, [depositAddressFromVirtualAccount, depositAddressData?.data?.address, selectedToken, shouldFetchDepositAddress, isLoadingDepositAddress]);

  // Get balance for selected token
  const tokenBalance = useMemo(() => {
    if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data) || !selectedToken) {
      return null; // Return null to indicate loading/unknown
    }
    const account = virtualAccountsData.data.find(
      (va: any) =>
        va.currency === selectedToken.currency &&
        va.blockchain === selectedToken.blockchain
    );
    return account?.availableBalance || account?.accountBalance || '0.00';
  }, [virtualAccountsData?.data, selectedToken]);

  // Determine if deposit address is loading
  const isDepositAddressLoading = useMemo(() => {
    if (isLoadingVirtualAccounts) return true;
    if (depositAddressFromVirtualAccount) return false;
    return isLoadingDepositAddress;
  }, [isLoadingVirtualAccounts, depositAddressFromVirtualAccount, isLoadingDepositAddress]);

  // Handle copy address
  const handleCopyAddress = async () => {
    if (depositAddress) {
      await Clipboard.setStringAsync(depositAddress);
      setCopiedAddress(true);
      showSuccessAlert('Success', 'Address copied to clipboard');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Pull-to-refresh
  const handleRefresh = async () => {
    console.log('[Crypto Deposit] Refreshing data...');
    try {
      await Promise.all([
        refetchTokens(),
        refetchVirtualAccounts(),
        ...(shouldFetchDepositAddress ? [refetchDepositAddress()] : []),
      ]);
      console.log('[Crypto Deposit] Data refreshed successfully');
    } catch (error) {
      console.error('[Crypto Deposit] Error refreshing data:', error);
    }
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Crypto Deposit</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

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
        {/* Select Token Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Token</ThemedText>
          <TouchableOpacity
            style={styles.tokenSelector}
            onPress={() => setShowTokenModal(true)}
            disabled={isLoadingTokens}
          >
            {isLoadingTokens ? (
              <ActivityIndicator size="small" color="#A9EF45" />
            ) : selectedToken ? (
              <>
                <Image
                  source={require('../../../assets/CurrencyBtc.png')}
                  style={styles.tokenIcon}
                  resizeMode="cover"
                />
                <View style={styles.tokenInfo}>
                  <ThemedText style={styles.tokenName}>{selectedToken.displayName}</ThemedText>
                  {isLoadingVirtualAccounts ? (
                    <View style={styles.balanceLoadingContainer}>
                      <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
                      <ThemedText style={styles.tokenBalanceLoading}>Loading balance...</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.tokenBalance}>
                      Balance: {tokenBalance !== null ? `${tokenBalance} ${selectedToken.currency}` : `0.00 ${selectedToken.currency}`}
                    </ThemedText>
                  )}
                </View>
              </>
            ) : (
              <ThemedText style={styles.tokenSelectorPlaceholder}>Select a token</ThemedText>
            )}
            <MaterialCommunityIcons name="chevron-down" size={20 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Deposit Address Section */}
        {selectedToken && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Deposit Address</ThemedText>
            {isDepositAddressLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.loadingText}>Generating deposit address...</ThemedText>
              </View>
            ) : (isDepositAddressError || (isVirtualAccountsError && !depositAddressFromVirtualAccount)) ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
                <ThemedText style={styles.errorText}>
                  {depositAddressError?.message || virtualAccountsError?.message || 'Failed to get deposit address'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    if (isDepositAddressError && shouldFetchDepositAddress) {
                      refetchDepositAddress();
                    } else {
                      refetchVirtualAccounts();
                    }
                  }}
                >
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : depositAddress ? (
              <LinearGradient
                colors={['#A9EF4533', '#FFFFFF0D']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.addressCard}
              >
                <View style={styles.addressHeader}>
                  <ThemedText style={styles.addressLabel}>Your {selectedToken.currency} Address</ThemedText>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyAddress}
                  >
                    <MaterialCommunityIcons
                      name={copiedAddress ? 'check' : 'content-copy'}
                      size={20 * SCALE}
                      color={copiedAddress ? '#4CAF50' : '#A9EF45'}
                    />
                    <ThemedText style={styles.copyButtonText}>
                      {copiedAddress ? 'Copied!' : 'Copy'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.addressContainer}>
                  <ThemedText style={styles.addressText} selectable>
                    {depositAddress}
                  </ThemedText>
                </View>
                <View style={styles.networkInfo}>
                  <ThemedText style={styles.networkLabel}>Network:</ThemedText>
                  <ThemedText style={styles.networkValue}>{selectedToken.blockchainName}</ThemedText>
                </View>
                <View style={styles.warningContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#FFA726" />
                  <ThemedText style={styles.warningText}>
                    Only send {selectedToken.currency} on {selectedToken.blockchainName} network. 
                    Sending other tokens or using wrong network may result in permanent loss.
                  </ThemedText>
                </View>
              </LinearGradient>
            ) : !isDepositAddressLoading && !isDepositAddressError ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="wallet-outline" size={40 * SCALE} color="rgba(255, 255, 255, 0.3)" />
                <ThemedText style={styles.emptyText}>No deposit address available</ThemedText>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    if (shouldFetchDepositAddress) {
                      refetchDepositAddress();
                    } else {
                      refetchVirtualAccounts();
                    }
                  }}
                >
                  <ThemedText style={styles.retryButtonText}>Refresh</ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Instructions Section */}
        {selectedToken && depositAddress && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>How to Deposit</ThemedText>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>1</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  Copy the deposit address above
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>2</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  Open your external wallet (e.g., MetaMask, Trust Wallet)
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>3</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  Send {selectedToken.currency} to the copied address on {selectedToken.blockchainName} network
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>4</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  Funds will be credited automatically once confirmed on the blockchain
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Token Selection Modal */}
      <Modal
        visible={showTokenModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTokenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Token</ThemedText>
              <TouchableOpacity onPress={() => setShowTokenModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {isLoadingTokens ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.modalLoadingText}>Loading tokens...</ThemedText>
              </View>
            ) : isTokensError ? (
              <View style={styles.modalErrorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
                <ThemedText style={styles.modalErrorText}>
                  {tokensError?.message || 'Failed to load tokens'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => refetchTokens()}
                >
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {availableTokens.map((token) => (
                  <TouchableOpacity
                    key={token.id}
                    style={styles.tokenItem}
                    onPress={() => {
                      setSelectedToken(token);
                      setShowTokenModal(false);
                      // Address will be updated automatically via useEffect when token changes
                    }}
                  >
                    <Image
                      source={require('../../../assets/CurrencyBtc.png')}
                      style={styles.tokenItemIcon}
                      resizeMode="cover"
                    />
                    <View style={styles.tokenItemInfo}>
                      <ThemedText style={styles.tokenItemName}>{token.displayName}</ThemedText>
                      <ThemedText style={styles.tokenItemNetwork}>{token.blockchainName}</ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={selectedToken?.id === token.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24 * SCALE}
                      color={selectedToken?.id === token.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
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

export default CryptoFundDepositScreen;

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
    paddingTop: 30 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40 * SCALE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 40 * SCALE,
  },
  section: {
    marginBottom: 30 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 15 * SCALE,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15 * SCALE,
    gap: 12 * SCALE,
  },
  tokenIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  tokenBalance: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * SCALE,
  },
  tokenBalanceLoading: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6 * SCALE,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  emptyText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10 * SCALE,
    textAlign: 'center',
  },
  tokenSelectorPlaceholder: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  loadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10 * SCALE,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  errorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    marginTop: 10 * SCALE,
    textAlign: 'center',
    paddingHorizontal: 20 * SCALE,
  },
  retryButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingHorizontal: 30 * SCALE,
    paddingVertical: 12 * SCALE,
    marginTop: 20 * SCALE,
  },
  retryButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  addressCard: {
    borderRadius: 10 * SCALE,
    padding: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(169, 239, 69, 0.3)',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15 * SCALE,
  },
  addressLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * SCALE,
  },
  copyButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  addressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8 * SCALE,
    padding: 12 * SCALE,
    marginBottom: 15 * SCALE,
  },
  addressText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15 * SCALE,
    gap: 8 * SCALE,
  },
  networkLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  networkValue: {
    fontSize: 12 * SCALE,
    fontWeight: '500',
    color: '#A9EF45',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    borderRadius: 8 * SCALE,
    padding: 12 * SCALE,
    gap: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 167, 38, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 11 * SCALE,
    fontWeight: '300',
    color: '#FFA726',
    lineHeight: 16 * SCALE,
  },
  instructionsList: {
    gap: 15 * SCALE,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15 * SCALE,
  },
  instructionNumber: {
    width: 30 * SCALE,
    height: 30 * SCALE,
    borderRadius: 15 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  instructionText: {
    flex: 1,
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18 * SCALE,
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
  modalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  modalLoadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10 * SCALE,
  },
  modalErrorContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
    paddingHorizontal: 20 * SCALE,
  },
  modalErrorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    marginTop: 10 * SCALE,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 400,
    padding: 10 * SCALE,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15 * SCALE,
    marginBottom: 10 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokenItemIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 15 * SCALE,
  },
  tokenItemInfo: {
    flex: 1,
  },
  tokenItemName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  tokenItemNetwork: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

