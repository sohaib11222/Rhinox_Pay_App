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
import { useGetWithdrawals, useGetTransactionDetails } from '../../queries/transactionHistory.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Transaction interface for API integration
interface SendTransaction {
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
}

const SendTransactionsScreen = () => {
  const navigation = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<SendTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  // Get withdrawals data from API
  const { 
    data: withdrawalsData, 
    isLoading: isLoadingWithdrawals, 
    isError: isWithdrawalsError,
    error: withdrawalsError,
    refetch: refetchWithdrawals 
  } = useGetWithdrawals({
    currency: selectedCurrency !== 'All' ? selectedCurrency : undefined,
    status: selectedStatus !== 'All' ? selectedStatus as 'Completed' | 'Pending' | 'Failed' : undefined,
    type: selectedType !== 'All' ? (selectedType === 'Bank Transfer' || selectedType === 'Mobile Money' ? 'Send' : undefined) : undefined,
    limit: 50,
    offset: 0,
  });

  // Get transaction details when a transaction is selected
  const { 
    data: transactionDetailsData,
    isLoading: isLoadingTransactionDetails 
  } = useGetTransactionDetails(selectedTransactionId || 0);

  // Filter and transform API data to show only "Send Transactions"
  const sendTransactions: SendTransaction[] = useMemo(() => {
    if (!withdrawalsData?.data?.transactions) return [];

    const transactions = withdrawalsData.data.transactions;
    
    // Filter to only show transactions where normalizedType === "Send Transactions"
    const sendTransactionsOnly = transactions.filter(
      (tx: any) => tx.normalizedType === 'Send Transactions'
    );

    // Transform API data to UI format
    return sendTransactionsOnly.map((tx: any) => {
      // Format date
      const date = new Date(tx.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).replace(',', '');

      // Format amount
      const amount = parseFloat(tx.amount || '0');
      const formattedAmountNGN = `N${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      // Get recipient name from recipientInfo
      const recipientName = tx.recipientInfo?.name || tx.description?.replace('Transfer ', '').replace(/ \d+ [A-Z]{3} to /, '') || 'Unknown';

      // Map status
      let status: 'Successful' | 'Pending' | 'Failed' = 'Pending';
      if (tx.status === 'completed') status = 'Successful';
      else if (tx.status === 'failed') status = 'Failed';
      else if (tx.status === 'pending') status = 'Pending';

      // Map payment method
      let paymentMethod: 'Bank Transfer' | 'Mobile Money' = 'Bank Transfer';
      if (tx.paymentMethod?.includes('Mobile') || tx.channel?.includes('mobile')) {
        paymentMethod = 'Mobile Money';
      }

      return {
        id: String(tx.id),
        recipientName: recipientName,
        amountNGN: formattedAmountNGN,
        amountUSD: `$${(amount / 1000).toFixed(2)}`, // Mock USD conversion
        date: formattedDate,
        status: status,
        paymentMethod: paymentMethod,
        transferAmount: formattedAmountNGN,
        fee: `N${parseFloat(tx.fee || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentAmount: `N${parseFloat(tx.totalAmount || tx.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        country: tx.country || 'Nigeria',
        bank: tx.paymentMethod || 'Bank Transfer',
        accountNumber: tx.recipientInfo?.phone || tx.metadata?.recipientInfo?.phone || '',
        accountName: recipientName,
        transactionId: tx.reference || String(tx.id),
        dateTime: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(',', ' -'),
      };
    });
  }, [withdrawalsData]);

  // Summary data from API
  const summaryData = useMemo(() => {
    if (!withdrawalsData?.data?.summary) {
      return {
        incoming: {
          ngn: '0.00',
          usd: '$0.00',
        },
        outgoing: {
          ngn: '0.00',
          usd: '$0.00',
        },
      };
    }

    const outgoing = parseFloat(withdrawalsData.data.summary.outgoing || '0');
    return {
      incoming: {
        ngn: '0.00', // Incoming is not in withdrawals
        usd: '$0.00',
      },
      outgoing: {
        ngn: outgoing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        usd: `$${(outgoing / 1000).toFixed(2)}`, // Mock USD conversion
      },
    };
  }, [withdrawalsData]);

  // Mock data - Replace with API calls later (keeping for reference)
  const mockSendTransactions: SendTransaction[] = [
    {
      id: '1',
      recipientName: 'Adebisi Lateefat',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Bank Transfer',
      transferAmount: 'N200,000',
      fee: 'N20',
      paymentAmount: 'N200,000',
      country: 'Nigeria',
      bank: 'Wema Bank',
      accountNumber: '0123456789',
      accountName: 'Opay',
      transactionId: '12dwerkxywurcksc',
      dateTime: 'Oct 16, 2025 - 07:22AM',
    },
    {
      id: '2',
      recipientName: 'Ogunleye Funke',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
    },
    {
      id: '3',
      recipientName: 'Ibrahim Musa',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Pending',
      paymentMethod: 'Mobile Money',
    },
    {
      id: '4',
      recipientName: 'Chukwuemeka Nneka',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Failed',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: '5',
      recipientName: 'Ogunleye Funke',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
    },
    {
      id: '6',
      recipientName: 'Ogunleye Funke',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
    },
    {
      id: '7',
      recipientName: 'Ogunleye Funke',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
    },
    {
      id: '8',
      recipientName: 'Ogunleye Funke',
      amountNGN: 'N2,000,0000',
      amountUSD: '$5,000.00',
      date: 'Oct 15,2025',
      status: 'Successful',
      paymentMethod: 'Mobile Money',
    },
  ];

  // Old mock summary data - removed, using API data now

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

  const handleTransactionPress = (transaction: SendTransaction) => {
    // Set the transaction ID to fetch details
    const transactionId = parseInt(transaction.id);
    if (!isNaN(transactionId)) {
      setSelectedTransactionId(transactionId);
      setSelectedTransaction(transaction);
    }
  };

  // When transaction details are loaded, show the appropriate modal
  useEffect(() => {
    if (transactionDetailsData?.data && selectedTransaction) {
      const details = transactionDetailsData.data;
      const status = details.status || selectedTransaction.status;
      
      // Update transaction with details from API
      const updatedTransaction: SendTransaction = {
        ...selectedTransaction,
        transferAmount: `N${parseFloat(details.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        fee: `N${parseFloat(details.fee || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentAmount: `N${parseFloat(details.totalAmount || details.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        transactionId: details.reference || selectedTransaction.transactionId,
        accountName: details.recipientInfo?.name || selectedTransaction.accountName,
        accountNumber: details.recipientInfo?.phone || details.metadata?.recipientInfo?.phone || selectedTransaction.accountNumber,
        country: details.country || selectedTransaction.country,
        bank: details.paymentMethod || selectedTransaction.bank,
      };

      if (status === 'failed' || status === 'Failed') {
        setShowErrorModal(true);
        setShowReceiptModal(false);
      } else {
        setShowReceiptModal(true);
        setShowErrorModal(false);
      }
      setSelectedTransaction(updatedTransaction);
    }
  }, [transactionDetailsData, selectedTransaction]);

  // Filter transactions (additional client-side filtering if needed)
  // Note: Most filtering is done by API, but we can add client-side filters here
  const filteredTransactions = useMemo(() => {
    // Since API already filters by status, currency, and type, 
    // we mainly use the API-filtered data
    // Additional client-side filtering can be added here if needed
    return sendTransactions;
  }, [sendTransactions]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[SendTransactionsScreen] Refreshing send transactions data...');
    try {
      await refetchWithdrawals();
      console.log('[SendTransactionsScreen] Send transactions data refreshed successfully');
    } catch (error) {
      console.error('[SendTransactionsScreen] Error refreshing send transactions data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

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
            <ThemedText style={styles.headerTitle}>Send Transactions</ThemedText>
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
        {isLoadingWithdrawals ? (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCardGradient, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
            <View style={[styles.summaryCardWhite, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
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
              {['All', 'Completed', 'Pending', 'Failed'].map((status) => (
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
              {['All', 'NGN', 'USD', 'GBP'].map((currency) => (
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
              {['All', 'Bank Transfer', 'Mobile Money'].map((type) => (
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
          <ThemedText style={styles.cardTitle}>Today</ThemedText>
          {isLoadingWithdrawals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
            </View>
          ) : isWithdrawalsError ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                {withdrawalsError?.message || 'Failed to load transactions'}
              </ThemedText>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No send transactions found</ThemedText>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {filteredTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                  disabled={isLoadingTransactionDetails}
                >
                  <View style={styles.transactionIconContainer}>
                    <View style={styles.transactionIconCircle}>
                      <Image
                        source={require('../../assets/send-2.png')}
                        style={styles.transactionIconImage}
                        resizeMode="contain"
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
                        {transaction.paymentMethod && ` via ${transaction.paymentMethod}`}
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
          visible={showReceiptModal && !isLoadingTransactionDetails}
          transaction={{
            ...selectedTransaction,
            status: selectedTransaction.status,
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Transaction Error Modal */}
      {selectedTransaction && (
        <TransactionErrorModal
          visible={showErrorModal && !isLoadingTransactionDetails}
          transaction={selectedTransaction}
          onRetry={() => {
            // TODO: Implement retry logic
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

      {/* Loading overlay for transaction details */}
      {isLoadingTransactionDetails && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#A9EF45" />
            <ThemedText style={styles.loadingOverlayText}>Loading transaction details...</ThemedText>
          </View>
        </Modal>
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
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
    marginLeft:-40
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
    fontSize: 12 ,
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
    backgroundColor:'#020C19',
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
    marginTop:5 * SCALE,
  },
  cardTitle: {
    fontSize: 14 * 1,
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
    width: 35 * 1,
    height: 35 * 1,
    borderRadius: 17.5 * 1,
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
    fontSize: 12 * 1,
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
    paddingVertical: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 10 * SCALE,
  },
  errorContainer: {
    paddingVertical: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 10 * SCALE,
  },
});

export default SendTransactionsScreen;

