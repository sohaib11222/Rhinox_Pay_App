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
import { useGetDeposits } from '../../queries/transactionHistory.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Transaction interface for API integration
interface FundTransaction {
  id: string;
  transactionTitle: string;
  amountNGN: string;
  amountUSD: string;
  date: string;
  status: 'Successful' | 'Pending' | 'Failed';
  paymentMethod?: 'Bank Transfer' | 'Mobile Money' | 'Conversion' | 'P2P Transaction';
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
  fundingRoute?: string;
  route?: string;
  provider?: string;
}

const FundTransactionsScreen = () => {
  const navigation = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FundTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Format amount for display
  const formatAmount = (amount: string | number, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency === 'NGN' ? `N${formatted}` : currency === 'USD' ? `$${formatted}` : `${currency} ${formatted}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Map API status to UI status
  const mapStatusToUI = (status: string): 'Successful' | 'Pending' | 'Failed' => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Successful';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  // Map API channel to UI payment method
  const mapChannelToPaymentMethod = (channel: string): 'Bank Transfer' | 'Mobile Money' | 'Conversion' | 'P2P Transaction' | undefined => {
    switch (channel?.toLowerCase()) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'mobile_money':
        return 'Mobile Money';
      case 'conversion':
        return 'Conversion';
      case 'p2p':
        return 'P2P Transaction';
      default:
        return undefined;
    }
  };

  // Fetch deposits from API
  const {
    data: depositsData,
    isLoading: isLoadingDeposits,
    isError: isDepositsError,
    error: depositsError,
    refetch: refetchDeposits,
  } = useGetDeposits({
    currency: selectedCurrency !== 'All' ? selectedCurrency : undefined,
    status: selectedStatus,
    type: selectedType,
    period: 'M', // Default to monthly
    limit: 50,
    offset: 0,
  });

  // Transform API data to UI format
  const fundTransactions: FundTransaction[] = useMemo(() => {
    if (!depositsData?.data?.transactions || !Array.isArray(depositsData.data.transactions)) {
      return [];
    }

    return depositsData.data.transactions.map((tx: any) => {
      const status = mapStatusToUI(tx.status);
      const paymentMethod = mapChannelToPaymentMethod(tx.channel);
      const amount = parseFloat(tx.amount || '0');
      const currency = tx.currency || 'NGN';
      
      // Format amounts
      const amountFormatted = formatAmount(amount, currency);
      const feeFormatted = tx.fee ? formatAmount(tx.fee, currency) : '0.00';
      const creditedAmount = tx.creditedAmount ? parseFloat(tx.creditedAmount) : amount;

      // Format date
      const date = formatDate(tx.createdAt || tx.completedAt || new Date().toISOString());
      const dateTime = tx.completedAt || tx.createdAt
        ? new Date(tx.completedAt || tx.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      return {
        id: String(tx.id),
        transactionTitle: tx.normalizedType || `Fund Wallet - ${paymentMethod || 'Deposit'}`,
        amountNGN: amountFormatted,
        amountUSD: currency === 'USD' ? amountFormatted : `$${formatAmount(amount * 0.001, 'USD').replace('$', '')}`, // Approximate conversion
        date: date,
        status: status,
        paymentMethod: paymentMethod,
        transferAmount: amountFormatted,
        fee: feeFormatted,
        paymentAmount: formatAmount(creditedAmount, currency),
        country: tx.country || undefined,
        bank: tx.bankAccount?.bankName || undefined,
        accountNumber: tx.bankAccount?.accountNumber || undefined,
        accountName: tx.bankAccount?.accountName || undefined,
        transactionId: tx.reference || String(tx.id),
        dateTime: dateTime,
        fundingRoute: paymentMethod || tx.channel,
        route: tx.provider?.name || undefined,
        provider: tx.provider?.name || undefined,
      };
    });
  }, [depositsData?.data?.transactions]);

  // Get summary data from API
  const summaryData = useMemo(() => {
    const incoming = depositsData?.data?.summary?.incoming || '0';
    const incomingNum = parseFloat(incoming);
    
    return {
      incoming: {
        ngn: formatAmount(incomingNum, 'NGN').replace('N', ''),
        usd: `$${formatAmount(incomingNum * 0.001, 'USD').replace('$', '')}`, // Approximate conversion
      },
      outgoing: {
        ngn: '0.00', // Deposits don't have outgoing
        usd: '$0.00',
      },
    };
  }, [depositsData?.data?.summary]);

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

  const handleTransactionPress = (transaction: FundTransaction) => {
    if (transaction.status === 'Failed') {
      setSelectedTransaction(transaction);
      setShowErrorModal(true);
    } else {
      setSelectedTransaction(transaction);
      setShowReceiptModal(true);
    }
  };

  const filteredTransactions = useMemo(() => {
    return fundTransactions.filter((transaction) => {
      // Status filter is handled by API, but we can add client-side filtering if needed
      if (selectedStatus !== 'All') {
        const statusMap: Record<string, string> = {
          'Completed': 'Successful',
          'Pending': 'Pending',
          'Failed': 'Failed',
        };
        if (transaction.status !== statusMap[selectedStatus]) {
          return false;
        }
      }
      // Type filter is handled by API
      if (selectedType !== 'All' && transaction.paymentMethod !== selectedType) {
        return false;
      }
      // Currency filter is handled by API
      return true;
    });
  }, [fundTransactions, selectedStatus, selectedType]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[FundTransactionsScreen] Refreshing deposits data...');
    try {
      await refetchDeposits();
      console.log('[FundTransactionsScreen] Deposits data refreshed successfully');
    } catch (error) {
      console.error('[FundTransactionsScreen] Error refreshing deposits data:', error);
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
            <ThemedText style={styles.headerTitle}>Fund Transactions</ThemedText>
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
            {isLoadingDeposits ? (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <>
                <View style={styles.summaryAmountContainer}>
                  <View style={styles.summaryAmountRow}>
                    <ThemedText style={styles.summaryAmountMain}>{summaryData.incoming.ngn}</ThemedText>
                    <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.summaryUSD}>{summaryData.incoming.usd}</ThemedText>
              </>
            )}
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
            {isLoadingDeposits ? (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <ActivityIndicator size="small" color="#000000" />
              </View>
            ) : (
              <>
                <View style={styles.summaryAmountContainer}>
                  <View style={styles.summaryAmountRow}>
                    <ThemedText style={styles.summaryAmountMainWhite}>{summaryData.outgoing.ngn}</ThemedText>
                    <ThemedText style={styles.summaryAmountCurrencyWhite}>NGN</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.summaryUSDWhite}>{summaryData.outgoing.usd}</ThemedText>
              </>
            )}
          </View>
        </View>

        {/* Dropdowns */}
        {showStatusDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 }]}>
            <View style={styles.dropdown}>
              {['All', 'Completed', 'Pending', 'Failed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.dropdownItem,
                    selectedStatus === status && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedStatus(status);
                    setShowStatusDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{status}</ThemedText>
                  {selectedStatus === status && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showCurrencyDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 + (SCREEN_WIDTH * 0.85 * 1/3) }]}>
            <View style={styles.dropdown}>
              {['All', 'NGN', 'USD', 'GBP', 'KES', 'GHS', 'ZAR', 'TZS', 'UGX'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.dropdownItem,
                    selectedCurrency === currency && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCurrency(currency);
                    setShowCurrencyDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{currency}</ThemedText>
                  {selectedCurrency === currency && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showTypeDropdown && (
          <View style={[styles.dropdownContainer, { left: SCREEN_WIDTH * 0.047 + (SCREEN_WIDTH * 0.85 * 2/3) }]}>
            <View style={styles.dropdown}>
              {['All', 'Bank Transfer', 'Mobile Money', 'Conversion', 'P2P Transaction'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    selectedType === type && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{type}</ThemedText>
                  {selectedType === type && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Transaction List Card */}
        <View style={styles.transactionCard}>
          <ThemedText style={styles.cardTitle}>Transactions</ThemedText>
          {isLoadingDeposits ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading transactions...
              </ThemedText>
            </View>
          ) : isDepositsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={{ color: '#ff0000', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                {depositsError?.message || 'Failed to load transactions. Please try again.'}
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { marginTop: 20 }]}
                onPress={() => refetchDeposits()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                No transactions found
              </ThemedText>
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
                    <Image
                      source={require('../../assets/send-square.png')}
                      style={styles.transactionIconImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionTitle}>{transaction.transactionTitle}</ThemedText>
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
          visible={showReceiptModal}
          transaction={{
            ...selectedTransaction,
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
    marginBottom: 5 * SCALE,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
  },
  dropdownItemText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    flex: 1,
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 10 * SCALE,
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
  retryButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 12 * SCALE,
    paddingHorizontal: 24 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
});

export default FundTransactionsScreen;

