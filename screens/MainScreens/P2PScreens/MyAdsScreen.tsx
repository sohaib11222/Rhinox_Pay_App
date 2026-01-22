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
import { useGetMyP2PAds, useGetVendorOrders } from '../../../queries/p2p.queries';
import { useUpdateP2PAdStatus } from '../../../mutations/p2p.mutations';
import { showSuccessAlert, showErrorAlert, showInfoAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Types for API integration
interface Ad {
  id: string;
  numericId: number; // Numeric ID for API calls
  type: 'Buy' | 'Sell';
  asset: string;
  status: 'Online' | 'Offline';
  adState: 'Running' | 'Paused';
  ordersReceived: number;
  responseTime: string;
  score: string;
  quantity: string;
  limits: string;
  paymentMethods: string[];
  price: string;
  userAvatar: any;
  rawData?: any; // Raw API data
}

const MyAdsScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>('Buy');

  // Fetch my ads from API
  const {
    data: adsData,
    isLoading: isLoadingAds,
    refetch: refetchAds,
  } = useGetMyP2PAds({
    type: activeTab === 'Buy' ? 'buy' : 'sell',
  });

  // Fetch vendor orders to calculate real completion rate
  const {
    data: vendorOrdersData,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useGetVendorOrders({
    limit: 1000, // Get all orders to calculate stats
    offset: 0,
  });

  // Transform ads data to UI format
  const ads: Ad[] = useMemo(() => {
    if (!adsData?.data || !Array.isArray(adsData.data)) {
      return [];
    }
    return adsData.data.map((ad: any) => {
      // Map API status to UI status
      const status = ad.isOnline ? 'Online' : 'Offline';
      const adState = ad.status === 'available' ? 'Running' : ad.status === 'paused' ? 'Paused' : 'Running';
      
      // Format limits
      const limits = `${parseFloat(ad.minOrder || '0').toLocaleString()} - ${parseFloat(ad.maxOrder || '0').toLocaleString()} ${ad.fiatCurrency || 'NGN'}`;
      
      // Format quantity
      const quantity = `${ad.volume || '0'} ${ad.cryptoCurrency || 'USDT'}`;
      
      // Format price
      const price = parseFloat(ad.price || '0').toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      // Get payment methods (if available in response)
      const paymentMethods = ad.paymentMethods || [];
      
      return {
        id: String(ad.id),
        numericId: typeof ad.id === 'number' ? ad.id : parseInt(String(ad.id), 10), // Store numeric ID for API calls
        type: ad.type === 'buy' ? 'Buy' : 'Sell',
        asset: ad.cryptoCurrency || 'USDT',
        status,
        adState,
        ordersReceived: ad.ordersReceived || 0,
        responseTime: ad.responseTime || 'N/A',
        score: ad.score ? `${ad.score}%` : 'N/A',
        quantity,
        limits,
        paymentMethods: paymentMethods.map((pm: any) => pm.name || pm.bankName || 'Unknown'),
        price,
        userAvatar: require('../../../assets/Frame 2398.png'),
        rawData: ad, // Store raw API data
      };
    });
  }, [adsData?.data]);

  const filteredAds = ads;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    // Total orders received across all ads
    const totalOrders = ads.reduce((sum, ad) => sum + ad.ordersReceived, 0);
    
    // Calculate completed and cancelled orders from vendor orders data
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalOrdersFromAPI = 0;
    
    if (vendorOrdersData?.data && Array.isArray(vendorOrdersData.data)) {
      totalOrdersFromAPI = vendorOrdersData.data.length;
      completedOrders = vendorOrdersData.data.filter((order: any) => order.status === 'completed').length;
      cancelledOrders = vendorOrdersData.data.filter((order: any) => order.status === 'cancelled').length;
    }
    
    // Use total orders from API if available, otherwise use ordersReceived sum
    const actualTotalOrders = totalOrdersFromAPI > 0 ? totalOrdersFromAPI : totalOrders;
    
    // Calculate completion rate: (completed / total) * 100
    // Exclude cancelled orders from the calculation
    const nonCancelledOrders = actualTotalOrders - cancelledOrders;
    const completionRate = nonCancelledOrders > 0 
      ? Math.round((completedOrders / nonCancelledOrders) * 100) 
      : (actualTotalOrders > 0 ? 0 : 100);
    
    // Calculate total value (sum of all ad volumes * prices)
    const totalValue = ads.reduce((sum, ad) => {
      const volume = parseFloat(ad.quantity.replace(/[^\d.]/g, ''));
      const price = parseFloat(ad.price.replace(/,/g, ''));
      return sum + (volume * price);
    }, 0);
    
    return {
      totalOrders: actualTotalOrders,
      completionRate,
      totalValue,
      completedOrdersCount: completedOrders,
    };
  }, [ads, vendorOrdersData?.data]);

  // Update ad status mutation
  const updateAdStatusMutation = useUpdateP2PAdStatus({
    onSuccess: () => {
      showSuccessAlert('Success', 'Ad status updated successfully', () => {
        queryClient.invalidateQueries({ queryKey: ['p2p', 'vendor', 'ads'] });
      });
    },
    onError: (error: any) => {
      showErrorAlert('Error', error?.message || 'Failed to update ad status');
    },
  });

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([refetchAds(), refetchOrders()]);
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
        <ThemedText style={styles.headerTitle}>My Ads</ThemedText>
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
                <ThemedText style={styles.summaryAmountMain}>
                  {isLoadingAds ? '...' : summaryStats.totalValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </ThemedText>
                <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.summaryUSD}>
              {isLoadingAds || isLoadingOrders ? '...' : `${summaryStats.totalOrders} Orders`}
            </ThemedText>
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
                <ThemedText style={styles.summaryAmountMainWhite}>
                  {isLoadingAds || isLoadingOrders ? '...' : summaryStats.completionRate}
                </ThemedText>
                <ThemedText style={styles.summaryAmountCurrencyWhite}>%</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.summaryUSDWhite}>
              {isLoadingAds || isLoadingOrders ? '...' : `${summaryStats.completedOrdersCount} Orders`}
            </ThemedText>
          </View>
        </View>

        {/* Buy/Sell Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === 'Buy' && styles.toggleButtonActive,
              ]}
              onPress={() => setActiveTab('Buy')}
            >
              <ThemedText
                style={[
                  styles.toggleButtonText,
                  activeTab === 'Buy' && styles.toggleButtonTextActive,
                ]}
              >
                Buy
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === 'Sell' && styles.toggleButtonActive,
              ]}
              onPress={() => setActiveTab('Sell')}
            >
              <ThemedText
                style={[
                  styles.toggleButtonText,
                  activeTab === 'Sell' && styles.toggleButtonTextActive,
                ]}
              >
                Sell
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Ads Section Header */}

        <View style={{ backgroundColor: '#FFFFFF08', marginHorizontal: 15 * SCALE, borderRadius: 15 * SCALE, borderWidth: 0.3, borderColor: '#FFFFFF33', paddingBottom:50 }}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>My Ads</ThemedText>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => {
                if (activeTab === 'Buy') {
                  (navigation as any).navigate('Settings', {
                    screen: 'CreateBuyAd',
                  });
                } else {
                  (navigation as any).navigate('Settings', {
                    screen: 'CreateSellAd',
                  });
                }
              }}
            >
              <View style={{ backgroundColor: '#A9EF45', borderRadius: 100, padding: 10, width: 50 * SCALE, height: 50 * SCALE, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="plus" size={22 * SCALE} color="#A9EF45" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Ad Cards List */}
          {isLoadingAds ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                Loading ads...
              </ThemedText>
            </View>
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
              <View key={ad.id} style={styles.adCardWrapper}>
                <LinearGradient
                  colors={['rgba(48, 65, 149, 0.1)', 'rgba(95, 131, 187, 0.1)', 'rgba(160, 163, 237, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.adCardGradient}
                >
                  <LinearGradient
                    colors={['#FFFFFF0D', '#1E3A5F1A', '#FFFFFF0D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.adCard}
                  >
                {/* Ad Header */}
                <View style={styles.adHeader}>
                  <View style={styles.adHeaderLeft}>
                    <Image
                      source={ad.userAvatar}
                      style={styles.adAvatar}
                      resizeMode="cover"
                    />
                    <View style={styles.adHeaderText}>
                      <ThemedText style={styles.adType}>{ad.asset} {ad.type} AD</ThemedText>
                      <ThemedText style={styles.adStatus}>{ad.status}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.adStateTag}>
                    <Image
                      source={require('../../../assets/Hourglass.png')}
                      style={[{ marginBottom: -1, width: 10, height: 10 }]}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.adStateText}>{ad.adState}</ThemedText>
                  </View>
                </View>

                {/* Performance Metrics */}
                <View style={styles.performanceMetrics}>
                  <View style={styles.metricRow}>
                  <Image
                      source={require('../../../assets/File.png')}
                      style={[{ marginBottom: -1, width: 10, height: 10 }]}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.metricText}>
                      Orders Received : {ad.ordersReceived.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.metricRow}>
                  <Image
                      source={require('../../../assets/Vector (41).png')}
                      style={[{ marginBottom: -1, width: 10, height: 10 }]}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.metricText}>Response Time : {ad.responseTime}</ThemedText>
                  </View>
                  <View style={styles.metricRow}>
                  <Image
                      source={require('../../../assets/User (1).png')}
                      style={[{ marginBottom: -1, width: 10, height: 10 }]}
                      resizeMode="cover"
                    />
                    <ThemedText style={styles.metricText}>Score : {ad.score}</ThemedText>
                  </View>
                </View>

                {/* Ad Specifications */}
                <View style={styles.adSpecs}>
                  <View style={[styles.specRow, styles.specRowFirst]}>
                    <ThemedText style={styles.specLabel}>Available Quantity</ThemedText>
                    <ThemedText style={styles.specValue}>{ad.quantity}</ThemedText>
                  </View>
                  <View style={styles.specRow}>
                    <ThemedText style={styles.specLabel}>Limits</ThemedText>
                    <ThemedText style={styles.specValue}>{ad.limits}</ThemedText>
                  </View>
                  <View style={[styles.specRow, styles.specRowLast]}>
                    <ThemedText style={styles.specLabel}>Payment Methods</ThemedText>
                    <ThemedText style={styles.specValue}>
                      {ad.paymentMethods.join(', ')}
                    </ThemedText>
                  </View>
                </View>

                {/* Price and Action Buttons */}
                <View style={styles.adFooter}>
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.priceLabel}>Price / 1 {ad.asset}</ThemedText>
                    <ThemedText style={styles.priceValue}>{ad.price} NGN</ThemedText>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.newOrderButton}>
                      <ThemedText style={styles.newOrderButtonText}>New Order</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.openAdButton}
                      onPress={() => {
                        // Use the numeric ID directly (backend expects integer but receives string from URL)
                        // The backend should convert the route parameter string to number, but we ensure it's valid
                        (navigation as any).navigate('Settings', {
                          screen: 'AdDetails',
                          params: { adId: String(ad.numericId) },
                        });
                      }}
                    >
                      <ThemedText style={styles.openAdButtonText}>Open AD</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                  </LinearGradient>
                </LinearGradient>
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: SCREEN_WIDTH * 0.047 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center' }}>
                No {activeTab.toLowerCase()} ads found. Create one to get started.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default MyAdsScreen;

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
  toggleContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#1A202C',
    borderRadius: 100,
    borderWidth: 0.3,
    borderColor: '#2D3748',
    padding: 3 * SCALE,
    position: 'relative',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    zIndex: 1,
  },
  toggleButtonActive: {
    backgroundColor: '#A9EF45',
  },
  toggleButtonText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#CBD5E0',
  },
  toggleButtonTextActive: {
    color: '#2D3748',
    fontWeight: '400',
  },
  iconCircle: {
    width: 25 * 1,
    height: 25 * 1,
    borderRadius: 100 * SCALE,
    backgroundColor: '#000',
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
  fab: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    borderRadius: 25 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  adCardWrapper: {
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 15 * SCALE,
    borderRadius: 15 * SCALE,
    overflow: 'hidden',
    shadowColor: '#A9EF45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adCardGradient: {
    borderRadius: 15 * SCALE,
    padding: 2,
  },
  adCard: {
    borderWidth: 1,
    borderColor: 'rgba(169, 239, 69, 0.3)',
    borderRadius: 13 * SCALE,
    padding: 15 * SCALE,
    backgroundColor: 'rgba(2, 12, 25, 0.95)',
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
    fontSize: 10 * 1,
    fontWeight: '500',
    color: '#A9EF45',
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
    // marginBottom: 5 * SCALE,
    marginTop:5,
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
  metricText: {
    fontSize: 9 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  adSpecs: {
    marginBottom: 15 * SCALE,
    marginTop: 15 * SCALE,
    borderRadius: 7 * SCALE,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(169, 239, 69, 0.2)',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12 * SCALE,
    paddingTop: 12 * SCALE,
    paddingHorizontal: 12 * SCALE,
    backgroundColor: 'rgba(30, 58, 95, 0.15)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(169, 239, 69, 0.15)',
  },
  specRowFirst: {
    borderTopLeftRadius: 7 * SCALE,
    borderTopRightRadius: 7 * SCALE,
  },
  specRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 7 * SCALE,
    borderBottomRightRadius: 7 * SCALE,
  },
  specLabel: {
    fontSize: 11 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  specValue: {
    fontSize: 11 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10 * SCALE,
  },
  adFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    // paddingTop: 30* SCALE,
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
    color: '#A9EF45',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8 * SCALE,
  },
  newOrderButton: {
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.5,
    justifyContent:'center',

    borderColor: '#A9EF45',
  },
  newOrderButtonText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  openAdButton: {
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 12 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#A9EF45',
    justifyContent:'center',
  },
  openAdButtonText: {
    fontSize: 8 * 1,
    fontWeight: '400',
    color: '#000',
  },
  bottomSpacer: {
    height: 20 * SCALE,
  },
});

