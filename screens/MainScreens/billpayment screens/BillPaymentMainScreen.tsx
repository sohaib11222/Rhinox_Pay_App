import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetBillPayments } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface BillPaymentCategory {
  id: string;
  title: string;
  description: string;
  icon: any; // MaterialCommunityIcons name or require() image source
  iconType: 'icon' | 'image';
}

interface RecentTransaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  status: 'Successful' | 'Pending' | 'Failed';
  icon: any; // Image require() source or MaterialCommunityIcons name
  iconType?: 'icon' | 'image'; // Optional, defaults to 'image' if icon is require()
  rawData?: any; // Store raw transaction data for navigation
}

const BillPaymentMainScreen = () => {
  const navigation = useNavigation();

  // Mock data - Replace with API calls later
  const billPaymentCategories: BillPaymentCategory[] = [
    {
      id: '1',
      title: 'Airtime Recharge',
      description: 'Recharge your airtime easily via rhinoxpay',
      icon: require('../../../assets/mobile.png'),
      iconType: 'image',
    },
    {
      id: '2',
      title: 'Data Recharge',
      description: 'Recharge your data plans easily via rhinoxpay',
      icon: require('../../../assets/global.png'),
      iconType: 'image',
    },
    {
      id: '3',
      title: 'Electricity',
      description: 'Pay your electricity bills with ease on Rhinoxpay',
      icon: require('../../../assets/flash.png'),
      iconType: 'image',
    },
    {
      id: '4',
      title: 'Cable TV',
      description: 'Subscribe to your favorite cable TV plans',
      icon: require('../../../assets/monitor.png'),
      iconType: 'image',
    },
    {
      id: '5',
      title: 'Betting',
      description: 'Fund your betting account easily ',
      icon: require('../../../assets/SoccerBall.png'),
      iconType: 'image',
    },
    {
      id: '6',
      title: 'Internet Subscription',
      description: 'Subscribe on your internet \nrouters easily',
      icon: require('../../../assets/WifiHigh.png'),
      iconType: 'image',
    },
  ];

  // Fetch recent bill payment transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetBillPayments({
    limit: 10,
    offset: 0,
  });

  // Transform transactions to UI format
  const recentTransactions = useMemo(() => {
    if (!transactionsData?.data?.transactions || !Array.isArray(transactionsData.data.transactions)) {
      return [];
    }

    return transactionsData.data.transactions.map((tx: any) => {
      const category = tx.category || {};
      const provider = tx.provider || {};
      
      // Get category name for title
      const categoryName = category.name || category.code || 'Bill Payment';
      
      // Format amount
      const amount = parseFloat(tx.amount || '0');
      const formattedAmount = `N${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      
      // Format date
      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A';
      
      // Map status
      let status: 'Successful' | 'Pending' | 'Failed' = 'Pending';
      if (tx.status === 'completed' || tx.status === 'successful' || tx.status === 'success') {
        status = 'Successful';
      } else if (tx.status === 'failed' || tx.status === 'failure') {
        status = 'Failed';
      } else {
        status = 'Pending';
      }
      
      // Get provider logo or default icon
      let icon: any = require('../../../assets/Ellipse 20.png');
      let iconType: 'icon' | 'image' = 'image';
      
      if (provider.logoUrl) {
        const logoUrl = `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}`;
        icon = { uri: logoUrl };
        iconType = 'image';
      } else {
        // Default icons based on category
        const categoryCode = category.code || '';
        if (categoryCode === 'airtime') {
          icon = require('../../../assets/Ellipse 20.png');
        } else if (categoryCode === 'data') {
          icon = require('../../../assets/Ellipse 21.png');
        } else if (categoryCode === 'electricity') {
          icon = require('../../../assets/Ellipse 21 (2).png');
        } else if (categoryCode === 'cable_tv') {
          icon = require('../../../assets/Ellipse 22.png');
        } else if (categoryCode === 'betting') {
          icon = require('../../../assets/Ellipse 22.png');
        } else if (categoryCode === 'internet') {
          icon = require('../../../assets/Ellipse 20.png');
        } else {
          icon = require('../../../assets/Ellipse 20.png');
        }
        iconType = 'image';
      }
      
      // Build title
      let title = categoryName;
      if (provider.name) {
        title = `${provider.name} - ${categoryName}`;
      }
      
      return {
        id: String(tx.id),
        title: title,
        amount: formattedAmount,
        date: date,
        status: status,
        icon: icon,
        iconType: iconType,
        rawData: tx, // Store raw data for navigation
      };
    });
  }, [transactionsData?.data?.transactions]);

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

  const handleCategoryPress = (category: BillPaymentCategory) => {
    if (category.title === 'Airtime Recharge') {
      // Navigate to Airtime screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'Airtime' as never,
      } as never);
    } else if (category.title === 'Data Recharge') {
      // Navigate to DataRecharge screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'DataRecharge' as never,
      } as never);
    } else if (category.title === 'Internet Subscription') {
      // Navigate to InternetSubscription screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'InternetSubscription' as never,
      } as never);
    } else if (category.title === 'Electricity') {
      // Navigate to Electricity screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'Electricity' as never,
      } as never);
    } else if (category.title === 'Cable TV') {
      // Navigate to CableTv screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'CableTv' as never,
      } as never);
    } else if (category.title === 'Betting') {
      // Navigate to Betting screen within Transactions stack
      // @ts-ignore - allow nested navigation
      navigation.navigate('Transactions' as never, {
        screen: 'Betting' as never,
      } as never);
    } else {
      // TODO: Navigate to other bill payment flows
      console.log('Category pressed:', category.title);
    }
  };

  const handleTransactionPress = (transaction: RecentTransaction) => {
    // Navigate to Transactions tab first, then to BillPayments screen
    // @ts-ignore - allow parent route name
    navigation.navigate('Transactions' as never);
    // Note: BillPayments is nested under Transactions stack, so we navigate to Transactions tab
    // The user can then navigate to BillPayments from there
  };

  const handleViewAllPress = () => {
    // Navigate to Transactions tab first, then to BillPayments screen
    // @ts-ignore - allow parent route name
    navigation.navigate('Transactions' as never);
    // Note: BillPayments is nested under Transactions stack, so we navigate to Transactions tab
    // The user can then navigate to BillPayments from there
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[BillPaymentMainScreen] Refreshing bill payment data...');
    try {
      await refetchTransactions();
      console.log('[BillPaymentMainScreen] Bill payment data refreshed successfully');
    } catch (error) {
      console.error('[BillPaymentMainScreen] Error refreshing bill payment data:', error);
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
          <ThemedText style={styles.headerTitle}>Bill Payment</ThemedText>
        </View>

        {/* Bill Payment Categories Grid */}
        <View style={styles.categoriesContainer}>
          {billPaymentCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryPress(category)}
            >
              <LinearGradient
                colors={['#213637', '#FFFFFF0D']}
                start={{ x: 1, y: 0.5 }}
                end={{ x: 0, y: 1 }}
                style={styles.categoryCard}
              >
                <View style={styles.categoryIconContainer}>
                  <View style={styles.categoryIconCircle}>
                    {category.iconType === 'image' ? (
                      <Image
                        source={category.icon}
                        style={styles.categoryIconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={category.icon as any}
                        size={24 * SCALE}
                        color="#A9EF45"
                      />
                    )}
                  </View>
                </View>
                <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
                <ThemedText style={styles.categoryDescription}>{category.description}</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <ThemedText style={styles.recentTransactionsTitle}>Recent Transactions</ThemedText>
            <TouchableOpacity onPress={handleViewAllPress}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
            </View>
          ) : isTransactionsError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
              <ThemedText style={styles.errorText}>
                {transactionsError?.message || 'Failed to load transactions. Please try again.'}
              </ThemedText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchTransactions()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction: RecentTransaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                >
                  <View style={styles.transactionIconContainer}>
                    <View style={styles.transactionIconCircle}>
                      {transaction.iconType === 'image' ? (
                        <Image
                          source={transaction.icon}
                          style={styles.transactionIconImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={transaction.icon as any}
                          size={20 * SCALE}
                          color="#A9EF45"
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.transactionDetails}>
                    <ThemedText style={styles.transactionTitle}>{transaction.title}</ThemedText>
                    <View style={styles.transactionStatusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(transaction.status) },
                        ]}
                      />
                      <ThemedText
                        style={[
                          styles.transactionStatus,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {transaction.status}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.transactionAmountContainer}>
                    <ThemedText style={styles.transactionAmount}>{transaction.amount}</ThemedText>
                    <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt-text-outline" size={40 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.emptyText}>No recent transactions</ThemedText>
              <ThemedText style={styles.emptySubtext}>Your bill payment transactions will appear here</ThemedText>
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingTop: 30 * SCALE,
    paddingBottom: 20 * SCALE,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  categoryCard: {
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    width: (SCREEN_WIDTH - SCREEN_WIDTH * 0.047 * 2 - 10 * SCALE) / 2,
    minHeight: 150 * SCALE,
  },
  categoryIconContainer: {
    marginBottom: 15 * SCALE,
  },
  categoryIconCircle: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    borderRadius: 25 * SCALE,
    backgroundColor: '#FFFFFF08',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryIconImage: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  categoryTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
    fontFamily: 'Aeonik_Pro_TRIAL',
  },
  categoryDescription: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16 * SCALE,
    fontFamily: 'Aeonik_Pro_TRIAL',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 5 * SCALE,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
  },
  recentTransactionsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#A9EF45',
  },
  transactionsList: {
    gap: 8 * SCALE,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    padding: 10 * SCALE,
    minHeight: 60 * SCALE,
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
  transactionAmount: {
    fontSize: 12 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  transactionDate: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 * SCALE,
    gap: 12 * SCALE,
  },
  loadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 * SCALE,
    gap: 12 * SCALE,
  },
  errorText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#ff0000',
    textAlign: 'center',
    paddingHorizontal: 20 * SCALE,
  },
  retryButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 10 * SCALE,
    marginTop: 10 * SCALE,
  },
  retryButtonText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 * SCALE,
    gap: 8 * SCALE,
  },
  emptyText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingHorizontal: 20 * SCALE,
  },
});

export default BillPaymentMainScreen;

