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
import { useGetBillPayments, useGetTransactionDetails, mapBillPaymentStatusToAPI, mapBillPaymentCategoryToAPI } from '../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

// Transaction interface for API integration
interface BillPaymentTransaction {
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
  // Bill payment specific fields
  billerType?: string;
  mobileNumber?: string;
  plan?: string;
}

const BillPaymentsScreen = () => {
  const navigation = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BillPaymentTransaction | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Prepare API params based on filters
  const apiParams = useMemo(() => {
    const params: any = {
      limit: 50,
      offset: 0,
    };
    
    if (selectedCurrency !== 'All') {
      params.currency = selectedCurrency;
    }
    
    if (selectedStatus !== 'All') {
      params.status = mapBillPaymentStatusToAPI(selectedStatus);
    }
    
    if (selectedType !== 'All') {
      const categoryCode = mapBillPaymentCategoryToAPI(selectedType);
      if (categoryCode) {
        params.categoryCode = categoryCode;
      }
    }
    
    return params;
  }, [selectedCurrency, selectedStatus, selectedType]);

  // Fetch bill payment transactions from API
  const {
    data: billPaymentsData,
    isLoading: isLoadingTransactions,
    isError: isBillPaymentsError,
    error: billPaymentsError,
    refetch: refetchBillPayments,
  } = useGetBillPayments(apiParams);

  // Fetch transaction details when a transaction is selected
  const {
    data: transactionDetailsData,
    isLoading: isLoadingDetails,
  } = useGetTransactionDetails(
    selectedTransactionId || 0,
    {
      queryKey: ['transaction-history', 'details', selectedTransactionId],
      enabled: !!selectedTransactionId,
    }
  );

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[BillPaymentsScreen] Refreshing bill payment data...');
    try {
      await refetchBillPayments();
      console.log('[BillPaymentsScreen] Bill payment data refreshed successfully');
    } catch (error) {
      console.error('[BillPaymentsScreen] Error refreshing bill payment data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Format balance for display
  const formatBalance = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Transform API transactions to UI format
  const billPaymentTransactions: BillPaymentTransaction[] = useMemo(() => {
    if (!billPaymentsData?.data?.transactions || !Array.isArray(billPaymentsData.data.transactions)) {
      return [];
    }

    return billPaymentsData.data.transactions.map((tx: any) => {
      const amount = parseFloat(tx.amount || '0');
      const currency = tx.currency || 'NGN';
      const formattedAmount = currency === 'NGN' 
        ? `N${formatBalance(amount)}`
        : `$${formatBalance(amount)}`;
      
      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A';

      // Map API status to UI status
      const statusMap: { [key: string]: 'Successful' | 'Pending' | 'Failed' } = {
        'completed': 'Successful',
        'pending': 'Pending',
        'failed': 'Failed',
      };
      const uiStatus = statusMap[tx.status?.toLowerCase()] || 'Pending';

      // Get provider/category info
      const providerName = tx.provider?.name || tx.category?.name || 'Unknown';
      const categoryName = tx.category?.name || '';
      const recipientName = `${categoryName} - ${providerName}`;

      return {
        id: String(tx.id),
        recipientName: recipientName,
        amountNGN: formattedAmount,
        amountUSD: currency === 'USD' ? formattedAmount : `$${formatBalance(amount * 0.001)}`, // Placeholder conversion
        date: date,
        status: uiStatus,
        paymentMethod: tx.paymentMethod || 'Mobile Money',
        transferAmount: formattedAmount,
        fee: tx.fee ? `${currency}${formatBalance(tx.fee)}` : 'N0',
        paymentAmount: formattedAmount,
        billerType: tx.provider?.code || tx.provider?.name || '',
        mobileNumber: tx.accountNumber || '',
        plan: tx.plan?.name || '',
        transactionId: tx.reference || tx.id,
        dateTime: tx.createdAt
          ? new Date(tx.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : date,
        accountNumber: tx.accountNumber,
        accountName: tx.accountName || recipientName,
        country: tx.countryCode || 'NG',
      };
    });
  }, [billPaymentsData?.data]);

  // Calculate summary data from API response
  const summaryData = useMemo(() => {
    // Use API summary.total for outgoing (bill payments are all outgoing)
    const totalFromAPI = billPaymentsData?.data?.summary?.total 
      ? parseFloat(billPaymentsData.data.summary.total) 
      : 0;
    
    // Calculate from transactions if API summary not available
    const calculatedTotal = billPaymentTransactions
      .filter(tx => tx.status === 'Successful')
      .reduce((sum, tx) => {
        const amount = parseFloat(tx.amountNGN.replace(/[^0-9.-]/g, ''));
        return sum + amount;
      }, 0);

    const outgoing = totalFromAPI > 0 ? totalFromAPI : calculatedTotal;

    return {
      incoming: {
        ngn: '0.00', // Bill payments don't have incoming
        usd: '$0.00',
      },
      outgoing: {
        ngn: formatBalance(outgoing),
        usd: `$${formatBalance(outgoing * 0.001)}`, // Placeholder conversion
      },
    };
  }, [billPaymentsData?.data?.summary, billPaymentTransactions]);

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

  const getBillPaymentIcon = (transaction: BillPaymentTransaction) => {
    // Determine icon/image based on biller type or transaction name
    const billerType = transaction.billerType || '';
    const recipientName = transaction.recipientName || '';
    
    if (recipientName.includes('Data') || billerType === 'MTN' || billerType === 'GLO' || billerType === 'Airtel' || billerType === '9mobile') {
      // Data/Telecom - use wifi/data icon
      return 'wifi';
    } else if (recipientName.includes('Airtime')) {
      // Airtime - use phone icon
      return 'phone';
    } else if (recipientName.includes('Electricity') || billerType === 'EKEDC' || billerType === 'PHED') {
      // Electricity - use lightning/energy icon
      return 'lightning-bolt';
    } else if (recipientName.includes('Cable') || billerType === 'DSTV' || billerType === 'GOTV') {
      // Cable TV - use TV icon
      return 'television';
    } else if (recipientName.includes('Internet') || billerType === 'Spectranet') {
      // Internet - use router/wifi icon
      return 'router-wireless';
    } else {
      // Default - file download icon
      return 'file-download';
    }
  };

  const getBillPaymentImage = (transaction: BillPaymentTransaction) => {
    // Determine image source based on biller type or transaction name
    // TODO: Replace with actual image paths once images are extracted from Figma
    const billerType = transaction.billerType || '';
    const recipientName = transaction.recipientName || '';
    
    // Map bill payment types to image sources
    // For now, return null to use icons as fallback
    // When images are available, uncomment and update paths:
    
    if (recipientName.includes('Data') || billerType === 'MTN') {
      return require('../../assets/Ellipse 20.png');
    
    // } else if (billerType === 'GLO') {
    //   return require('../../assets/bill-payments/glo-data.png');
    } else if (billerType === 'Airtel') {
        return require('../../assets/Ellipse 20.png');
    
    // } else if (recipientName.includes('Airtime')) {
    //   return require('../../assets/bill-payments/airtime.png');
    } else if (recipientName.includes('Electricity') || billerType === 'EKEDC' || billerType === 'PHED') {
        return require('../../assets/Ellipse 21.png');
    
    } else if (recipientName.includes('Cable') || billerType === 'DSTV' || billerType === 'GOTV') {
        return require('../../assets/Ellipse 21 (2).png');
    } else if (recipientName.includes('Internet') || billerType === 'Spectranet') {
        return require('../../assets/Ellipse 22.png');
    }
    
    return null; // Return null to use icon as fallback
  };

  const handleTransactionPress = (transaction: BillPaymentTransaction) => {
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
      const updatedTransaction: BillPaymentTransaction = {
        ...selectedTransaction,
        transferAmount: details.amount 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.amount))}`
          : selectedTransaction.transferAmount,
        fee: details.fee 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.fee))}`
          : selectedTransaction.fee,
        paymentAmount: details.totalAmount 
          ? `${details.currency || 'NGN'}${formatBalance(parseFloat(details.totalAmount))}`
          : selectedTransaction.paymentAmount,
        transactionId: details.reference || selectedTransaction.transactionId,
        accountNumber: details.accountNumber || selectedTransaction.accountNumber,
        accountName: details.accountName || selectedTransaction.accountName,
        billerType: details.provider?.code || details.provider?.name || selectedTransaction.billerType,
        mobileNumber: details.accountNumber || selectedTransaction.mobileNumber,
        plan: details.plan?.name || selectedTransaction.plan,
        dateTime: details.createdAt
          ? new Date(details.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : selectedTransaction.dateTime,
        country: details.country || selectedTransaction.country,
      };

      // Map API status to UI status
      const statusMap: { [key: string]: 'Successful' | 'Pending' | 'Failed' } = {
        'completed': 'Successful',
        'pending': 'Pending',
        'failed': 'Failed',
      };
      const uiStatus = statusMap[status?.toLowerCase()] || selectedTransaction.status;
      updatedTransaction.status = uiStatus;

      if (uiStatus === 'Failed') {
        setShowErrorModal(true);
        setShowReceiptModal(false);
      } else {
        setShowReceiptModal(true);
        setShowErrorModal(false);
      }
      setSelectedTransaction(updatedTransaction);
    }
  }, [transactionDetailsData, selectedTransaction]);

  const filteredTransactions = billPaymentTransactions.filter((transaction) => {
    if (selectedStatus !== 'All' && transaction.status !== selectedStatus) {
      return false;
    }
    if (selectedType !== 'All' && transaction.billerType !== selectedType) {
      return false;
    }
    // Add more filters as needed
    return true;
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
            <ThemedText style={styles.headerTitle}>Bill Payments</ThemedText>
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
              <ThemedText style={styles.filterButtonText}>Bill Type</ThemedText>
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
            {isLoadingTransactions ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : isBillPaymentsError ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 10 * SCALE }}>
                  Error loading data
                </ThemedText>
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
            {isLoadingTransactions ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
                <ActivityIndicator size="small" color="#000000" />
              </View>
            ) : isBillPaymentsError ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
                <ThemedText style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: 10 * SCALE }}>
                  Error loading data
                </ThemedText>
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
              {['All', 'MTN', 'Airtel', 'GLO', '9mobile', 'DSTV', 'GOTV', 'EKEDC', 'PHED', 'Spectranet'].map((type) => (
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
          <ThemedText style={styles.cardTitle}>Bill Payments</ThemedText>
          {isLoadingTransactions ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading transactions...
              </ThemedText>
            </View>
          ) : isBillPaymentsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                {billPaymentsError?.message || 'Failed to load transactions'}
              </ThemedText>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <View style={styles.transactionList}>
              {filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
              >
                <View style={styles.transactionIconContainer}>
                  <View style={styles.transactionIconCircle}>
                    {getBillPaymentImage(transaction) ? (
                      <Image
                        source={getBillPaymentImage(transaction)!}
                        style={styles.transactionIconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={getBillPaymentIcon(transaction) as any}
                        size={20 * SCALE}
                        color="#A9EF45"
                      />
                    )}
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
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                No bill payment transactions found
              </ThemedText>
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
            transactionType: 'billPayment',
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
          visible={showErrorModal && !isLoadingDetails}
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

      {/* Loading overlay when fetching transaction details */}
      {isLoadingDetails && selectedTransactionId && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#A9EF45" />
            <ThemedText style={{ color: '#FFFFFF', marginTop: 10, fontSize: 14 * SCALE }}>
              Loading transaction details...
            </ThemedText>
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
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginLeft:-40,
    textAlign: 'center',
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
    // backgroundColor: 'rgba(169, 239, 69, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconImage: {
    width: 35 * SCALE,
    height: 35 * SCALE,
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
});

export default BillPaymentsScreen;

