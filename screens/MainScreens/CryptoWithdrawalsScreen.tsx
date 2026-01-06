import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import TransactionReceiptModal from '../components/TransactionReceiptModal';
import TransactionErrorModal from '../components/TransactionErrorModal';
import { ThemedText } from '../../components';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // Simulate data fetching - replace with actual API calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Here you would typically:
        // - Fetch latest crypto withdrawal transactions
        // - Fetch updated summary data
        // - Update any other data that needs refreshing
        console.log('Refreshing crypto withdrawal data...');
        resolve();
      }, 1000);
    });
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Mock data - Replace with API calls later
  const cryptoWithdrawalTransactions: CryptoWithdrawalTransaction[] = [
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

  const summaryData = {
    incoming: {
      ngn: '2,000,000.00',
      usd: '$20,000',
    },
    outgoing: {
      ngn: '500.00',
      usd: '$0.001',
    },
  };

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
    if (transaction.status === 'Failed') {
      setSelectedTransaction(transaction);
      setShowErrorModal(true);
    } else {
      setSelectedTransaction(transaction);
      setShowReceiptModal(true);
    }
  };

  const filteredTransactions = cryptoWithdrawalTransactions.filter((transaction) => {
    if (selectedStatus !== 'All' && transaction.status !== selectedStatus) {
      return false;
    }
    if (selectedType !== 'All' && transaction.cryptoType !== selectedType) {
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
          <ThemedText style={styles.cardTitle}>Today</ThemedText>
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
            transactionType: 'cryptoWithdrawal',
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
});

export default CryptoWithdrawalsScreen;

