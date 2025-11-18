import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Types for API integration
interface Wallet {
  id: string;
  currencyCode: string;
  currencyName: string;
  balance: string;
  balanceUSD: string;
  flagIcon?: any;
  icon?: any;
  userName: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: any; // Image source
}

interface RecentTransaction {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  date: string;
  status: 'Successful' | 'Pending' | 'Failed';
  icon: any; // Image source
}

interface CryptoAsset {
  id: string;
  name: string;
  ticker: string;
  balance: string;
  balanceUSD: string;
  icon: any;
  trend: 'up' | 'down'; // For line graph color
  trendData: number[]; // Simple data points for line graph
}

const Wallet = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletId] = useState('NGN1234');
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock data - Replace with API calls later
  const fiatWallets: Wallet[] = [
    {
      id: '1',
      currencyCode: 'NGN',
      currencyName: 'Nigerian Naira',
      balance: 'N150,000.00',
      balanceUSD: '$20,000',
      icon: require('../../../assets/login/nigeria-flag.png'),
      userName: 'Qamardeen AbdulMalik',
    },
    {
      id: '2',
      currencyCode: 'KSH',
      currencyName: 'Kenya Shilling',
      balance: 'ksh10,000.00',
      balanceUSD: '$20,000',
      flagIcon: require('../../../assets/login/south-africa-flag.png'), // Using South Africa flag as placeholder for Kenya
      userName: 'Qamardeen AbdulMalik',
    },
  ];

  // Crypto assets for the new design
  const cryptoAssets: CryptoAsset[] = [
    {
      id: '1',
      name: 'Bitcoin',
      ticker: 'BTC',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/bitcoin-coin.png'),
      trend: 'up',
      trendData: [20, 30, 25, 40, 35, 50, 45],
    },
    {
      id: '2',
      name: 'Ethereum',
      ticker: 'ETH',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/usdt-coin.png'),
      trend: 'up',
      trendData: [25, 35, 30, 45, 40, 55, 50],
    },
    {
      id: '3',
      name: 'Solana',
      ticker: 'SOL',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/bitcoin-coin.png'), // Replace with Solana icon
      trend: 'down',
      trendData: [50, 45, 40, 35, 30, 25, 20],
    },
    {
      id: '4',
      name: 'Solana',
      ticker: 'SOL',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/bitcoin-coin.png'), // Replace with Solana icon
      trend: 'down',
      trendData: [50, 45, 40, 35, 30, 25, 20],
    },
    {
      id: '5',
      name: 'Solana',
      ticker: 'SOL',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/bitcoin-coin.png'), // Replace with Solana icon
      trend: 'down',
      trendData: [50, 45, 40, 35, 30, 25, 20],
    },
    {
      id: '6',
      name: 'Solana',
      ticker: 'SOL',
      balance: '0.0001',
      balanceUSD: '$111,250',
      icon: require('../../../assets/login/bitcoin-coin.png'), // Replace with Solana icon
      trend: 'down',
      trendData: [50, 45, 40, 35, 30, 25, 20],
    },
  ];

  // Calculate total crypto balance
  const totalCryptoBalance = cryptoAssets.reduce((sum, asset) => {
    const usdValue = parseFloat(asset.balanceUSD.replace(/[$,]/g, ''));
    return sum + usdValue;
  }, 0);

  const quickActions: QuickAction[] = [
    { id: '1', title: 'Send', icon: require('../../../assets/send-square-white.png') },
    { id: '2', title: 'Fund', icon: require('../../../assets/send-up-white.png') }, // Will be rotated 180deg
    { id: '3', title: 'Withdraw', icon: require('../../../assets/send-up-white.png') },
    { id: '4', title: 'Convert', icon: require('../../../assets/arrow-swap-white.png') },
  ];

  // Crypto wallet quick actions (Deposit, Withdraw, P2P)
  const cryptoQuickActions: QuickAction[] = [
    { id: '1', title: 'Deposit', icon: require('../../../assets/send-2-white.png') },
    { id: '2', title: 'Withdraw', icon: require('../../../assets/send-2-white.png') },
    { id: '3', title: 'P2P', icon: require('../../../assets/profile-2user.png') }, // Replace with P2P icon when available
  ];

  const recentTransactions: RecentTransaction[] = [
    {
      id: '1',
      title: 'Fund Wallet',
      subtitle: 'Successful',
      amount: '+N20,000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/send-2.png'),
    },
    {
      id: '2',
      title: 'NGN to GHC',
      subtitle: 'Successful',
      amount: 'N20,000 to c200',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/arrow-swap.png'),
    },
    {
      id: '3',
      title: 'Fund Wallet',
      subtitle: 'Successful',
      amount: '+N20,000',
      date: 'Oct 15,2025',
      status: 'Successful',
      icon: require('../../../assets/send-2.png'),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Successful':
        return '#008000';
      case 'Pending':
        return '#ffa500';
      case 'Failed':
        return '#ff0000';
      default:
        return '#008000';
    }
  };

  // Individual gradient colors for each fiat wallet
  const fiatGradients: { [key: string]: [string, string] } = {
    '1': ['#1B589E', '#4880C0'], // NGN - Blue gradient
    '2': ['#ffffff', '#ffffff'], // KSH - Deep blue gradient
  };

  // Fallback gradients array for any additional wallets
  const fiatGradientsFallback: [string, string][] = [
    ['#2C5282', '#4A7BA7'], // Navy blue gradient
    ['#2D5F8F', '#4A7BA7'], // Darker blue gradient
  ];

  // Gradient color combinations for crypto wallets
  const cryptoGradients: [string, string][] = [
    ['#213637', '#FFFFFF0D'], // Original dark green gradient
    ['#2D4A3E', '#4A6B5F'], // Green gradient
    ['#3D3A37', '#5A5752'], // Brown/gold gradient
    ['#2A2D3A', '#4A4D5A'], // Dark purple gradient
  ];

  // Individual card styles for each fiat wallet
  const fiatCardStyles: {
    [key: string]: {
      borderRadius: number;
      borderWidth: number;
      borderColor: string;
      padding: number;
      gradientStart: { x: number; y: number };
      gradientEnd: { x: number; y: number };
      color: string;
    }
  } = {
    '1': { // NGN Wallet
      borderRadius: 20 * SCALE,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 18 * SCALE,
      gradientStart: { x: 0, y: 0 },
      gradientEnd: { x: 1, y: 1 },
      color: '#FFFFFF',
    },
    '2': { // KSH Wallet
      borderRadius: 12 * SCALE,
      borderWidth: 0.4,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      padding: 16 * SCALE,
      gradientStart: { x: 1, y: 0 },
      gradientEnd: { x: 0, y: 1 },
      color: '#000000',

    },
  };

  // Get card-specific style for fiat wallets by wallet ID
  const getFiatCardStyle = (walletId: string) => {
    return fiatCardStyles[walletId] || {
      borderRadius: 15 * SCALE,
      borderWidth: 0.3,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: 15 * SCALE,
      gradientStart: { x: 0, y: 0 },
      gradientEnd: { x: 1, y: 1 },
    };
  };

  // Get card-specific styles for crypto wallets
  const getCryptoCardStyle = (index: number) => {
    const variations = [
      {
        borderRadius: 15 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 15 * SCALE,
        gradientStart: { x: 1, y: 0.5 },
        gradientEnd: { x: 0, y: 1 },
      },
      {
        borderRadius: 22 * SCALE,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        padding: 15 * SCALE,
        gradientStart: { x: 0, y: 0 },
        gradientEnd: { x: 1, y: 1 },
      },
      {
        borderRadius: 10 * SCALE,
        borderWidth: 0.4,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        padding: 16 * SCALE,
        gradientStart: { x: 1, y: 0 },
        gradientEnd: { x: 0, y: 1 },
      },
      {
        borderRadius: 25 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        padding: 19 * SCALE,
        gradientStart: { x: 0, y: 1 },
        gradientEnd: { x: 1, y: 0 },
      },
    ];
    return variations[index % variations.length];
  };

  const handleCopyWalletId = async () => {
    await Clipboard.setStringAsync(walletId);
    // TODO: Show toast notification
  };

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollRight = () => {
    if (scrollViewRef.current) {
      const cardWidth = 290 * SCALE + 10 * SCALE;
      const scrollX = cardWidth * (currentWallets.length - 1);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  };

  const currentWallets = activeTab === 'fiat' ? fiatWallets : [];

  // Simple line graph component
  const SimpleLineGraph = ({ data, trend, width = 40, height = 20 }: { data: number[]; trend: 'up' | 'down'; width?: number; height?: number }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((value, index) => {
      const x = index * stepX;
      const normalizedValue = (value - minValue) / range;
      const y = height - (normalizedValue * height);
      return { x, y };
    });

    const path = points.map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ');

    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width, height, position: 'relative' }}>
          {points.map((point, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: point.x - 1,
                top: point.y - 1,
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: trend === 'up' ? '#008000' : '#ff0000',
              }}
            />
          ))}
          {/* Draw lines between points using View elements */}
          {points.slice(1).map((point, index) => {
            const prevPoint = points[index];
            const distance = Math.sqrt(
              Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
            );
            const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);

            return (
              <View
                key={`line-${index}`}
                style={{
                  position: 'absolute',
                  left: prevPoint.x,
                  top: prevPoint.y,
                  width: distance,
                  height: 1,
                  backgroundColor: trend === 'up' ? '#008000' : '#ff0000',
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                }}
              />
            );
          })}
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
            <ThemedText style={styles.headerTitle}>My Wallets</ThemedText>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fiat' && styles.tabActive]}
            onPress={() => setActiveTab('fiat')}
          >
            <MaterialCommunityIcons
              name="bank"
              size={14 * SCALE}
              color={activeTab === 'fiat' ? '#000000' : '#FFFFFF'}
            />
            <ThemedText style={[styles.tabText, activeTab === 'fiat' && styles.tabTextActive]}>
              Fiat Wallet
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'crypto' && styles.tabActive]}
            onPress={() => setActiveTab('crypto')}
          >
            <MaterialCommunityIcons
              name="bitcoin"
              size={14 * SCALE}
              color={activeTab === 'crypto' ? '#000000' : '#FFFFFF'}
            />
            <ThemedText style={[styles.tabText, activeTab === 'crypto' && styles.tabTextActive]}>
              Crypto Wallet
            </ThemedText>
          </TouchableOpacity>
        </View>

        {activeTab === 'fiat' ? (
          <>
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            My {activeTab === 'fiat' ? 'Fiat' : 'Crypto'} Wallets{' '}
            <ThemedText style={styles.sectionCount}>({currentWallets.length})</ThemedText>
          </ThemedText>
          <TouchableOpacity>
            <MaterialCommunityIcons name="magnify" size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Wallet Cards - Horizontal Scrollable */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.walletsScrollContent}
          style={styles.walletsScrollView}
        >
              {currentWallets.map((wallet, index) => {
                const fiatCardStyle = getFiatCardStyle(wallet.id);

                return (
            <View key={wallet.id} style={styles.walletCard}>
                    <LinearGradient
                      colors={fiatGradients[wallet.id] || fiatGradientsFallback[index % fiatGradientsFallback.length]}
                      start={fiatCardStyle!.gradientStart}
                      end={fiatCardStyle!.gradientEnd}
                      style={[
                        styles.walletCardContainer,
                        {
                          borderRadius: fiatCardStyle!.borderRadius,
                          borderWidth: fiatCardStyle!.borderWidth,
                          borderColor: fiatCardStyle!.borderColor,
                          padding: fiatCardStyle!.padding,
                        },
                      ]}
                    >
                  {/* Currency Code - Top Left */}
                      <ThemedText style={[styles.walletCurrencyCodeTop, { color: fiatCardStyle!.color }]}>
                        {wallet.currencyCode}
                      </ThemedText>
                  
                  {/* Flag Icon - Top Right */}
                  <View style={styles.walletIconTopRight}>
                    {wallet.icon ? (
                      <Image
                        source={wallet.icon}
                        style={styles.walletIconTop}
                        resizeMode="cover"
                      />
                    ) : wallet.flagIcon ? (
                      <Image
                        source={wallet.flagIcon}
                        style={styles.walletIconTop}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>

                  {/* Wallet Balance Section */}
                  <View style={styles.walletBalanceSectionFiat}>
                        <ThemedText style={[styles.walletBalanceLabel, { color: fiatCardStyle!.color === '#000000' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                          Wallet balance
                        </ThemedText>
                    {balanceVisible ? (
                      <>
                        <View style={styles.walletBalanceAmountContainer}>
                              <ThemedText fontFamily='Agbalumo-Regular' style={[styles.walletBalancePrefix, { color: fiatCardStyle!.color === '#000000' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                            {wallet.balance.includes('N') ? '₦' : wallet.balance.includes('ksh') ? 'ksh' : ''}
                          </ThemedText>
                              <ThemedText fontFamily='Agbalumo-Regular' style={[styles.walletBalanceMain, { color: fiatCardStyle!.color }]}>
                            {wallet.balance.replace(/[Nksh₦]/g, '').split('.')[0] || '0'}
                          </ThemedText>
                              <ThemedText fontFamily='Agbalumo-Regular' style={[styles.walletBalanceDecimal, { color: fiatCardStyle!.color === '#000000' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                            .{wallet.balance.split('.')[1] || '00'}
                          </ThemedText>
                        </View>
                            {/* <ThemedText style={[styles.walletBalanceUSD, { color: fiatCardStyle!.color === '#000000' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}> */}
                            {/* {wallet.balanceUSD} */}
                            {/* </ThemedText> */}
                      </>
                    ) : (
                      <>
                            <ThemedText style={[styles.walletBalanceAmount, { color: fiatCardStyle!.color }]}>••••••</ThemedText>
                            <ThemedText style={[styles.walletBalanceUSD, { color: fiatCardStyle!.color === '#000000' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>••••</ThemedText>
                      </>
                    )}
                  </View>

                  {/* Eye Icon - Top Right */}
                  <TouchableOpacity
                    style={styles.eyeButtonTopRight}
                    onPress={() => setBalanceVisible(!balanceVisible)}
                  >
                    <MaterialCommunityIcons
                      name={balanceVisible ? 'eye' : 'eye-off'}
                      size={20 * SCALE}
                          color={fiatCardStyle!.color}
                    />
                  </TouchableOpacity>

                  {/* User Name */}
                      <ThemedText style={[styles.walletUserName, { color: fiatCardStyle!.color }]}>
                        {wallet.userName}
                      </ThemedText>
                </LinearGradient>
            </View>
                );
              })}
        </ScrollView>

        {/* Navigation Controls - Left/Right Chevrons */}
            {currentWallets.length > 1 && (
          <View style={styles.navigationControls}>
            <TouchableOpacity style={styles.navButton} onPress={scrollLeft}>
              <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={scrollRight}>
              <MaterialCommunityIcons name="chevron-right" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

            {/* Quick Actions - Only for Fiat */}
        <View style={styles.quickActionsCard}>
          <ThemedText style={styles.quickActionsTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => {
                  if (action.id === '3' && action.title === 'Withdraw') {
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Withdrawal' as never);
                  } else if (action.id === '2' && action.title === 'Fund') {
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Fund' as never);
                  }
                  // TODO: Add navigation for other actions (Send, Convert)
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
          </>
        ) : (
          <>
            {/* Total Balance Card with Overlaid Quick Actions */}
            <View style={styles.totalBalanceCardWrapper}>
              <LinearGradient
                colors={['#1B589E', '#4880C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.totalBalanceCard}
              >
                <TouchableOpacity style={styles.currencyDropdown}>
                  <ThemedText style={styles.currencyDropdownText}>USD</ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.totalBalanceHeader}>
                  <ThemedText style={styles.totalBalanceLabel}>Total Balance</ThemedText>

                </View>
                {balanceVisible ? (
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.totalBalanceAmount}>
                    ${totalCryptoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </ThemedText>
                ) : (
                  <ThemedText style={styles.totalBalanceAmount}>••••••</ThemedText>
                )}

                {/* Overlaid Quick Actions Card */}
                <View style={styles.cryptoOverlaidActionsCard}>
                  {cryptoQuickActions.map((action) => (
                    <TouchableOpacity key={action.id} style={styles.cryptoOverlaidActionButton}>
                      {action.id === '2' ? (
                        <View style={{ transform: [{ rotate: '180deg' }] }}>
                          <Image
                            source={action.icon}
                            style={styles.cryptoOverlaidActionIcon}
                            resizeMode="contain"
                          />
                        </View>
                      ) : (
                        <Image
                          source={action.icon}
                          style={styles.cryptoOverlaidActionIcon}
                          resizeMode="contain"
                        />
                      )}
                      <ThemedText style={styles.cryptoOverlaidActionText}>{action.title}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>

            {/* All Crypto Section */}
            <View style={styles.allCryptoCard}>
              <View style={styles.allCryptoHeader}>
                <ThemedText style={styles.allCryptoTitle}>All Crypto</ThemedText>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="magnify" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.cryptoAssetsList}>
                {cryptoAssets.map((asset) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={styles.cryptoAssetItem}
                    onPress={() => {
                      (navigation as any).navigate('Wallet', {
                        screen: 'CryptoAssetDetails',
                        params: {
                          id: asset.id,
                          name: asset.name,
                          ticker: asset.ticker,
                          balance: asset.balance,
                          balanceUSD: asset.balanceUSD,
                          icon: asset.icon,
                          currentPrice: 187.40, // Will come from API
                          priceChange: 2.5, // Will come from API
                          priceChangePercent: 2.5, // Will come from API
                          graphData: asset.trendData, // Will come from API
                        },
                      });
                    }}
                  >
                    <View style={styles.cryptoAssetIconContainer}>
                      <Image
                        source={asset.icon}
                        style={styles.cryptoAssetIcon}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.cryptoAssetInfo}>
                      <ThemedText style={styles.cryptoAssetName}>{asset.name}</ThemedText>
                      <ThemedText style={styles.cryptoAssetTicker}>{asset.ticker}</ThemedText>
                    </View>
                    <View style={styles.cryptoAssetRight}>
                      <View style={styles.cryptoAssetGraph}>
                        <SimpleLineGraph
                          data={asset.trendData}
                          trend={asset.trend}
                          width={40 * SCALE}
                          height={20 * SCALE}
                        />
                      </View>
                      <View style={styles.cryptoAssetValues}>
                        <ThemedText style={[styles.cryptoAssetBalance, { color: asset.trend === 'up' ? '#008000' : '#ff0000' }]}>
                          {balanceVisible ? asset.balance : '••••'}
                        </ThemedText>
                        <ThemedText style={styles.cryptoAssetUSD}>
                          {balanceVisible ? asset.balanceUSD : '••••'}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Wallet ID Section - Only for Fiat */}
        {activeTab === 'fiat' && (
          <>
        <View style={styles.walletIdCard}>
          <View style={styles.walletIdHeader}>
            <View style={styles.walletIdInfo}>
              <ThemedText style={styles.walletIdTitle}>Wallet ID</ThemedText>
              <ThemedText style={styles.walletIdDescription}>
                Here is your unique wallet id, you can use it to recieve funds from another
                RhinoxPay user or through P2P
              </ThemedText>
            </View>
            <View style={styles.walletIdActions}>
              <TouchableOpacity style={styles.walletIdActionButton}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="qrcode" size={24 * SCALE} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walletIdActionButton}
                onPress={handleCopyWalletId}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="content-copy" size={24 * SCALE} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <ThemedText style={styles.walletIdValue}>{walletId}</ThemedText>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <ThemedText style={styles.recentTransactionsTitle}>Recent Transactions</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                  <View style={styles.transactionIconCircle}>
                        <Image
                          source={transaction.icon}
                          style={{ width: 14 * SCALE, height: 14 * SCALE, tintColor: '#A9EF45' }}
                          resizeMode="contain"
                    />
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
                      {transaction.subtitle}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <ThemedText
                    style={[
                      styles.transactionAmount,
                      transaction.status === 'Successful' && styles.transactionAmountGreen,
                    ]}
                  >
                    {transaction.amount}
                  </ThemedText>
                  <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
          </>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 15 * SCALE,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    padding: 4 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * SCALE,
    borderRadius: 100,
    gap: 6 * SCALE,
  },
  tabActive: {
    backgroundColor: '#A9EF45',
  },
  tabText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  sectionCount: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  walletsScrollView: {
    marginBottom: 2 * SCALE,
  },
  walletsScrollContent: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 10 * SCALE,
  },
  walletCard: {
    width: 290 * SCALE,
    marginRight: 10 * SCALE,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  walletCardContainer: {
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    minHeight: 159 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  walletCardGradient: {
    borderRadius: 15 * SCALE,
    padding: 15 * SCALE,
    minHeight: 159 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  walletCurrencyCodeTop: {
    fontSize: 20 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    position: 'absolute',
    top: 15 * SCALE,
    left: 15 * SCALE,
  },
  walletIconTopRight: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 18 * SCALE,
    position: 'absolute',
    top: 18 * SCALE,
    right: 15 * SCALE,
    overflow: 'hidden',
  },
  walletIconTop: {
    width: '100%',
    height: '100%',
  },
  eyeButtonTopRight: {
    position: 'absolute',
    top: 88 * SCALE,
    right: 15 * SCALE,
    padding: 4 * SCALE,
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10 * SCALE,
  },
  walletIconContainer: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 18 * SCALE,
    marginRight: 12 * SCALE,
    overflow: 'hidden',
  },
  walletIcon: {
    width: '100%',
    height: '100%',
  },
  walletCurrencyInfo: {
    flex: 1,
  },
  walletCurrencyCode: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
  },
  walletCurrencyName: {
    fontSize: 6 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  eyeButton: {
    padding: 4 * SCALE,
  },
  walletDivider: {
    height: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10 * SCALE,
  },
  walletBalanceSection: {
    marginBottom: 10 * SCALE,
  },
  walletBalanceSectionFiat: {
    marginTop: 50 * SCALE,
    marginBottom: 10 * SCALE,
  },
  walletBalanceLabel: {
    fontSize: 6 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4 * SCALE,
  },
  walletBalanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4 * SCALE,
  },
  walletBalancePrefix: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)', // Slightly faded for currency symbol
  },
  walletBalanceMain: {
    fontSize: 30 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  walletBalanceDecimal: {
    fontSize: 30 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  walletBalanceAmount: {
    fontSize: 30 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  walletBalanceUSD: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  walletUserName: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 15 * SCALE,
    left: 15 * SCALE,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10 * SCALE,
    gap: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingVertical: 5 * SCALE,
    paddingHorizontal: 5 * SCALE,
    alignSelf: 'center',
    marginBottom: 25 * SCALE,
  },
  navButton: {
    padding: 4 * SCALE,
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
    gap: 10 * SCALE,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingVertical: 16 * SCALE,
    paddingHorizontal: 10 * SCALE,
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
  walletIdCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  walletIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14 * SCALE,
  },
  walletIdInfo: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  walletIdTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  walletIdDescription: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 10 * SCALE,
  },
  walletIdActions: {
    flexDirection: 'row',
    gap: 8 * SCALE,
  },
  walletIdActionButton: {
    marginLeft: 8 * SCALE,
  },
  walletIdValue: {
    fontSize: 30 * 1,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
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
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  transactionsList: {
    gap: 10 * SCALE,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 8 * 1,
    fontWeight: '300',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 7 * SCALE,
  },
  transactionAmountGreen: {
    color: '#008000',
  },
  transactionDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  // Crypto Wallet Styles
  totalBalanceCardWrapper: {
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    position: 'relative',
  },
  totalBalanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    paddingBottom: 70 * SCALE, // Extra padding at bottom for overlaid card
    minHeight: 137 * SCALE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10 * SCALE,
  },
  totalBalanceLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * SCALE,
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF08',
    padding: 7 * SCALE,
    borderRadius: 100 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  currencyDropdownText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  totalBalanceAmount: {
    fontSize: 30 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cryptoOverlaidActionsCard: {
    position: 'absolute',
    bottom: -65 * SCALE, // Position it to overlap the bottom of the card
    left: SCREEN_WIDTH * 0.13, // 10% margin from left
    right: SCREEN_WIDTH * 0.13, // 10% margin from right
    backgroundColor: '#020C19', // Dark background matching app theme
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30 * 1,
    // padding: 12 * SCALE,
    paddingVertical:14,
    paddingHorizontal:7,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20 * SCALE,
  },
  cryptoOverlaidActionButton: {
    alignItems: 'center',
    flex: 1,
    
  },
  cryptoOverlaidActionIcon: {
    width: 42 * SCALE,
    height: 42 * SCALE,
    marginBottom: 8 * SCALE,
  },
  cryptoOverlaidActionText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  allCryptoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    marginTop: 55 * SCALE,
  },
  allCryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20 * SCALE,
  },
  allCryptoTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cryptoAssetsList: {
    gap: 10 * SCALE,
  },
  cryptoAssetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    padding: 12 * SCALE,
    minHeight: 70 * SCALE,
  },
  cryptoAssetIconContainer: {
    width: 35 * 1,
    height: 35 * 1,
    borderRadius: 20 * SCALE,
    marginRight: 12 * SCALE,
    overflow: 'hidden',
  },
  cryptoAssetIcon: {
    width: '100%',
    height: '100%',
  },
  cryptoAssetInfo: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  cryptoAssetName: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  cryptoAssetTicker: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cryptoAssetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * SCALE,
  },
  cryptoAssetGraph: {
    width: 40 * SCALE,
    height: 20 * SCALE,
  },
  cryptoAssetValues: {
    alignItems: 'flex-end',
    minWidth: 80 * SCALE,
  },
  cryptoAssetBalance: {
    fontSize: 12 * 1,
    fontWeight: '500',
    marginBottom: 4 * SCALE,
  },
  cryptoAssetUSD: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default Wallet;

