import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import TransactionErrorModal from '../../components/TransactionErrorModal';
import { useGetTransactionHistory, useGetTransactionDetails } from '../../../queries/transactionHistory.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Types for API integration
interface CryptoAssetDetails {
  id: string;
  name: string;
  ticker: string;
  balance: string;
  balanceUSD: string;
  icon: any;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  graphData: number[];
}

interface TimeRange {
  id: string;
  label: string;
}

interface RecentActivity {
  id: string;
  type: 'Deposit' | 'Withdraw' | 'Send' | 'Receive';
  status: 'Successful' | 'Pending' | 'Failed';
  amount: string;
  date: string;
  icon: any;
  rawData?: any; // Store raw API data for details
}

const CryptoAssetDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get asset data from route params - will be passed from Wallet screen
  const assetData = route.params as CryptoAssetDetails || {
    id: '1',
    name: 'Solana',
    ticker: 'SOL',
    balance: '20.25',
    balanceUSD: '$20,000',
    icon: require('../../../assets/login/bitcoin-coin.png'),
    currentPrice: 187.40,
    priceChange: 2.5,
    priceChangePercent: 2.5,
    // More data points for smoother graph
    graphData: [150, 155, 160, 158, 165, 162, 170, 168, 175, 172, 180, 178, 185, 183, 187.4],
  };

  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1D');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  // Map UI time range to API period
  const getApiPeriod = (timeRange: string): { period: 'D' | 'W' | 'M' | 'Custom'; startDate?: string; endDate?: string } => {
    const now = new Date();
    switch (timeRange) {
      case '1H':
      case '1D':
        return { period: 'D' };
      case '1W':
        return { period: 'W' };
      case '1M':
        return { period: 'M' };
      case '1Y':
        // Custom: last 12 months
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return {
          period: 'Custom',
          startDate: oneYearAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        };
      default:
        return { period: 'M' };
    }
  };

  // Build query params for transaction history
  const queryParams = useMemo(() => {
    const apiPeriod = getApiPeriod(selectedTimeRange);
    return {
      currency: assetData.ticker, // Use ticker as currency symbol
      period: apiPeriod.period,
      startDate: apiPeriod.startDate,
      endDate: apiPeriod.endDate,
    };
  }, [selectedTimeRange, assetData.ticker]);

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
    console.log('[CryptoAssetDetails] Refreshing data...');
    try {
      await refetchHistory();
      console.log('[CryptoAssetDetails] Data refreshed successfully');
    } catch (error) {
      console.error('[CryptoAssetDetails] Error refreshing data:', error);
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

  // Transform chartData from API to graph data format (array of numbers)
  const graphData = useMemo(() => {
    const chartData = transactionHistoryData?.data?.chartData || [];
    if (chartData.length === 0) {
      // Return default empty data for 24 hours
      return Array(24).fill(0);
    }
    
    // Extract amounts from chartData and convert to numbers
    return chartData.map((item: any) => parseFloat(item.amount || '0'));
  }, [transactionHistoryData?.data?.chartData]);

  // Transform crypto transactions to RecentActivity format
  const recentActivity: RecentActivity[] = useMemo(() => {
    if (!transactionHistoryData?.data?.crypto || !Array.isArray(transactionHistoryData.data.crypto)) {
      return [];
    }

    // Get all crypto transactions (deposits and withdrawals)
    const transactions = transactionHistoryData.data.crypto;

    // Transform to UI format
    return transactions.slice(0, 10).map((tx: any) => {
      const amount = parseFloat(tx.amount || '0');
      const currency = tx.currency || assetData.ticker;
      
      // Determine transaction type
      let type: 'Deposit' | 'Withdraw' | 'Send' | 'Receive' = 'Deposit';
      if (tx.type === 'withdrawal' || tx.normalizedType === 'Crypto Withdrawals') {
        type = 'Withdraw';
      } else if (tx.type === 'deposit' || tx.normalizedType === 'Crypto Deposit') {
        type = 'Deposit';
      }

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

      // Choose icon based on type
      const icon = type === 'Deposit' 
        ? require('../../../assets/send-up-white.png')
        : require('../../../assets/send-2-white.png');

      return {
        id: String(tx.id),
        type,
        status: normalizeStatus(tx.status),
        amount: `${amount} ${currency}`,
        date: formattedDate,
        icon,
        rawData: tx,
      };
    });
  }, [transactionHistoryData?.data?.crypto, assetData.ticker]);

  // Update transaction details when details data is fetched
  useEffect(() => {
    if (transactionDetailsData?.data && selectedActivity) {
      const details = transactionDetailsData.data;
      
      // Update selected activity with details
      const updatedActivity: RecentActivity = {
        ...selectedActivity,
        rawData: {
          ...selectedActivity.rawData,
          ...details,
        },
      };

      setSelectedActivity(updatedActivity);
    }
  }, [transactionDetailsData, selectedActivity]);

  const handleActivityPress = (activity: RecentActivity) => {
    const rawData = activity.rawData;
    const transactionId = rawData?.id;
    
    if (transactionId) {
      setSelectedTransactionId(transactionId);
    }
    
    setSelectedActivity(activity);
    
    // Show modal after details are loaded (or immediately if no ID)
    if (!transactionId) {
      if (activity.status === 'Failed') {
        setShowErrorModal(true);
      } else {
        setShowReceiptModal(true);
      }
    }
  };

  // Show modal when details are loaded
  useEffect(() => {
    if (selectedActivity && selectedTransactionId) {
      if (isLoadingDetails) {
        // Still loading details, don't show modal yet
        return;
      }
      
      // Details loaded, show appropriate modal
      if (selectedActivity.status === 'Failed') {
        setShowErrorModal(true);
      } else {
        setShowReceiptModal(true);
      }
    }
  }, [selectedActivity, selectedTransactionId, isLoadingDetails]);

  const timeRanges: TimeRange[] = [
    { id: '1H', label: '1H' },
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '1Y', label: '1Y' },
  ];

  // Enhanced line graph component matching Figma design
  const PriceGraph = ({ data, width = SCREEN_WIDTH * 0.85, height = 200 }: { data: number[]; width?: number; height?: number }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    const padding = 20 * SCALE;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const stepX = graphWidth / (data.length - 1);
    const selectedIndex = data.length - 1; // Last point is selected
    
    // Calculate points with padding
    const points = data.map((value, index) => {
      const x = padding + index * stepX;
      const normalizedValue = (value - minValue) / range;
      const y = padding + graphHeight - (normalizedValue * graphHeight);
      return { x, y, value };
    });

    const selectedPoint = points[selectedIndex];

    // Create smooth path segments for better visual
    const createPathSegments = () => {
      const segments = [];
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - prevPoint.x, 2) + Math.pow(currentPoint.y - prevPoint.y, 2)
        );
        const angle = Math.atan2(currentPoint.y - prevPoint.y, currentPoint.x - prevPoint.x) * (180 / Math.PI);
        segments.push({ prevPoint, currentPoint, distance, angle });
      }
      return segments;
    };

    const pathSegments = createPathSegments();

    return (
      <View style={{ width, height, position: 'relative', marginVertical: 20 * SCALE, overflow: 'hidden' }}>
        {/* Area fill under the line - creates gradient shaded effect matching Figma */}
        {points.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = points[index - 1];
          const bottomY = height;
          const topY = Math.min(prevPoint.y, point.y);
          const fillHeight = bottomY - topY;
          const segmentWidth = Math.abs(point.x - prevPoint.x);
          
          // Create gradient fill for each segment
          return (
            <LinearGradient
              key={`fill-${index}`}
              colors={['rgba(0, 255, 0, 0.25)', 'rgba(0, 255, 0, 0.12)', 'rgba(0, 255, 0, 0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: Math.min(prevPoint.x, point.x),
                top: Math.min(prevPoint.y, point.y),
                width: segmentWidth,
                height: fillHeight,
              }}
            />
          );
        })}

        {/* Smooth green line - vibrant bright green */}
        {pathSegments.map((segment, index) => (
          <View
            key={`line-${index}`}
            style={{
              position: 'absolute',
              left: segment.prevPoint.x,
              top: segment.prevPoint.y,
              width: segment.distance,
              height: 2.5,
              backgroundColor: '#00FF00', // Bright vibrant green matching Figma
              transform: [{ rotate: `${segment.angle}deg` }],
              transformOrigin: 'left center',
              shadowColor: '#00FF00',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 3,
              elevation: 2,
            }}
          />
        ))}

        {/* Vertical dashed line at selected point */}
        {Array.from({ length: Math.floor(height / 6) }).map((_, i) => (
          <View
            key={`dash-${i}`}
            style={{
              position: 'absolute',
              left: selectedPoint.x - 0.5,
              top: i * 6,
              width: 1,
              height: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
            }}
          />
        ))}

        {/* Selected point marker - White circle */}
        <View
          style={{
            position: 'absolute',
            left: selectedPoint.x - 5,
            top: selectedPoint.y - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#FFFFFF',
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }}
        />

        {/* Tooltip - Dark green/black background matching Figma */}
        <View
          style={{
            position: 'absolute',
            left: Math.max(padding, Math.min(selectedPoint.x - 35, width - 90)),
            top: Math.max(padding, selectedPoint.y - 55),
            backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark background matching Figma
            borderRadius: 8 * SCALE,
            paddingHorizontal: 12 * SCALE,
            paddingVertical: 10 * SCALE,
            minWidth: 75 * SCALE,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 5,
            elevation: 10,
          }}
        >
          <ThemedText style={styles.tooltipPrice}>${selectedPoint.value.toFixed(2)}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 * SCALE }}>
            <ThemedText style={styles.tooltipChange}>
              ↑ {Math.abs(assetData.priceChangePercent)}%
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

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
            <ThemedText style={styles.headerTitle}>{assetData.name}</ThemedText>
          </View>
        </View>

        {/* Main Asset Card */}
        <View style={styles.assetCardWrapper}>
          <LinearGradient
            colors={['#FFFFFF08', '#FFFFFF08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assetCard}
          >
            {/* Currency Info */}
            <View style={styles.currencyInfo}>
              <View style={styles.currencyLeft}>
                <View style={styles.currencyIconContainer}>
                  <Image
                    source={assetData.icon}
                    style={styles.currencyIcon}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.currencyTextContainer}>
                  <ThemedText style={styles.currencyName}>{assetData.name}</ThemedText>
                  <ThemedText style={styles.currencyTicker}>{assetData.ticker}</ThemedText>
                </View>
              </View>
              <View style={styles.currencyRight}>
                <ThemedText style={styles.currencyBalance}>
                  {balanceVisible ? `${assetData.balance} ${assetData.ticker}` : '••••'}
                </ThemedText>
                <ThemedText style={styles.currencyBalanceUSD}>
                  {balanceVisible ? assetData.balanceUSD : '••••'}
                </ThemedText>
              </View>
            </View>

            {/* Price Graph */}
            {isLoadingHistory ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading chart data...
                </ThemedText>
              </View>
            ) : (
              <PriceGraph data={graphData.length > 0 ? graphData : assetData.graphData} />
            )}

            {/* Time Range Selectors */}
            <View style={styles.timeRangeContainer}>
              {timeRanges.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.timeRangeButton,
                    selectedTimeRange === range.id && styles.timeRangeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedTimeRange(range.id);
                    // Time range change will trigger API refetch via useMemo
                  }}
                  disabled={isLoadingHistory}
                >
                  <ThemedText
                    style={[
                      styles.timeRangeText,
                      selectedTimeRange === range.id && styles.timeRangeTextActive,
                      isLoadingHistory && { opacity: 0.5 },
                    ]}
                  >
                    {range.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          {/* <Text style={styles.quickActionsTitle}>Quick Actions</Text> */}
          <View style={styles.quickActionsContainer}>
            {[
              { id: '1', title: 'Deposit', icon: require('../../../assets/send-2-white.png') },
              { id: '2', title: 'Withdraw', icon: require('../../../assets/send-2-white.png') },
              { id: '3', title: 'P2P', icon: require('../../../assets/profile-2user.png') },
            ].map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => {
                  if (action.id === '1' && action.title === 'Deposit') {
                    // Navigate to CryptoDeposit screen in Transactions stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Transactions' as never, {
                      screen: 'CryptoDeposit' as never,
                    } as never);
                  } else if (action.id === '2' && action.title === 'Withdraw') {
                    // Navigate to CryptoWithdrawals screen in Transactions stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Transactions' as never, {
                      screen: 'CryptoWithdrawals' as never,
                    } as never);
                  } else if (action.id === '3' && action.title === 'P2P') {
                    // Navigate to P2PTransactions screen in Transactions stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Transactions' as never, {
                      screen: 'P2PTransactions' as never,
                    } as never);
                  }
                }}
              >
                <View style={styles.quickActionIconCircle}>
                  {action.id === '2' ? (
                    <View style={{ transform: [{ rotate: '180deg' }] }}>
                      <Image
                        source={action.icon}
                        style={{ width: 42 * SCALE, height: 42 * SCALE }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <Image
                      source={action.icon}
                      style={{ width: 42 * SCALE, height: 42 * SCALE }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <ThemedText style={styles.quickActionText}>{action.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.recentActivityCard}>
          <View style={styles.recentActivityHeader}>
            <ThemedText style={styles.recentActivityTitle}>Recent Activity</ThemedText>
            <TouchableOpacity>
              {/* <Text style={styles.viewAllText}>View All</Text> */}
            </TouchableOpacity>
          </View>

          {isLoadingHistory ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading transactions...
              </ThemedText>
            </View>
          ) : historyError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={{ color: '#ff0000', fontSize: 12 * SCALE, marginTop: 10, textAlign: 'center' }}>
                {(historyError as any)?.message || 'Failed to load transactions'}
              </ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchHistory()}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : recentActivity.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="wallet-outline" size={40 * SCALE} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                No transactions found
              </ThemedText>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recentActivity.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => handleActivityPress(activity)}
                >
                  <View style={styles.activityIconContainer}>
                    <View style={styles.activityIconCircle}>
                      <Image
                        source={activity.icon}
                        style={{ width: 14 * SCALE, height: 14 * SCALE, tintColor: '#A9EF45' }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.activityDetails}>
                    <ThemedText style={styles.activityType}>{activity.type}</ThemedText>
                    <View style={styles.activityStatusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: activity.status === 'Successful' ? '#008000' : activity.status === 'Pending' ? '#ffa500' : '#ff0000' },
                        ]}
                      />
                      <ThemedText
                        style={[
                          styles.activityStatus,
                          { color: activity.status === 'Successful' ? '#008000' : activity.status === 'Pending' ? '#ffa500' : '#ff0000' },
                        ]}
                      >
                        {activity.status}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.activityAmountContainer}>
                    <ThemedText
                      style={[
                        styles.activityAmount,
                        activity.status === 'Successful' && styles.activityAmountGreen,
                      ]}
                    >
                      {activity.amount}
                    </ThemedText>
                    <ThemedText style={styles.activityDate}>{activity.date}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Transaction Receipt Modal */}
      {selectedActivity && (
        <TransactionReceiptModal
          visible={showReceiptModal && !isLoadingDetails}
          transaction={{
            transactionType: selectedActivity.type === 'Deposit' 
              ? 'cryptoDeposit' 
              : selectedActivity.type === 'Withdraw'
              ? 'cryptoWithdrawal'
              : 'send',
            cryptoType: assetData.name,
            network: selectedActivity.rawData?.metadata?.blockchain || assetData.name,
            quantity: selectedActivity.amount,
            dateTime: selectedActivity.date,
            transactionId: selectedActivity.rawData?.reference || `TXN-${selectedActivity.id}`,
            amountNGN: selectedActivity.amount,
            receivingAddress: selectedActivity.rawData?.metadata?.toAddress,
            sendingAddress: selectedActivity.rawData?.metadata?.fromAddress,
            txHash: selectedActivity.rawData?.metadata?.txHash,
            status: selectedActivity.status,
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedActivity(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Loading Modal for Transaction Details */}
      {selectedActivity && isLoadingDetails && (
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
      {selectedActivity && (
        <TransactionErrorModal
          visible={showErrorModal && !isLoadingDetails}
          transaction={selectedActivity.rawData || selectedActivity}
          onRetry={() => {
            if (selectedTransactionId) {
              refetchHistory();
            }
            setShowErrorModal(false);
            setSelectedActivity(null);
            setSelectedTransactionId(null);
          }}
          onCancel={() => {
            setShowErrorModal(false);
            setSelectedActivity(null);
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
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -40 * SCALE,
  },
  assetCardWrapper: {
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    position: 'relative',
  },
  assetCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 400 * SCALE,
    position: 'relative',
  },
  currencyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20 * SCALE,
    borderBottomWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#FFFFFF08', // Different background color for header section
    // borderRadius: 10 * SCALE,
    padding: 12 * SCALE,
    marginHorizontal: -14 * SCALE, // Extend to card edges (card padding is 14)
    marginTop: -14 * SCALE, // Align with card top
    borderTopLeftRadius: 15 * SCALE, // Match card's top border radius
    borderTopRightRadius: 15 * SCALE,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIconContainer: {
    width: 33 * 1,
    height: 33 * 1,
    borderRadius: 20 * SCALE,
    marginRight: 12 * SCALE,
    overflow: 'hidden',
  },
  currencyIcon: {
    width: '100%',
    height: '100%',
  },
  currencyTextContainer: {
    flex: 1,
  },
  currencyName: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  currencyTicker: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  currencyRight: {
    alignItems: 'flex-end',
  },
  currencyBalance: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  currencyBalanceUSD: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tooltipPrice: {
    fontSize: 14 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tooltipChange: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#00FF00', // Bright green matching Figma
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20 * SCALE,
    gap: 8 * SCALE,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 7 * SCALE,
    paddingHorizontal: 10 * 1,
    borderRadius: 8 * SCALE,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeRangeButtonActive: {
    backgroundColor: '#FFFFFF08',
  },
  timeRangeText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  quickActionsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 5 * SCALE,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor: 'rgba(255, 255, 255, 0.03)',
    // borderWidth: 0.3,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100 * SCALE,
    paddingVertical: 10 * SCALE,
    paddingHorizontal: 2 * SCALE,
    minHeight: 83 * SCALE,
  },
  quickActionIconCircle: {
    width: 42 * SCALE,
    height: 42 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8 * SCALE,
  },
  quickActionText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  recentActivityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
  },
  recentActivityTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  activityList: {
    gap: 10 * SCALE,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
    minHeight: 60 * SCALE,
  },
  activityIconContainer: {
    marginRight: 12 * SCALE,
  },
  activityIconCircle: {
    width: 35 * SCALE,
    height: 35 * SCALE,
    borderRadius: 17.5 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  activityType: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  activityStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
  },
  statusDot: {
    width: 6 * SCALE,
    height: 6 * SCALE,
    borderRadius: 3 * SCALE,
  },
  activityStatus: {
    fontSize: 8 * 1,
    fontWeight: '300',
  },
  activityAmountContainer: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 12 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  activityAmountGreen: {
    color: '#008000',
  },
  activityDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
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

export default CryptoAssetDetails;

