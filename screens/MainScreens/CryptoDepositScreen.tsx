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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import TransactionReceiptModal from '../components/TransactionReceiptModal';
import TransactionErrorModal from '../components/TransactionErrorModal';
import { ThemedText } from '../../components';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useGetTransactionHistory, useGetTransactionDetails } from '../../queries/transactionHistory.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Transaction interface for API integration
interface CryptoDepositTransaction {
  id: string;
  recipientName: string;
  amountNGN: string;
  amountUSD: string;
  date: string;
  status: 'Successful' | 'Pending' | 'Failed';
  paymentMethod: 'Bank Transfer' | 'Mobile Money';
  // For receipt modal
  transferAmount?: string;
  fee?: string;
  paymentAmount?: string;
  country?: string;
  bank?: string;
  accountNumber?: string;
  accountName?: string;
  transactionId?: string;
  dateTime?: string;
  // Crypto deposit specific fields
  cryptoType?: string; // e.g., 'Ethereum', 'Bitcoin', 'USDT'
  network?: string; // e.g., 'Ethereum', 'Bitcoin'
  quantity?: string; // e.g., '0.25 ETH'
  amountUSDValue?: string; // e.g., '$2,550.50'
  feeCrypto?: string; // e.g., '0.000001 ETH'
  feeUSD?: string; // e.g., '$2.50'
  receivingAddress?: string; // Wallet address
  sendingAddress?: string; // Sender address
  txHash?: string; // Transaction hash
}

