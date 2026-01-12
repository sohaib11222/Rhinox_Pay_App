import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetP2POrders } from '../../../queries/p2p.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1; // Reduced scale for big phone design

// Types for API integration
interface P2POrder {
    id: string;
    userName: string;
    userAvatar: any;
    type: 'Buy' | 'Sell';
    asset: string;
    status: 'Active' | 'Completed' | 'Cancelled';
    amount: string;
    assetAmount: string;
    date: string;
}

interface P2PMenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    iconBackground: string;
}

const P2PProfile = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'All' | 'Buy' | 'Sell'>('All');
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(1);
  const [showAdTypeModal, setShowAdTypeModal] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data to match the expected format
  const COUNTRIES = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      // Fallback to default countries
      return [
        { id: 1, name: 'Nigeria', code: 'NG', flag: '🇳🇬', flagImage: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 2, name: 'Botswana', code: 'BW', flag: '🇧🇼', flagImage: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 3, name: 'Ghana', code: 'GH', flag: '🇬🇭', flagImage: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 4, name: 'Kenya', code: 'KE', flag: '🇰🇪', flagImage: require('../../../assets/login/south-africa-flag.png'), flagUrl: null },
        { id: 5, name: 'South Africa', code: 'ZA', flag: '🇿🇦', flagImage: require('../../../assets/login/south-africa-flag.png'), flagUrl: null },
        { id: 6, name: 'Tanzania', code: 'TZ', flag: '🇹🇿', flagImage: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
        { id: 7, name: 'Uganda', code: 'UG', flag: '🇺🇬', flagImage: require('../../../assets/login/nigeria-flag.png'), flagUrl: null },
      ];
    }
    return countriesData.data.map((country: any, index: number) => {
      // Check if flag is a URL path (starts with /) or an emoji
      const flagValue = country.flag || '';
      const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
      const flagUrl = isFlagUrl 
        ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
        : null;
      const flagEmoji = isFlagUrl ? null : (flagValue || '🏳️');
      
      // Default flag image fallback
      const defaultFlagImage = require('../../../assets/login/nigeria-flag.png');
      
      return {
        id: country.id || index + 1,
        name: country.name || '',
        code: country.code || '',
        flag: flagEmoji,
        flagUrl: flagUrl,
        flagImage: defaultFlagImage, // Fallback for local images
      };
    });
  }, [countriesData?.data]);

    // Mock data - Replace with API calls
    const menuItems: P2PMenuItem[] = [
        {
            id: 'my-ads',
            title: 'My Ads',
            subtitle: 'Manage your ads',
            icon: require('../../../assets/profile-2user.png'),
            iconBackground: '#A9EF45',
        },
        {
            id: 'payment-settings',
            title: 'Payment Settings',
            subtitle: 'Manage your payment settings',
            icon: require('../../../assets/wallet-p2p.png'),
            iconBackground: '#008000',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            subtitle: 'View Notifications',
            icon: require('../../../assets/Vector.png'),
            iconBackground: '#FF0000',
        },
    ];

    // Fetch P2P orders from API
    const {
        data: ordersData,
        isLoading: isLoadingOrders,
        refetch: refetchOrders,
    } = useGetP2POrders();

    // Transform orders from API to match UI format
    const orders: P2POrder[] = useMemo(() => {
        if (!ordersData?.data || !Array.isArray(ordersData.data)) {
            return [];
        }

        return ordersData.data.map((order: any) => {
            // Determine the other party (vendor if user is buyer, buyer if user is vendor)
            const otherParty = order.userAction === 'buy' 
                ? (order.vendor || {}) 
                : (order.buyer || {});
            
            // Map userAction to type
            const type: 'Buy' | 'Sell' = order.userAction === 'buy' ? 'Buy' : 'Sell';
            
            // Map API status to UI status
            let status: 'Active' | 'Completed' | 'Cancelled' = 'Active';
            if (order.status === 'completed') {
                status = 'Completed';
            } else if (order.status === 'cancelled') {
                status = 'Cancelled';
            } else {
                status = 'Active'; // pending, awaiting_payment, awaiting_coin_release, etc.
            }

            // Format amounts
            const fiatAmount = order.fiatAmount 
                ? `${order.fiatCurrency || 'NGN'}${parseFloat(order.fiatAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'N0.00';
            const cryptoAmount = order.cryptoAmount 
                ? `${parseFloat(order.cryptoAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${order.cryptoCurrency || 'USDT'}`
                : '0 USDT';

            // Format date
            const date = order.createdAt 
                ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A';

            // Get user name
            const userName = otherParty.firstName && otherParty.lastName
                ? `${otherParty.firstName} ${otherParty.lastName}`
                : otherParty.name || 'Unknown User';

            return {
                id: String(order.id),
                userName: userName,
                userAvatar: require('../../../assets/login/memoji.png'), // Default avatar
                type: type,
                asset: order.cryptoCurrency || 'USDT',
                status: status,
                amount: fiatAmount,
                assetAmount: cryptoAmount,
                date: date,
            };
        });
    }, [ordersData?.data]);

    // Hide bottom tab bar when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const parent = navigation.getParent();
            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: 'none' },
                });
            }
            return () => {
                // Restore tab bar when leaving this screen
                if (parent) {
                    parent.setOptions({
                        tabBarStyle: {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderTopWidth: 0,
                            height: 75 * 0.8,
                            paddingBottom: 10,
                            paddingTop: 0,
                            position: 'absolute',
                            bottom: 26 * 0.8,
                            borderRadius: 100,
                            overflow: 'hidden',
                            elevation: 0,
                            width: SCREEN_WIDTH * 0.86,
                            marginLeft: 30,
                            shadowOpacity: 0,
                        },
                    });
                }
            };
        }, [navigation])
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return '#A9EF45';
            case 'Completed':
                return '#008000';
            case 'Cancelled':
                return 'rgba(255, 255, 255, 0.5)';
            default:
                return '#FFFFFF';
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        
        // Filter by type (All, Buy, Sell)
        if (selectedTab !== 'All') {
            filtered = filtered.filter(order => order.type === selectedTab);
        }
        
        // Filter by status (All, Active, Completed, Cancelled)
        if (selectedStatusFilter !== 'All') {
            filtered = filtered.filter(order => order.status === selectedStatusFilter);
        }
        
        return filtered;
    }, [orders, selectedTab, selectedStatusFilter]);

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
      await refetchOrders();
      return Promise.resolve();
    };

    const { refreshing, onRefresh } = usePullToRefresh({
      onRefresh: handleRefresh,
      refreshDelay: 2000,
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#44341C" />

            {/* Top Section with Linear Gradient Background */}
            <LinearGradient
                colors={['#44341C', '#343115', '#3A4617', '#1D1A0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topSectionGradient}
            >
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={24 * SCALE}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitle}>P2P</ThemedText>
                    </View>
          <TouchableOpacity 
            style={styles.countrySelector}
            onPress={() => {
              // Initialize selectedCountryId based on current selectedCountry
              const currentCountry = COUNTRIES.find((c: any) => c.name === selectedCountry);
              if (currentCountry) {
                setSelectedCountryId(currentCountry.id);
              }
              setShowCountryModal(true);
            }}
          >
            {(() => {
              const currentCountry = COUNTRIES.find((c: any) => c.name === selectedCountry);
              const flagSource = currentCountry?.flagUrl 
                ? { uri: currentCountry.flagUrl }
                : (currentCountry?.flagImage || require('../../../assets/login/nigeria-flag.png'));
              
              return (
                <Image
                  source={flagSource}
                  style={styles.countryFlag}
                  resizeMode="cover"
                />
              );
            })()}
            <ThemedText style={styles.countryText}>{selectedCountry}</ThemedText>
            <MaterialCommunityIcons
              name="chevron-down"
              size={14 * SCALE}
              color="#FFFFFF"
            />
          </TouchableOpacity>
                </View>

                {/* P2P Market Section */}
                <View style={styles.marketSection}>
                    <View style={styles.marketIconContainer}>
                        <View style={styles.marketIconCircle}>
                            <Image
                                source={require('../../../assets/profile-2user.png')}
                                style={styles.marketIcon}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                    <ThemedText style={styles.marketTitle}>P2P Market</ThemedText>
                    <ThemedText style={styles.marketSubtitle}>
                        Trade your assets directly with other users
                    </ThemedText>
                </View>

                {/* Buy/Sell Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, styles.toggleButtonLeft]}
                        onPress={() => {
                            (navigation as any).navigate('Settings', {
                                screen: 'P2PFund',
                                params: { initialTab: 'Buy' },
                            });
                        }}
                    >
                        <MaterialCommunityIcons
                            name="plus-circle"
                            size={17 * SCALE}
                            color="#FFFFFF"
                        />
                        <ThemedText style={styles.toggleButtonText}>Buy</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, styles.toggleButtonRight]}
                        onPress={() => {
                            (navigation as any).navigate('Tabs', {
                                screen: 'SendFund',
                                params: {
                                    screen: 'P2PFund',
                                    params: {
                                        initialTab: 'Sell',
                                    },
                                },
                            });
                        }}
                    >
                        <MaterialCommunityIcons
                            name="minus-circle"
                            size={17 * SCALE}
                            color="#FFFFFF"
                        />
                        <ThemedText style={styles.toggleButtonText}>Sell</ThemedText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Main Card - Fixed, Non-scrollable */}
            <View style={styles.mainCard}>
                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                index < menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={() => {
                                if (item.id === 'payment-settings') {
                                    (navigation as any).navigate('Settings', {
                                        screen: 'PaymentSettings',
                                    });
                                } else if (item.id === 'my-ads') {
                                    (navigation as any).navigate('Settings', {
                                        screen: 'MyAdsScreen',
                                    });
                                } else if (item.id === 'notifications') {
                                    (navigation as any).navigate('Home', {
                                        screen: 'Notifications',
                                    });
                                } else {
                                    console.log('Pressed:', item.id);
                                }
                            }}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: item.iconBackground }]}>
                                <Image
                                    source={item.icon}
                                    style={styles.menuIcon}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
                                <View style={styles.menuSubtitleContainer}>
                                    <ThemedText style={styles.menuSubtitle}>{item.subtitle}</ThemedText>
                                    {item.id === 'my-ads' && (
                                        <View style={styles.notificationDot} />
                                    )}
                                </View>
                            </View>
                            {/* {item.id === 'my-ads' && (
                                <Image
                                    source={require('../../../assets/profile-2user.png')}
                                    style={styles.menuIconSmall}
                                    resizeMode="contain"
                                />
                            )} */}
                            {/* {item.id === 'payment-settings' && (
                                <Image
                                    source={require('../../../assets/send-2.png')}
                                    style={styles.menuIconSmall}
                                    resizeMode="contain"
                                />
                            )} */}
                            {/* {item.id === 'notifications' && (
                                <MaterialCommunityIcons
                                    name="bell"
                                    size={24 * SCALE}
                                    style={styles.menuIconSmall}
                                    color="#FFFFFF"
                                />
                            )} */}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* My Orders Section */}
                <ThemedText style={styles.ordersTitle}>My Orders</ThemedText>

                {/* Order Filter Tabs */}
                <View style={styles.filterTabsContainer}>
                    <View style={styles.filterTabs}>
                        <TouchableOpacity
                            style={[
                                styles.filterTab,
                                selectedTab === 'All' && styles.filterTabActive,
                            ]}
                            onPress={() => setSelectedTab('All')}
                        >
                            <ThemedText
                                style={[
                                    styles.filterTabText,
                                    selectedTab === 'All' && styles.filterTabTextActive,
                                ]}
                            >
                                All
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterTab,
                                selectedTab === 'Buy' && styles.filterTabActive,
                            ]}
                            onPress={() => setSelectedTab('Buy')}
                        >
                            <ThemedText
                                style={[
                                    styles.filterTabText,
                                    selectedTab === 'Buy' && styles.filterTabTextActive,
                                ]}
                            >
                                Buy
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterTab,
                                selectedTab === 'Sell' && styles.filterTabActive,
                            ]}
                            onPress={() => setSelectedTab('Sell')}
                        >
                            <ThemedText
                                style={[
                                    styles.filterTabText,
                                    selectedTab === 'Sell' && styles.filterTabTextActive,
                                ]}
                            >
                                Sell
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Dropdown */}
                <View style={styles.filterDropdownWrapper}>
                    <View style={styles.filterDropdownContainer}>
                        <TouchableOpacity 
                            style={styles.filterDropdown}
                            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                            activeOpacity={0.7}
                        >
                            <ThemedText style={styles.filterDropdownText}>{selectedStatusFilter}</ThemedText>
                            <View style={styles.filterDropdownIcons}>
                                <Image
                                    source={require('../../../assets/Vector (35).png')}
                                    style={styles.filterIcon}
                                    resizeMode="cover"
                                />
                                <MaterialCommunityIcons
                                    name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                                    size={14 * SCALE}
                                    color="#FFFFFF"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Dropdown Menu */}
                    {showStatusDropdown && (
                        <View style={styles.dropdownMenu}>
                            {['All', 'Active', 'Completed', 'Cancelled'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.dropdownMenuItem,
                                        selectedStatusFilter === status && styles.dropdownMenuItemActive
                                    ]}
                                    onPress={() => {
                                        setSelectedStatusFilter(status as 'All' | 'Active' | 'Completed' | 'Cancelled');
                                        setShowStatusDropdown(false);
                                    }}
                                >
                                    <ThemedText
                                        style={[
                                            styles.dropdownMenuItemText,
                                            selectedStatusFilter === status && styles.dropdownMenuItemTextActive
                                        ]}
                                    >
                                        {status}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Orders List - Scrollable inside main card */}
                <ScrollView
                    style={styles.ordersScrollView}
                    contentContainerStyle={styles.ordersListContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
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
                    {isLoadingOrders ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ActivityIndicator size="small" color="#A9EF45" />
                            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                                Loading orders...
                            </ThemedText>
                        </View>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <View key={order.id} style={styles.orderItem}>
                                <Image
                                    source={order.userAvatar}
                                    style={styles.orderAvatar}
                                    resizeMode="cover"
                                />
                                <View style={styles.orderDetails}>
                                    <ThemedText style={styles.orderUserName}>{order.userName}</ThemedText>
                                    <ThemedText style={styles.orderDescription}>
                                        {order.type} {order.asset}{' '}
                                        <ThemedText style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                                            {order.status}
                                        </ThemedText>
                                    </ThemedText>
                                </View>
                                <View style={styles.orderAmountContainer}>
                                    <ThemedText
                                        style={[
                                            styles.orderAmount,
                                            order.status === 'Completed' && order.type === 'Sell' && styles.orderAmountRed,
                                        ]}
                                    >
                                        {order.amount}
                                        <ThemedText style={styles.orderAssetAmount}>
                                            ({order.assetAmount})
                                        </ThemedText>
                                    </ThemedText>
                                    <ThemedText style={styles.orderDate}>{order.date}</ThemedText>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                                No orders found
                            </ThemedText>
                        </View>
                    )}
                </ScrollView>
            </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setShowAdTypeModal(true);
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={32 * SCALE}
          color="#000000"
        />
      </TouchableOpacity>

      {/* Select Ad Type Modal */}
      <Modal
        visible={showAdTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdTypeModal(false)}
      >
        <View style={styles.adTypeModalOverlay}>
          <View style={styles.adTypeModalContent}>
            <View style={styles.adTypeModalHeader}>
              <ThemedText style={styles.adTypeModalTitle}>Select Ad type</ThemedText>
              <TouchableOpacity onPress={() => setShowAdTypeModal(false)}>
                <View style={styles.adTypeModalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Sell AD Option */}
            <TouchableOpacity
              style={styles.adTypeOption}
              onPress={() => {
                setShowAdTypeModal(false);
                (navigation as any).navigate('Settings', {
                  screen: 'CreateSellAd',
                });
              }}
            >
              <View style={styles.adTypeIconCircle}>
                <Image
                  source={require('../../../assets/sent.png')}
                  style={styles.adTypeIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.adTypeTextContainer}>
                <ThemedText style={styles.adTypeOptionTitle}>Sell AD</ThemedText>
                <ThemedText style={styles.adTypeOptionSubtitle}>Sell tokens to users</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Buy AD Option */}
            <TouchableOpacity
              style={styles.adTypeOption}
              onPress={() => {
                setShowAdTypeModal(false);
                (navigation as any).navigate('Settings', {
                  screen: 'CreateBuyAd',
                });
              }}
            >
              <View style={styles.adTypeIconCircle}>
                <View style={styles.rotatedIconContainer}>
                  <Image
                    source={require('../../../assets/sent.png')}
                    style={[styles.adTypeIcon, { transform: [{ rotate: '180deg' }] }]}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.adTypeTextContainer}>
                <ThemedText style={styles.adTypeOptionTitle}>Buy AD</ThemedText>
                <ThemedText style={styles.adTypeOptionSubtitle}>Buy tokens from users</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                  Loading countries...
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {COUNTRIES.map((c) => {
                  const flagSource = c.flagUrl 
                    ? { uri: c.flagUrl }
                    : (c.flagImage || require('../../../assets/login/nigeria-flag.png'));
                  
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountryId(c.id);
                      }}
                    >
                      <Image
                        source={flagSource}
                        style={styles.countryFlagModal}
                        resizeMode="cover"
                      />
                      <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={selectedCountryId === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={selectedCountryId === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => {
                if (selectedCountryId) {
                  const selectedCountryData = COUNTRIES.find((c: any) => c.id === selectedCountryId);
                  if (selectedCountryData) {
                    setSelectedCountry(selectedCountryData.name);
                  }
                }
                setShowCountryModal(false);
              }}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        position: 'relative',
    },
    topSectionGradient: {
        paddingTop: 30* SCALE,
        paddingBottom: 20 * SCALE,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        paddingBottom: 20 * SCALE,
        marginTop: 0,
    },
    backButton: {
        marginRight: 12 * SCALE,
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
        marginLeft: 80 * SCALE,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.3,
        borderColor: '#6d6d6d',
        borderRadius: 100 * SCALE,
        paddingHorizontal: 7 * SCALE,
        paddingVertical: 6 * SCALE,
        gap: 8 * SCALE,
    },
    countryFlag: {
        width: 36 * SCALE,
        height: 36 * SCALE,
        borderRadius: 18 * SCALE,
    },
    countryText: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    marketSection: {
        alignItems: 'center',
        marginTop: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    marketIconContainer: {
        marginBottom: 12 * SCALE,
    },
    marketIconCircle: {
        width: 86 * SCALE,
        height: 86 * SCALE,
        borderRadius: 43 * SCALE,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    marketIcon: {
        width: 48 * SCALE,
        height: 48 * SCALE,
        tintColor:'#000'
    },
    marketTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    marketSubtitle: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        paddingHorizontal: SCREEN_WIDTH * 0.1,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18 * SCALE,
        paddingBottom: 20 * SCALE,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.3,
        borderColor: '#6d6d6d',
        borderRadius: 100 * SCALE,
        paddingHorizontal: 20 * SCALE,
        paddingVertical: 17 * SCALE,
        gap: 7 * SCALE,
        minWidth: 146 * SCALE,
        justifyContent: 'center',
    },
    toggleButtonLeft: {
        // Left button styling
    },
    toggleButtonRight: {
        // Right button styling
    },
    toggleButtonText: {
        fontSize: 14 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    mainCard: {
        flex: 1,
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingTop: 24 * SCALE,
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        overflow: 'hidden',
        marginTop: -20 * SCALE,
    },
    menuContainer: {
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10 * SCALE,
        marginBottom: 20 * SCALE,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF0D',
        paddingVertical: 12 * SCALE,
        paddingHorizontal: 17 * SCALE,
        minHeight: 60 * SCALE,
    },
    menuItemBorder: {
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    menuIconContainer: {
        width: 40 * 1,
        height: 40 * 1,
        borderRadius: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8 * SCALE,
    },
    menuIcon: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        tintColor: '#FFFFFF',
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 8 * SCALE,
    },
    menuTitle: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    menuSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 * SCALE,
    },
    menuSubtitle: {
        fontSize: 8 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    notificationDot: {
        width: 3 * SCALE,
        height: 3 * SCALE,
        borderRadius: 1.5 * SCALE,
        backgroundColor: '#FFFFFF',
        marginLeft: 4 * SCALE,
    },
    menuIconSmall: {
        width: 24 * 1,
        height: 24 * 1,
        tintColor: '#FFFFFF',
    },
    ordersTitle: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 12 * SCALE,
    },
    filterTabsContainer: {
        marginBottom: 12 * SCALE,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100 * SCALE,
        padding: 4 * SCALE,
        gap: 4 * SCALE,
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12 * SCALE,
        borderRadius: 100 * SCALE,
        minHeight: 37 * SCALE,
    },
    filterTabActive: {
        backgroundColor: '#A9EF45',
    },
    filterTabText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.2)',
    },
    filterTabTextActive: {
        color: '#000000',
    },
    filterDropdownWrapper: {
        position: 'relative',
        marginBottom: 3 * SCALE,
        zIndex: 10,
    },
    dropdownMenuOverlay: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8 * SCALE,
    },
    filterDropdownContainer: {
        backgroundColor: '#FFFFFF0D',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 10 * SCALE,
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    filterDropdownText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
        flex: 1,
    },
    filterDropdownIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
    },
    filterIcon: {
        width: 14 * SCALE,
        height: 13 * SCALE,
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8 * SCALE,
        backgroundColor: '#1a2332',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10 * SCALE,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownMenuItem: {
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 12 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    dropdownMenuItemActive: {
        backgroundColor: 'rgba(169, 239, 69, 0.1)',
    },
    dropdownMenuItemText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    dropdownMenuItemTextActive: {
        color: '#A9EF45',
        fontWeight: '500',
    },
    ordersScrollView: {
        flex: 1,
        marginTop: 12 * SCALE,
    },
    ordersListContent: {
        gap: 8 * SCALE,
        paddingBottom: 20 * SCALE,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10 * SCALE,
        padding: 15 * SCALE,
        minHeight: 60 * SCALE,
    },
    orderAvatar: {
        width: 35 * SCALE,
        height: 35 * SCALE,
        borderRadius: 17.5 * SCALE,
        marginRight: 11 * SCALE,
    },
    orderDetails: {
        flex: 1,
        marginRight: 8 * SCALE,
    },
    orderUserName: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    orderDescription: {
        fontSize: 8 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    orderStatus: {
        fontSize: 8 * 1,
        fontWeight: '300',
    },
    orderStatusGreen: {
        color: '#008000',
    },
    orderAmountContainer: {
        alignItems: 'flex-end',
    },
    orderAmount: {
        fontSize: 12 * 1,
        fontWeight: '500',
        color: '#008000',
        marginBottom: 4 * SCALE,
    },
    orderAmountRed: {
        color: '#FF0000',
    },
    orderAssetAmount: {
        fontSize: 12 * SCALE,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    orderDate: {
        fontSize: 8 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
  fab: {
    position: 'absolute',
    bottom: 30 * SCALE,
    right: SCREEN_WIDTH * 0.047,
    width: 80 * 1,
    height: 80 * 1,
    borderRadius: 40 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    padding: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  countryFlagModal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
  // Ad Type Modal Styles
  adTypeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  adTypeModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
  },
  adTypeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
    borderWidth:0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  adTypeModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingBottom: 10 * SCALE,
  },
  adTypeModalCloseCircle: {
    width: 25 * SCALE,
    height: 25 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10 * SCALE,
   

  },
  adTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15 * SCALE,
    marginBottom: 12 * SCALE,
  },
  adTypeIconCircle: {
    width: 48 * SCALE,
    height: 48 * SCALE,
    borderRadius: 24 * SCALE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15 * SCALE,
  },
  adTypeIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  rotatedIconContainer: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  adTypeTextContainer: {
    flex: 1,
  },
  adTypeOptionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  adTypeOptionSubtitle: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default P2PProfile;

