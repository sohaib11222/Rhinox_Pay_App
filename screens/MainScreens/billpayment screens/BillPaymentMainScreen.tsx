import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

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

  const recentTransactions: RecentTransaction[] = [
    {
      id: '1',
      title: 'Airtime Topup',
      amount: 'N2000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/Ellipse 20.png'),
      iconType: 'image',
    },
    {
      id: '2',
      title: 'Electricity Purchase',
      amount: 'N2000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/Ellipse 21.png'),
      iconType: 'image',
    },
    {
      id: '3',
      title: 'Cable TV ',
      amount: 'N2000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/Ellipse 21 (2).png'),
      iconType: 'image',
    },
    {
      id: '4',
      title: 'Betting Funding',
      amount: 'N2000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/Ellipse 22.png'),
      iconType: 'image',
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
    // Simulate data fetching - replace with actual API calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Here you would typically:
        // - Fetch latest bill payment categories
        // - Fetch latest recent transactions
        // - Update any other data that needs refreshing
        console.log('Refreshing bill payment data...');
        resolve();
      }, 1000);
    });
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

          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
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
});

export default BillPaymentMainScreen;