const CryptoDepositScreen = () => {
  const navigation = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CryptoDepositTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Fetch transaction history from API
  const {
    data: transactionHistoryData,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useGetTransactionHistory({
    period: 'M', // Default to Monthly
    currency: selectedCurrency !== 'All' ? selectedCurrency : undefined,
  }, {
    queryKey: ['transaction-history', 'crypto-deposits', selectedCurrency],
  } as any);

  // Get transaction details when a transaction is selected
  const selectedTransactionId = selectedTransaction?.id ? parseInt(selectedTransaction.id) : null;
  const {
    data: transactionDetailsData,
    isLoading: isLoadingDetails,
  } = useGetTransactionDetails(
    selectedTransactionId || 0,
    {
      enabled: !!selectedTransactionId && showReceiptModal,
      queryKey: ['transaction-history', 'details', selectedTransactionId || 0],
    } as any
  );

  // Extract and filter crypto deposits from API response
  const cryptoDeposits = useMemo(() => {
    if (!transactionHistoryData?.data?.crypto || !Array.isArray(transactionHistoryData.data.crypto)) {
      return [];
    }
    // Filter for deposits only
    return transactionHistoryData.data.crypto.filter(
      (tx: any) => tx.type === 'deposit' && tx.normalizedType === 'Crypto Deposit'
    );
  }, [transactionHistoryData?.data?.crypto]);

  // Get summary data from API
  const summaryData = useMemo(() => {
    const transactionData = transactionHistoryData?.data;
    const summary = transactionData?.summary || { total: '0', incoming: '0', outgoing: '0' };
    
    // Calculate incoming/outgoing from crypto deposits
    const incoming = cryptoDeposits
      .filter((tx: any) => tx.status === 'completed')
      .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0);
    
    const outgoing = cryptoDeposits
      .filter((tx: any) => tx.status === 'completed' && tx.type === 'withdrawal')
      .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0);

    return {
      incoming: {
        ngn: summary.incoming || incoming.toFixed(2),
        usd: `$${incoming.toFixed(2)}`,
      },
      outgoing: {
        ngn: summary.outgoing || outgoing.toFixed(2),
        usd: `$${outgoing.toFixed(2)}`,
      },
    };
  }, [transactionHistoryData?.data?.summary, cryptoDeposits]);

  // Transform API transactions to UI format
  const cryptoDepositTransactions: CryptoDepositTransaction[] = useMemo(() => {
    if (!cryptoDeposits || cryptoDeposits.length === 0) {
      return [];
    }

    return cryptoDeposits.map((tx: any) => {
      // Format address (show first and last few characters)
      const address = tx.metadata?.fromAddress || tx.metadata?.toAddress || '';
      const formattedAddress = address.length > 12 
        ? `${address.substring(0, 6)}...${address.substring(address.length - 6)}`
        : address;

      // Format date
      const date = tx.completedAt || tx.createdAt || '';
      const formattedDate = date 
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

      // Map status
      const statusMap: Record<string, 'Successful' | 'Pending' | 'Failed'> = {
        'completed': 'Successful',
        'pending': 'Pending',
        'failed': 'Failed',
      };

      // Determine crypto type from currency
      const cryptoType = tx.currency === 'ETH' ? 'Ethereum' :
                        tx.currency === 'BTC' ? 'Bitcoin' :
                        tx.currency || 'USDT';

      // Format amount
      const amount = parseFloat(tx.amount || '0');
      const amountInUSD = tx.amountInUSD ? parseFloat(tx.amountInUSD) : amount;

      return {
        id: String(tx.id),
        recipientName: formattedAddress,
        amountNGN: `N${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        amountUSD: `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        date: formattedDate.replace(',', ''),
        status: statusMap[tx.status] || 'Pending',
        paymentMethod: 'Bank Transfer', // Default for display
        transferAmount: `${tx.amount} ${tx.currency}`,
        fee: tx.fee ? `$${parseFloat(tx.fee).toFixed(2)}` : '$0.00',
        paymentAmount: `${tx.amount} ${tx.currency}`,
        cryptoType: cryptoType,
        network: tx.metadata?.blockchain || cryptoType,
        quantity: `${tx.amount} ${tx.currency}`,
        amountUSDValue: `$${amountInUSD.toFixed(2)}`,
        feeCrypto: tx.metadata?.networkFee ? `${tx.metadata.networkFee} ${tx.currency}` : '0',
        feeUSD: tx.fee ? `$${parseFloat(tx.fee).toFixed(2)}` : '$0.00',
        receivingAddress: tx.metadata?.toAddress || '',
        sendingAddress: tx.metadata?.fromAddress || '',
        txHash: tx.metadata?.txHash || '',
        transactionId: tx.reference || String(tx.id),
        dateTime: tx.completedAt 
          ? new Date(tx.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'N/A',
      };
    });
  }, [cryptoDeposits]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await refetchHistory();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Update transaction details when details are fetched
  useEffect(() => {
    if (transactionDetailsData?.data && selectedTransaction) {
      const details = transactionDetailsData.data;
      // Update selected transaction with full details
      const updatedTransaction = {
        ...selectedTransaction,
        receivingAddress: details.metadata?.toAddress || selectedTransaction.receivingAddress,
        sendingAddress: details.metadata?.fromAddress || selectedTransaction.sendingAddress,
        txHash: details.metadata?.txHash || selectedTransaction.txHash,
        feeCrypto: details.metadata?.networkFee ? `${details.metadata.networkFee} ${details.currency}` : selectedTransaction.feeCrypto,
      };
      setSelectedTransaction(updatedTransaction);
    }
  }, [transactionDetailsData?.data, selectedTransaction]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Successful':
        return '#008000'; // Green
      case 'Pending':
        return '#ffa500'; // Orange
      case 'Failed':
        return '#ff0000'; // Red
      default:
        return '#008000';
    }
  };

  const handleTransactionPress = (transaction: CryptoDepositTransaction) => {
    if (transaction.status === 'Failed') {
      setSelectedTransaction(transaction);
      setShowErrorModal(true);
    } else {
      setSelectedTransaction(transaction);
      setShowReceiptModal(true);
    }
  };

  const filteredTransactions = useMemo(() => {
    return cryptoDepositTransactions.filter((transaction) => {
      if (selectedStatus !== 'All' && transaction.status !== selectedStatus) {
        return false;
      }
      if (selectedType !== 'All' && transaction.cryptoType !== selectedType) {
        return false;
      }
      if (selectedCurrency !== 'All') {
        // Check currency based on crypto type
        const currencyMap: Record<string, string[]> = {
          'ETH': ['ETH', 'Ethereum'],
          'BTC': ['BTC', 'Bitcoin'],
          'USDT': ['USDT'],
        };
        const matchCurrency = Object.entries(currencyMap).some(([curr, values]) => 
          curr === selectedCurrency && values.some(v => transaction.cryptoType?.includes(v))
        );
        if (!matchCurrency) return false;
      }
      return true;
    });
  }, [cryptoDepositTransactions, selectedStatus, selectedType, selectedCurrency]);

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
            <ThemedText style={styles.headerTitle}>Crypto Deposit</ThemedText>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterBarContent}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowCurrencyDropdown(false);
                setShowTypeDropdown(false);
              }}
            >
              <ThemedText style={styles.filterButtonText}>
                {selectedStatus !== 'All' ? selectedStatus : 'Status'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setShowCurrencyDropdown(!showCurrencyDropdown);
                setShowTypeDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              <ThemedText style={styles.filterButtonText}>
                {selectedCurrency !== 'All' ? selectedCurrency : 'Currency'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowCurrencyDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              <ThemedText style={styles.filterButtonText}>
                {selectedType !== 'All' ? selectedType : 'Type'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        {isLoadingHistory ? (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCardGradient, styles.loadingCard]}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
            <View style={[styles.summaryCardWhite, styles.loadingCard]}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['#4880C0', '#1B589E']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.summaryCardGradient}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconCircle}>
                  <Image
                    source={require('../../assets/ArrowLineDownLeft (1).png')}
                    style={styles.summaryIconImage}
                    resizeMode="cover"
                  />
                </View>
                <ThemedText style={styles.summaryLabel}>Incoming</ThemedText>
              </View>
              <View style={styles.summaryAmountContainer}>
                <View style={styles.summaryAmountRow}>
                  <ThemedText style={styles.summaryAmountMain}>{summaryData.incoming.ngn}</ThemedText>
                  <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.summaryUSD}>{summaryData.incoming.usd}</ThemedText>
            </LinearGradient>

            <View style={styles.summaryCardWhite}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconCircleWhite}>
                  <Image
                    source={require('../../assets/Vector (31).png')}
                    style={styles.summaryIconImage}
                    resizeMode="cover"
                  />
                </View>
                <ThemedText style={styles.summaryLabelWhite}>Outgoing</ThemedText>
              </View>
              <View style={styles.summaryAmountContainer}>
                <View style={styles.summaryAmountRow}>
                  <ThemedText style={styles.summaryAmountMainWhite}>{summaryData.outgoing.ngn}</ThemedText>
                  <ThemedText style={styles.summaryAmountCurrencyWhite}>NGN</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.summaryUSDWhite}>{summaryData.outgoing.usd}</ThemedText>
            </View>
          </View>
        )}

        {/* Dropdowns */}
        {showStatusDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 }]}>
            <View style={styles.dropdown}>
              {['All', 'Successful', 'Pending', 'Failed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedStatus(status);
                    setShowStatusDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{status}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showCurrencyDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 + (SCREEN_WIDTH * 0.85 * 1/3) }]}>
            <View style={styles.dropdown}>
              {['All', 'NGN', 'USD', 'GBP', 'ETH', 'BTC', 'USDT'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCurrency(currency);
                    setShowCurrencyDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{currency}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showTypeDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 + (SCREEN_WIDTH * 0.85 * 2/3) }]}>
            <View style={styles.dropdown}>
              {['All', 'Ethereum', 'Bitcoin', 'USDT'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedType(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{type}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Transaction List Card */}
        <View style={styles.transactionCard}>
          <ThemedText style={styles.cardTitle}>Crypto Deposits</ThemedText>
          {isLoadingHistory ? (
            <View style={styles.transactionLoadingContainer}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
            </View>
          ) : isHistoryError ? (
            <View style={styles.transactionErrorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={styles.errorText}>
                {historyError?.message || 'Failed to load transactions'}
              </ThemedText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchHistory()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.transactionEmptyContainer}>
              <MaterialCommunityIcons name="wallet-outline" size={40 * SCALE} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText style={styles.emptyText}>No crypto deposits found</ThemedText>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
              >
                <View style={styles.transactionIconContainer}>
                  <View style={styles.transactionIconCircle}>
                    <MaterialCommunityIcons
                      name="bitcoin"
                      size={20 * SCALE}
                      color="#A9EF45"
                    />
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionTitle}>{transaction.recipientName}</ThemedText>
                  <View style={styles.transactionStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(transaction.status) },
                      ]}
                    />
                    <ThemedText style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                      {transaction.status}
                      {transaction.cryptoType && ` • ${transaction.cryptoType}`}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <ThemedText style={styles.transactionAmountNGN}>{transaction.amountNGN}</ThemedText>
                  <ThemedText style={styles.transactionAmountUSD}>{transaction.date}</ThemedText>
                </View>
              </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Transaction Receipt Modal */}
      {selectedTransaction && (
        <TransactionReceiptModal
          visible={showReceiptModal}
          transaction={{
            ...selectedTransaction,
            transactionType: 'cryptoDeposit',
            status: selectedTransaction.status,
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* Transaction Error Modal */}
      {selectedTransaction && (
        <TransactionErrorModal
          visible={showErrorModal}
          transaction={selectedTransaction}
          onRetry={() => {
            // TODO: Implement retry logic
            setShowErrorModal(false);
            setSelectedTransaction(null);
          }}
          onCancel={() => {
            setShowErrorModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
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
    paddingTop: 30* SCALE,
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
    marginLeft:-40,
  },
  filterBar: {
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  filterBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    height: 39 * SCALE,
    paddingHorizontal: 15 * SCALE,
    justifyContent: 'space-between',
  },
  filterDivider: {
    width: 0.3,
    height: 13 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10 * SCALE,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    paddingHorizontal: 10 * SCALE,
    flex: 1,
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 12 * SCALE,
    marginBottom: 10 * SCALE,
  },
  summaryCardGradient: {
    flex: 1,
    borderRadius: 15 * SCALE,
    padding: 11 * SCALE,
    minHeight: 87 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryCardWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15 * SCALE,
    padding: 11 * SCALE,
    minHeight: 87 * SCALE,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 * SCALE,
  },
  summaryIconCircle: {
    width: 17 * SCALE,
    height: 17 * SCALE,
    borderRadius: 12.5 * SCALE,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8 * SCALE,
  },
  summaryIconCircleWhite: {
    width: 17 * SCALE,
    height: 17 * SCALE,
    borderRadius: 8.5 * SCALE,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8 * SCALE,
  },
  summaryIconImage: {
    width: 7 * SCALE,
    height: 7 * SCALE,
  },
  summaryLabel: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryLabelWhite: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  summaryAmountContainer: {
    marginBottom: 6 * SCALE,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryAmountMain: {
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 24 * SCALE,
  },
  summaryAmountMainWhite: {
    fontSize: 20 * SCALE,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 24 * SCALE,
  },
  summaryAmountCurrency: {
    fontSize: 8 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4 * SCALE,
    lineHeight: 20 * SCALE,
    marginBottom: 2 * SCALE,
  },
  summaryAmountCurrencyWhite: {
    fontSize: 8 * SCALE,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 4 * SCALE,
    lineHeight: 20 * SCALE,
    marginBottom: 2 * SCALE,
  },
  summaryUSD: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryUSDWhite: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 130 * SCALE,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#020C19',
    borderRadius: 10 * SCALE,
    paddingVertical: 8 * SCALE,
    minWidth: 148 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownItem: {
    paddingHorizontal: 13 * SCALE,
    paddingVertical: 8 * SCALE,
  },
  dropdownItemText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 5 * SCALE,
  },
  cardTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  transactionList: {
    gap: 8 * SCALE,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15 * SCALE,
    padding: 10 * SCALE,
    borderRadius: 10 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionIconContainer: {
    marginRight: 12 * SCALE,
  },
  transactionIconCircle: {
    width: 35 * SCALE,
    height: 35 * SCALE,
    borderRadius: 17.5 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconImage: {
    width: 20 * SCALE,
    height: 20 * SCALE,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  transactionTitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  transactionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
  },
  statusDot: {
    width: 6 * SCALE,
    height: 6 * SCALE,
    borderRadius: 3 * SCALE,
  },
  transactionStatus: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmountNGN: {
    fontSize: 12 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  transactionAmountUSD: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 87 * SCALE,
  },
  transactionLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  loadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10 * SCALE,
  },
  transactionErrorContainer: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
    paddingHorizontal: 20 * SCALE,
  },
  errorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    marginTop: 10 * SCALE,
    textAlign: 'center',
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
  transactionEmptyContainer: {
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
});

export default CryptoDepositScreen;

