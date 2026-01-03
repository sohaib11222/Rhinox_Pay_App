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
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Types for API integration
interface Order {
  id: string;
  userName: string;
  userAvatar: any;
  type: 'Buy' | 'Sell';
  asset: string;
  status: 'Active';
  amount: string;
  assetAmount: string;
  date: string;
}

// Types for API integration
interface Ad {
  id: string;
  type: 'Buy' | 'Sell';
  asset: string;
}

const AdDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as { adId?: string } | undefined;
  const [activeTab, setActiveTab] = useState<'Received' | 'Unpaid' | 'Paid' | 'Appeal'>('Received');

  // Mock ad data - Replace with API call
  // This should match the ads in MyAdsScreen.tsx
  const ads: Ad[] = [
    { id: '1', type: 'Buy', asset: 'USDT' },
    { id: '2', type: 'Buy', asset: 'USDT' },
    { id: '3', type: 'Sell', asset: 'USDT' },
    { id: '4', type: 'Sell', asset: 'ETH' },
  ];

  // Find the ad based on route params
  const currentAd = routeParams?.adId ? ads.find(ad => ad.id === routeParams.adId) : ads[0];
  const adType = currentAd?.type || 'Buy';
  const adAsset = currentAd?.asset || 'USDT';

  // Mock data - Replace with API calls
  const orders: Order[] = [
    {
      id: '1',
      userName: 'Qamar Malik',
      userAvatar: require('../../../assets/Frame 2398.png'),
      type: 'Buy',
      asset: 'USDT',
      status: 'Active',
      amount: 'N20,000',
      assetAmount: '15 USDT',
      date: 'Oct 15,2025',
    },
    {
      id: '2',
      userName: 'Qamar Malik',
      userAvatar: require('../../../assets/Frame 2398.png'),
      type: 'Sell',
      asset: 'USDT',
      status: 'Active',
      amount: 'N20,000',
      assetAmount: '15 USDT',
      date: 'Oct 15,2025',
    },
    {
      id: '3',
      userName: 'Qamar Malik',
      userAvatar: require('../../../assets/Frame 2398.png'),
      type: 'Sell',
      asset: 'USDT',
      status: 'Active',
      amount: 'N20,000',
      assetAmount: '15 USDT',
      date: 'Oct 15,2025',
    },
  ];

  const handleAccept = (order: Order) => {
    // Navigate to appropriate order flow based on ad type
    if (adType === 'Buy') {
      (navigation as any).navigate('Settings', {
        screen: 'BuyOrder',
        params: {
          orderId: order.id,
          amount: order.amount,
          assetAmount: order.assetAmount,
          skipInitialScreen: true,
          paymentMethod: 'Bank Transfer', // Default payment method from order
        },
      });
    } else {
      // Navigate to SellOrderFlow for sell ads
      (navigation as any).navigate('Settings', {
        screen: 'SellOrderFlow',
        params: {
          orderId: order.id,
          amount: order.amount,
          assetAmount: order.assetAmount,
          skipInitialScreen: true,
          paymentMethod: 'Bank Transfer', // Default payment method from order
        },
      });
    }
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Refreshing ad details data...');
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonCircle}>
            <MaterialCommunityIcons name="chevron-left" size={20 * SCALE} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{adAsset} {adType} Ad</ThemedText>
        <View style={styles.headerRight} />
      </View>

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
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          {/* Orders Card - Same as Incoming Card */}
          <LinearGradient
            colors={['#4880C0', '#1B589E']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconCircle}>
                <Image
                  source={require('../../../assets/ArrowLineDownLeft (1).png')}
                  style={styles.summaryIconImage}
                  resizeMode="cover"
                />
              </View>
              <ThemedText style={styles.summaryLabel}>Orders</ThemedText>
            </View>
            <View style={styles.summaryAmountContainer}>
              <View style={styles.summaryAmountRow}>
                <ThemedText style={styles.summaryAmountMain}>2,000,000.00</ThemedText>
                <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.summaryUSD}>$20,000</ThemedText>
          </LinearGradient>

          {/* Completion Rate Card - Same as Outgoing Card */}
          <View style={styles.summaryCardWhite}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconCircleWhite}>
                <Image
                  source={require('../../../assets/Vector (31).png')}
                  style={styles.summaryIconImage}
                  resizeMode="cover"
                />
              </View>
              <ThemedText style={styles.summaryLabelWhite}>Completion Rate</ThemedText>
            </View>
            <View style={styles.summaryAmountContainer}>
              <View style={styles.summaryAmountRow}>
                <ThemedText style={styles.summaryAmountMainWhite}>100</ThemedText>
                <ThemedText style={styles.summaryAmountCurrencyWhite}>%</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.summaryUSDWhite}>200 Orders</ThemedText>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF08', marginHorizontal: 15 * SCALE, borderRadius: 15 * SCALE, borderWidth: 0.3, borderColor: '#FFFFFF33', paddingBottom: 10, marginBottom: 15 }}>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{adAsset} {adType} Ad</ThemedText>
          </View>

          {/* Ad Details Card */}
          <LinearGradient
            colors={['#FFFFFF0D', '#FFFFFF0D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adDetailsCard}
          >
            {/* Ad Header */}
            <View style={styles.adHeader}>
              <View style={styles.adHeaderLeft}>
                <Image
                  source={require('../../../assets/Frame 2398.png')}
                  style={styles.adAvatar}
                  resizeMode="cover"
                />
                <View style={styles.adHeaderText}>
                  <ThemedText style={styles.adType}>{adAsset} {adType} Order</ThemedText>
                  <ThemedText style={styles.adStatus}>Active</ThemedText>
                </View>
              </View>
              <View style={styles.adStateTag}>
                <Image
                  source={require('../../../assets/Hourglass.png')}
                  style={[{ marginBottom: -1, width: 10, height: 10 }]}
                  resizeMode="cover"
                />
                <ThemedText style={styles.adStateText}>Running</ThemedText>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.performanceMetrics}>
              <View style={styles.metricRow}>
                <Image
                  source={require('../../../assets/File.png')}
                  style={styles.metricIcon}
                  resizeMode="cover"
                />
                <ThemedText style={styles.metricText}>Orders Received : 1,200</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <Image
                  source={require('../../../assets/Vector (41).png')}
                  style={styles.metricIcon}
                  resizeMode="cover"
                />
                <ThemedText style={styles.metricText}>Response Time : 15min</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <Image
                  source={require('../../../assets/User (1).png')}
                  style={styles.metricIcon}
                  resizeMode="cover"
                />
                <ThemedText style={styles.metricText}>Score : 98%</ThemedText>
              </View>
            </View>

            {/* Ad Configuration Details */}
            <View style={styles.adConfig}>
              <View style={[styles.configRow, { borderTopRightRadius: 7 * SCALE, borderTopLeftRadius: 7, borderWidth: 0.5 }]}>
                <ThemedText style={styles.configLabel}>Completed Orders</ThemedText>
                <ThemedText style={styles.configValue}>200</ThemedText>
              </View>
              <View style={styles.configRow}>
                <ThemedText style={styles.configLabel}>Cancelled Orders</ThemedText>
                <ThemedText style={styles.configValue}>200</ThemedText>
              </View>
              <View style={styles.configRow}>
                <ThemedText style={styles.configLabel}>Available Quantity</ThemedText>
                <ThemedText style={styles.configValue}>50 USDT</ThemedText>
              </View>
              <View style={styles.configRow}>
                <ThemedText style={styles.configLabel}>Limits</ThemedText>
                <ThemedText style={styles.configValue}>1,600 - 75,000 NGN</ThemedText>
              </View>
              <View style={[styles.configRow, { borderBottomRightRadius: 7 * SCALE, borderBottomLeftRadius: 7, borderWidth: 0.5 }]}>
                <ThemedText style={styles.configLabel}>Payment Methods</ThemedText>
                <ThemedText style={styles.configValue}>
                  Opay , Palmpay , Moniepoint ,Kudabank , Chipper Cash
                </ThemedText>
              </View>
            </View>

            {/* Price and Action Buttons */}
            <View style={styles.adFooter}>
              <View style={styles.priceContainer}>
                <ThemedText style={styles.priceLabel}>Price / 1 USDT</ThemedText>
                <ThemedText style={styles.priceValue}>1,550.70 NGN</ThemedText>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.deleteAdButton}>
                  <ThemedText style={styles.deleteAdButtonText}>Delete Ad</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editAdButton}>
                  <ThemedText style={styles.editAdButtonText}>Edit AD</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            {(['Received', 'Unpaid', 'Paid', 'Appeal'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <ThemedText
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Received Orders Section */}
        {activeTab === 'Received' && (
          <View style={{ backgroundColor: '#FFFFFF08', marginHorizontal: 15 * SCALE, borderRadius: 15 * SCALE, borderWidth: 0.3, borderColor: '#FFFFFF33', paddingBottom: 10, marginBottom: 15 }}>
            <View style={styles.ordersSection}>
              <View style={styles.ordersHeader}>
                <ThemedText style={styles.ordersTitle}>Received Orders</ThemedText>
                <View style={styles.ordersHeaderActions}>
                  <TouchableOpacity>
                    <ThemedText style={styles.acceptAllText}>Accept All</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <ThemedText style={styles.declineAllText}>Decline All</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Image
                        source={order.userAvatar}
                        style={styles.orderAvatar}
                        resizeMode="cover"
                      />
                      <View style={styles.orderInfo}>
                        <ThemedText style={styles.orderUserName}>{order.userName}</ThemedText>
                        <ThemedText style={styles.orderType}>
                          {order.type} {order.asset} {order.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.orderAmountContainer}>
                      <ThemedText style={styles.orderAmount}>{order.amount}</ThemedText>
                      <ThemedText style={styles.orderDate}>{order.date}</ThemedText>
                    </View>
                    <ThemedText style={styles.orderAssetAmount}>({order.assetAmount})</ThemedText>
                  </View>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() => {
                        (navigation as any).navigate('Settings', {
                          screen: 'ChatScreen',
                        });
                      }}
                    >
                      <Image
                        source={require('../../../assets/ChatCircle.png')}
                        style={[{ marginBottom: -1, width: 24, height: 24 }]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <View style={styles.orderActionButtons}>
                      <TouchableOpacity style={styles.cancelButton}>
                        <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAccept(order)}
                      >
                        <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default AdDetails;

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
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
  },
  backButtonCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 15 * SCALE,
    marginTop: 15 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40 * SCALE,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  summaryCardGradient: {
    flex: 1,
    borderRadius: 15 * 1,
    padding: 11 * 1,
    minHeight: 87 * 1,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryCardWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15 * 1,
    padding: 11 * 1,
    minHeight: 87 * 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 * SCALE,
  },
  summaryIconCircle: {
    width: 17 * 1,
    height: 17 * 1,
    borderRadius: 12.5 * 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8 * SCALE,
  },
  summaryIconCircleWhite: {
    width: 17 * 1,
    height: 17 * 1,
    borderRadius: 8.5 * 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8 * 1,
  },
  summaryIconImage: {
    marginBottom: -1,
    width: 7,
    height: 7,
  },
  summaryLabel: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryLabelWhite: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#000000',
  },
  summaryAmountContainer: {
    marginBottom: 6 * 1,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryAmountMain: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 24 * 1,
  },
  summaryAmountMainWhite: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 24 * SCALE,
  },
  summaryAmountCurrency: {
    fontSize: 8 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4 * SCALE,
    lineHeight: 20 * SCALE,
    marginBottom: 2 * SCALE,
  },
  summaryAmountCurrencyWhite: {
    fontSize: 8 * 1,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 4 * SCALE,
    lineHeight: 20 * SCALE,
    marginBottom: 2 * SCALE,
  },
  summaryUSD: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryUSDWhite: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  adDetailsCard: {
    borderWidth: 0.3,
    borderColor: '#E8E8E8',
    borderTopColor: '#A9EF45',
    borderRightColor: '#A9EF45',
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    overflow: 'hidden',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15 * SCALE,
  },
  adHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adAvatar: {
    width: 34 * 1,
    height: 34 * 1,
    borderRadius: 25 * SCALE,
    marginRight: 10 * SCALE,
  },
  adHeaderText: {
    flex: 1,
  },
  adType: {
    fontSize: 14 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  adStatus: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#4CAF50',
  },
  adStateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA5001A',
    borderWidth: 0.3,
    borderColor: '#FFA000',
    paddingHorizontal: 8 * SCALE,
    paddingVertical: 4 * SCALE,
    borderRadius: 20 * SCALE,
    gap: 4 * SCALE,
  },
  adStateText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#FFA500',
  },
  performanceMetrics: {
    marginTop: 5,
    marginBottom: 15 * SCALE,
    gap: 10 * SCALE,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  metricIcon: {
    marginBottom: -1,
    width: 10,
    height: 10,
  },
  metricText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  adConfig: {
    marginBottom: 5 * SCALE,
    gap: 0,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12 * SCALE,
    paddingTop: 12 * SCALE,
    borderWidth: 0.3,
    backgroundColor: '#FFFFFF08',
    paddingHorizontal: 10 * SCALE,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  configLabel: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  configValue: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10 * SCALE,
  },
  adFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4 * SCALE,
  },
  priceValue: {
    fontSize: 20 * 1,
    fontWeight: '600',
    color: '#8BC34A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8 * SCALE,
  },
  deleteAdButton: {
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.5,
    justifyContent: 'center',
    borderColor: '#A9EF45',
  },
  deleteAdButtonText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  editAdButton: {
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#8BC34A',
    justifyContent: 'center',
  },
  editAdButtonText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#000',
  },
  tabsContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#1A202C',
    borderRadius: 100,
    borderWidth: 0.3,
    borderColor: '#2D3748',
    padding: 3 * SCALE,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 10 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    zIndex: 1,
  },
  tabActive: {
    backgroundColor: '#A9EF45',
  },
  tabText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#CBD5E0',
  },
  tabTextActive: {
    color: '#2D3748',
    fontWeight: '400',
  },
  ordersSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  ordersHeader: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25 * SCALE,

  },
  ordersTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  ordersHeaderActions: {
    flexDirection: 'row',
    gap: 15 * SCALE,
  },
  acceptAllText: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  declineAllText: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    // padding: 15 * SCALE,
    marginBottom: 15 * SCALE,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginBottom: 5 * SCALE,
    padding: 15 * SCALE,
    marginBottom:5,
    marginTop:5,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderAvatar: {
    width: 35 * 1,
    height: 35 * 1,
    borderRadius: 25 * SCALE,
    marginRight: 10 * SCALE,
  },
  orderInfo: {
    flex: 1,
  },
  orderUserName: {
    fontSize: 12 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  orderType: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  orderAmountContainer: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 12 * 1,
    fontWeight: '600',
    color: '#008000',
    marginBottom: 4 * SCALE,
  },
  orderAssetAmount: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  orderDate: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginRight: -55,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    // padding: 15 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 7 * SCALE,  
  },
  chatButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderActionButtons: {
    flexDirection: 'row',
    gap: 8 * SCALE,
  },
  cancelButton: {
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: '#A9EF45',
    backgroundColor: 'transparent',
    justifyContent:'center',
  },
  cancelButtonText: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  acceptButton: {
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 100 * SCALE,
    backgroundColor: '#A9EF45',
    justifyContent:'center',
  },
  acceptButtonText: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: '#000000',
  },
  bottomSpacer: {
    height: 20 * SCALE,
  },
});

