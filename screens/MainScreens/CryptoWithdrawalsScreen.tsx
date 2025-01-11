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
interface CryptoWithdrawalTransaction {
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
  // Crypto withdrawal specific fields
  cryptoType?: string; // e.g., 'Ethereum', 'Bitcoin', 'USDT'
  network?: string; // e.g., 'Ethereum', 'Bitcoin'
  quantity?: string; // e.g., '0.25 ETH'
  amountUSDValue?: string; // e.g., '$2,550.50'
  feeCrypto?: string; // e.g., '0.000001 ETH'
  feeUSD?: string; // e.g., '$2.50'
  receivingAddress?: string; // Wallet address (where crypto is being sent)
  sendingAddress?: string; // Sender address (user's wallet)
  txHash?: string; // Transaction hash
  rawData?: any; // Store raw API data for reference
}

const CryptoWithdrawalsScreen = () => {
  const navigation = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CryptoWithdrawalTransaction | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Build query params for transaction history
  const queryParams = useMemo(() => {
    const params: any = {
      period: 'M', // Default to Monthly
    };
    
    if (selectedCurrency !== 'All') {
      params.currency = selectedCurrency;
    }
    
    return params;
  }, [selectedCurrency]);

  // Fetch transaction history from API
  const {
    data: transactionHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useGetTransactionHistory(queryParams);

  // Fetch transaction details when a transaction is selected
  const {
    data: transactionDetailsData,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useGetTransactionDetails(selectedTransactionId || 0, {
    enabled: !!selectedTransactionId,
    queryKey: ['transaction-history', 'details', selectedTransactionId],
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[CryptoWithdrawals] Refreshing data...');
    try {
      await refetchHistory();
      console.log('[CryptoWithdrawals] Data refreshed successfully');
    } catch (error) {
      console.error('[CryptoWithdrawals] Error refreshing data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Helper function to normalize status
  const normalizeStatus = (status: string): 'Successful' | 'Pending' | 'Failed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'successful') return 'Successful';
    if (statusLower === 'pending') return 'Pending';
    if (statusLower === 'failed') return 'Failed';
    return 'Successful'; // Default
  };

  // Format currency amount
  const formatCurrency = (amount: string | number, currency: string = 'NGN') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatUSD = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Extract and transform crypto withdrawal transactions from API response
  const cryptoWithdrawalTransactions: CryptoWithdrawalTransaction[] = useMemo(() => {
    if (!transactionHistoryData?.data?.crypto || !Array.isArray(transactionHistoryData.data.crypto)) {
      return [];
    }

    // Filter for withdrawals only
    const withdrawals = transactionHistoryData.data.crypto.filter(
      (tx: any) => tx.type === 'withdrawal' || tx.normalizedType === 'Crypto Withdrawals'
    );

    // Transform to UI format
    return withdrawals.map((tx: any) => {
      const metadata = tx.metadata || {};
      const toAddress = metadata.toAddress || '';
      const addressPreview = toAddress.length > 10 
        ? `${toAddress.substring(0, 6)}...${toAddress.substring(toAddress.length - 6)}`
        : toAddress;

      const amount = parseFloat(tx.amount || '0');
      const fee = parseFloat(tx.fee || '0');
      const currency = tx.currency || 'USDT';
      
      // Format date
      const date = tx.createdAt || tx.completedAt || '';
      let formattedDate = 'N/A';
      if (date) {
        try {
          const dateObj = new Date(date);
          formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {
          formattedDate = date;
        }
      }

      return {
        id: String(tx.id),
        recipientName: addressPreview,
        amountNGN: `N${formatCurrency(amount)}`,
        amountUSD: formatUSD(amount),
        date: formattedDate,
        status: normalizeStatus(tx.status),
        paymentMethod: 'Bank Transfer', // Not applicable for crypto but keeping for compatibility
        transferAmount: `${amount} ${currency}`,
        fee: fee > 0 ? formatUSD(fee) : undefined,
        paymentAmount: `${amount} ${currency}`,
        cryptoType: currency === 'USDT' ? 'USDT' : currency === 'BTC' ? 'Bitcoin' : currency === 'ETH' ? 'Ethereum' : currency,
        network: metadata.blockchain || metadata.network || currency,
        quantity: `${amount} ${currency}`,
        amountUSDValue: formatUSD(amount),
        feeCrypto: fee > 0 ? `${fee} ${currency}` : undefined,
        feeUSD: fee > 0 ? formatUSD(fee) : undefined,
        receivingAddress: toAddress,
        sendingAddress: metadata.fromAddress || '',
        txHash: metadata.txHash || '',
        transactionId: tx.reference || String(tx.id),
        dateTime: formattedDate,
        rawData: tx, // Store raw API data for details
      };
    });
  }, [transactionHistoryData?.data?.crypto]);

  // Calculate summary data from API response
  const summaryData = useMemo(() => {
    const transactionData = transactionHistoryData?.data;
    const summary = transactionData?.summary || { incoming: '0', outgoing: '0' };
    
    // Calculate incoming and outgoing from crypto withdrawals
    const withdrawals = cryptoWithdrawalTransactions;
    const incomingTotal = withdrawals.reduce((sum, tx) => {
      // For withdrawals, incoming would be zero (outgoing only)
      return sum;
    }, 0);
    
    const outgoingTotal = withdrawals.reduce((sum, tx) => {
      const amount = parseFloat(tx.rawData?.amount || '0');
      return sum + amount;
    }, 0);

    // Use API summary if available, otherwise calculate from transactions
    const incoming = parseFloat(summary.incoming?.toString() || '0');
    const outgoing = parseFloat(summary.outgoing?.toString() || outgoingTotal.toString());

    return {
      incoming: {
        ngn: formatCurrency(incoming),
        usd: formatUSD(incoming),
      },
      outgoing: {
        ngn: formatCurrency(outgoing),
        usd: formatUSD(outgoing),
      },
    };
  }, [transactionHistoryData?.data?.summary, cryptoWithdrawalTransactions]);

  // Update transaction details when details data is fetched
  useEffect(() => {
    if (transactionDetailsData?.data && selectedTransaction) {
      const details = transactionDetailsData.data;
      const metadata = details.metadata || {};
      
      const updatedTransaction: CryptoWithdrawalTransaction = {
        ...selectedTransaction,
        receivingAddress: metadata.toAddress || selectedTransaction.receivingAddress,
        sendingAddress: metadata.fromAddress || selectedTransaction.sendingAddress,
        txHash: metadata.txHash || selectedTransaction.txHash,
        feeCrypto: details.fee ? `${details.fee} ${details.currency || ''}` : selectedTransaction.feeCrypto,
        feeUSD: details.fee ? formatUSD(details.fee) : selectedTransaction.feeUSD,
        fee: details.fee ? formatUSD(details.fee) : selectedTransaction.fee,
        network: metadata.blockchain || metadata.network || selectedTransaction.network,
      };

      setSelectedTransaction(updatedTransaction);
    }
  }, [transactionDetailsData, selectedTransaction]);

  // Mock data - kept for reference but now using API data
  const mockCryptoWithdrawalTransactions: CryptoWithdrawalTransaction[] = [
    {
      id: '1',
      recipientName: '0x123...fcj2ifk3edw',
      amountNGN: 'N2,550.50',
      amountUSD: '$2,550.50',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Bank Transfer',
      transferAmount: '0.25 ETH',
      fee: '$2.50',
      paymentAmount: '0.25 ETH',
      cryptoType: 'Ethereum',
      network: 'Ethereum',
      quantity: '0.25 ETH',
      amountUSDValue: '$2,550.50',
      feeCrypto: '0.000001 ETH',
      feeUSD: '$2.50',
      receivingAddress: '0x123edfgtrwe457kslwltkwflelwlvld',
      sendingAddress: '0x123edfgtrwe457kslwltkwflelwlvld',
      txHash: '13ijksm219ef23e9fi3295h2nfi923rf9n92f9',
      transactionId: '12dwerkxywurcksc',
      dateTime: 'Oct 16, 2025 - 07:22 AM',
    },
    {
      id: '2',
      recipientName: '0x456...abc123def456',
      amountNGN: 'N1,200.00',
      amountUSD: '$1,200.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
      cryptoType: 'Bitcoin',
      network: 'Bitcoin',
      quantity: '0.05 BTC',
      amountUSDValue: '$1,200.00',
      receivingAddress: '0x456edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '3',
      recipientName: '0x789...xyz789ghi012',
      amountNGN: 'N500.00',
      amountUSD: '$500.00',
      date: 'Oct 15,2025',
      status: 'Pending',
      paymentMethod: 'Bank Transfer',
      cryptoType: 'USDT',
      network: 'Ethereum',
      quantity: '500 USDT',
      amountUSDValue: '$500.00',
      receivingAddress: '0x789edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '4',
      recipientName: '0x012...def456ghi789',
      amountNGN: 'N3,000.00',
      amountUSD: '$3,000.00',
      date: 'Oct 15,2025',
      status: 'Failed',
      paymentMethod: 'Bank Transfer',
      cryptoType: 'Ethereum',
      network: 'Ethereum',
      quantity: '0.3 ETH',
      amountUSDValue: '$3,000.00',
      receivingAddress: '0x012edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '5',
      recipientName: '0x345...ghi789jkl012',
      amountNGN: 'N800.00',
      amountUSD: '$800.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
      cryptoType: 'Ethereum',
      network: 'Ethereum',
      quantity: '0.1 ETH',
      amountUSDValue: '$800.00',
      receivingAddress: '0x345edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '6',
      recipientName: '0x678...jkl012mno345',
      amountNGN: 'N1,500.00',
      amountUSD: '$1,500.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Bank Transfer',
      cryptoType: 'Bitcoin',
      network: 'Bitcoin',
      quantity: '0.03 BTC',
      amountUSDValue: '$1,500.00',
      receivingAddress: '0x678edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '7',
      recipientName: '0x901...mno345pqr678',
      amountNGN: 'N2,200.00',
      amountUSD: '$2,200.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
      cryptoType: 'USDT',
      network: 'Ethereum',
      quantity: '2,200 USDT',
      amountUSDValue: '$2,200.00',
      receivingAddress: '0x901edfgtrwe457kslwltkwflelwlvld',
    },
    {
      id: '8',
      recipientName: '0x234...pqr678stu901',
      amountNGN: 'N950.00',
      amountUSD: '$950.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Bank Transfer',
      cryptoType: 'Ethereum',
      network: 'Ethereum',
      quantity: '0.12 ETH',
      amountUSDValue: '$950.00',
      receivingAddress: '0x234edfgtrwe457kslwltkwflelwlvld',
    },
  ];


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

  const handleTransactionPress = (transaction: CryptoWithdrawalTransaction) => {
    const rawData = (transaction as any).rawData;
    const transactionId = rawData?.id;
    
    if (transactionId) {
      setSelectedTransactionId(transactionId);
    }
    
    setSelectedTransaction(transaction);
    
    // Fetch details if we have an ID
    if (transactionId) {
      // Details will be fetched via useGetTransactionDetails hook
      // Modal will be shown after details are loaded
    } else {
      // If no ID, show modal immediately with existing data
      if (transaction.status === 'Failed') {
        setShowErrorModal(true);
      } else {
        setShowReceiptModal(true);
      }
    }
  };

  // Show modal when details are loaded or transaction is set
  useEffect(() => {
    if (selectedTransaction) {
      if (isLoadingDetails) {
        // Still loading details, don't show modal yet
        return;
      }
      
      // Details loaded or no details to load, show appropriate modal
      if (selectedTransaction.status === 'Failed') {
        setShowErrorModal(true);
      } else {
        setShowReceiptModal(true);
      }
    }
  }, [selectedTransaction, isLoadingDetails]);

  const filteredTransactions = useMemo(() => {
    return cryptoWithdrawalTransactions.filter((transaction) => {
      // Status filter
      if (selectedStatus !== 'All') {
        const statusMap: Record<string, string> = {
          'Completed': 'Successful',
          'Pending': 'Pending',
          'Failed': 'Failed',
        };
        const mappedStatus = statusMap[selectedStatus];
        if (mappedStatus && transaction.status !== mappedStatus) {
          return false;
        }
      }
      
      // Type filter (crypto type)
      if (selectedType !== 'All' && transaction.cryptoType !== selectedType) {
        return false;
      }
      
      // Currency filter
      if (selectedCurrency !== 'All') {
        const currency = transaction.rawData?.currency || '';
        if (currency !== selectedCurrency) {
          return false;
        }
      }
      
      return true;
    });
  }, [cryptoWithdrawalTransactions, selectedStatus, selectedType, selectedCurrency]);

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
            <ThemedText style={styles.headerTitle}>Crypto Withdrawals</ThemedText>
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
              <ThemedText style={styles.filterButtonText}>Status</ThemedText>
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
              <ThemedText style={styles.filterButtonText}>Currency</ThemedText>
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
              <ThemedText style={styles.filterButtonText}>Type</ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        {isLoadingHistory ? (
          <View style={styles.summaryContainer}>
            <View style={styles.loadingSummaryCard}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={styles.loadingText}>Loading summary...</ThemedText>
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
          <ThemedText style={styles.cardTitle}>Transactions</ThemedText>
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
            </View>
          ) : historyError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={styles.errorText}>
                {(historyError as any)?.message || 'Failed to load transactions'}
              </ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchHistory()}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="wallet-outline" size={40 * SCALE} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText style={styles.emptyText}>No crypto withdrawals found</ThemedText>
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
          visible={showReceiptModal && !isLoadingDetails}
          transaction={{
            ...selectedTransaction,
            transactionType: 'cryptoWithdrawal',
            status: selectedTransaction.status,
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Loading Modal for Transaction Details */}
      {selectedTransaction && isLoadingDetails && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.loadingModalContent}>
              <ActivityIndicator size="large" color="#A9EF45" />
              <ThemedText style={styles.loadingModalText}>Loading transaction details...</ThemedText>
            </View>
          </View>
        </Modal>
      )}

      {/* Transaction Error Modal */}
      {selectedTransaction && (
        <TransactionErrorModal
          visible={showErrorModal && !isLoadingDetails}
          transaction={selectedTransaction}
          onRetry={() => {
            // Retry by refetching transaction details
            if (selectedTransactionId) {
              refetchHistory();
            }
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
          onCancel={() => {
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
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
    top: 125 * SCALE,
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
  loadingSummaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: '#020c19',
    borderRadius: 15 * SCALE,
    padding: 30 * SCALE,
    alignItems: 'center',
    gap: 15 * SCALE,
  },
  loadingModalText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
});

export default CryptoWithdrawalsScreen;

