import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import TransactionReceiptModal from '../components/TransactionReceiptModal';
import { useGetHomeData, useGetWalletBalances, useGetHomeTransactions } from '../../queries/home.queries';
import { useGetCountries } from '../../queries/country.queries';
import { API_BASE_URL } from '../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9; // Scale factor from Figma to actual device

// Currency mapping based on country code
const getCurrencyFromCountryCode = (countryCode: string): string => {
  const currencyMap: { [key: string]: string } = {
    'NG': 'NGN',
    'KE': 'KES',
    'GH': 'GHS',
    'ZA': 'ZAR',
    'BW': 'BWP',
    'TZ': 'TZS',
    'UG': 'UGX',
  };
  return currencyMap[countryCode] || 'NGN';
};

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬', selected: false },
  { id: 2, name: 'Botswana', flag: '🇧🇼', selected: false },
  { id: 3, name: 'Ghana', flag: '🇬🇭', selected: false },
  { id: 4, name: 'Kenya', flag: '🇰🇪', selected: false },
  { id: 5, name: 'South Africa', flag: '🇿🇦', selected: false },
  { id: 6, name: 'Tanzania', flag: '🇹🇿', selected: false },
  { id: 7, name: 'Uganda', flag: '🇺🇬', selected: false },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [promoBannerIndex, setPromoBannerIndex] = useState(0);
  const promoBannerRef = useRef<FlatList>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Fiat');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [showSendFundsModal, setShowSendFundsModal] = useState(false);
  const [sendFundsWalletType, setSendFundsWalletType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [showSendFundsCountryModal, setShowSendFundsCountryModal] = useState(false);
  const [sendFundsSelectedCountry, setSendFundsSelectedCountry] = useState<string>('NG');
  const [sendFundsSelectedCountryName, setSendFundsSelectedCountryName] = useState('Nigeria');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; balance: string; icon: any } | null>({
    id: '1',
    name: 'Bitcoin',
    balance: '0.00001',
    icon: require('../../assets/CurrencyBtc.png'),
  });
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [fundWalletType, setFundWalletType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [showFundWalletCountryModal, setShowFundWalletCountryModal] = useState(false);
  const [showFundWalletAssetModal, setShowFundWalletAssetModal] = useState(false);
  const [fundWalletAssetSearchTerm, setFundWalletAssetSearchTerm] = useState('');
  const [fundWalletSelectedCountry, setFundWalletSelectedCountry] = useState<string>('NG');
  const [fundWalletSelectedCountryName, setFundWalletSelectedCountryName] = useState('Nigeria');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // API Queries
  const { 
    data: homeData, 
    isLoading: isLoadingHomeData, 
    isError: isErrorHomeData,
    refetch: refetchHomeData 
  } = useGetHomeData();

  const { 
    data: walletsData, 
    isLoading: isLoadingWallets, 
    isError: isErrorWallets,
    refetch: refetchWallets 
  } = useGetWalletBalances();

  // Fetch home transactions
  const { 
    data: transactionsData, 
    isLoading: isLoadingTransactions, 
    isError: isErrorTransactions,
    refetch: refetchTransactions 
  } = useGetHomeTransactions({
    limit: 10,
    fiatLimit: 10,
    cryptoLimit: 10,
  });

  // Fetch countries for country modal
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountries({
    queryKey: ['countries'],
  });
  const countries = countriesData?.data || [];

  // Extract data from API responses
  const homeDataResponse = homeData?.data;
  const user = homeDataResponse?.user;
  const fiatWalletsFromAPI = homeDataResponse?.wallets || [];
  const cryptoWalletsFromAPI = homeDataResponse?.cryptoWallets || [];
  // Combine wallets from both sources - use active wallets only
  const allFiatWallets = fiatWalletsFromAPI.filter((w: any) => w.isActive !== false);
  const allCryptoWallets = cryptoWalletsFromAPI.filter((w: any) => w.active !== false);
  const allWallets = [...allFiatWallets, ...allCryptoWallets];
  const wallets = walletsData?.data || allWallets;

  // Filter wallets based on selected country
  const filteredWallets = useMemo(() => {
    if (!selectedCountry) {
      // If no country selected, show all wallets
      return allWallets;
    }
    // Filter wallets by country ID
    // Fiat wallets typically have countryId or country.id
    // Crypto wallets don't have country, so show all crypto wallets
    const filteredFiat = allFiatWallets.filter((w: any) => {
      return w.countryId === selectedCountry || 
             w.country?.id === selectedCountry ||
             w.countryId === selectedCountry;
    });
    // Always show crypto wallets regardless of country selection
    return [...filteredFiat, ...allCryptoWallets];
  }, [allWallets, allFiatWallets, allCryptoWallets, selectedCountry]);
  const totalBalance = homeDataResponse?.totalBalance || '0.00';
  const activeWalletsCount = homeDataResponse?.activeWalletsCount || 0;
  const activeCryptoWalletsCount = homeDataResponse?.activeCryptoWalletsCount || 0;
  const recentTransactionsCount = homeDataResponse?.recentTransactionsCount || 0;

  // Calculate Fiat and Crypto balances from wallets
  const fiatWallets = allFiatWallets;
  const cryptoWallets = allCryptoWallets;
  
  const fiatTotal = fiatWallets.reduce((sum: number, w: any) => sum + parseFloat(w.balance || '0'), 0);
  const cryptoTotal = cryptoWallets.reduce((sum: number, w: any) => sum + parseFloat(w.balance || '0'), 0);

  // Get currency name mapping
  const getCurrencyName = (currency: string, wallet?: any) => {
    if (wallet?.currencyName) return wallet.currencyName;
    const currencyNames: { [key: string]: string } = {
      'NGN': 'Nigerian Naira',
      'KES': 'Kenya Shilling',
      'GHS': 'Ghana Cedi',
      'ZAR': 'South African Rand',
      'TZS': 'Tanzanian Shilling',
      'UGX': 'Ugandan Shilling',
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether USD',
      'BNB': 'Binance Coin',
      'SOL': 'Solana',
      'DOGE': 'Dogecoin',
      'LTC': 'Litecoin',
      'XRP': 'Ripple',
      'TRX': 'Tron',
      'MATIC': 'Polygon',
      'USDC': 'USD Coin',
    };
    return currencyNames[currency] || currency;
  };

  // Initialize selected country from user's country
  useEffect(() => {
    if (user?.country && !selectedCountry) {
      setSelectedCountry(user.country.id);
      setSelectedCountryName(user.country.name);
    }
    // Initialize fund wallet country
    if (user?.country && !fundWalletSelectedCountry) {
      setFundWalletSelectedCountry(user.country.code || 'NG');
      setFundWalletSelectedCountryName(user.country.name || 'Nigeria');
    }
    // Initialize send funds country
    if (user?.country && !sendFundsSelectedCountry) {
      setSendFundsSelectedCountry(user.country.code || 'NG');
      setSendFundsSelectedCountryName(user.country.name || 'Nigeria');
    }
  }, [user?.country]);

  // Initialize selectedAsset from first available crypto wallet
  useEffect(() => {
    if (cryptoWallets && cryptoWallets.length > 0 && !selectedAsset) {
      const firstWallet = cryptoWallets[0];
      if (firstWallet) {
        setSelectedAsset({
          id: String(firstWallet.id || firstWallet.currency || '1'),
          name: firstWallet.currency || firstWallet.symbol || 'BTC',
          balance: firstWallet.balance || '0',
          icon: require('../../assets/CurrencyBtc.png'),
        });
      }
    }
  }, [cryptoWallets]);

  // Reset search terms when modals close
  useEffect(() => {
    if (!showAssetModal) {
      setAssetSearchTerm('');
    }
  }, [showAssetModal]);

  useEffect(() => {
    if (!showFundWalletAssetModal) {
      setFundWalletAssetSearchTerm('');
    }
  }, [showFundWalletAssetModal]);

  // Format balance for display
  const formatBalance = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatBalanceNoDecimals = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  // Get balance for selected country currency (for Fund Wallet Fiat)
  const fundWalletFiatBalance = useMemo(() => {
    if (isLoadingWallets) return null;
    const currency = getCurrencyFromCountryCode(fundWalletSelectedCountry);
    const wallet = fiatWallets.find((w: any) => w.currency === currency);
    if (wallet) {
      return {
        currency: wallet.currency || currency,
        balance: wallet.balance || '0',
        formatted: `${wallet.currency || currency}${formatBalance(wallet.balance || '0')}`,
      };
    }
    return {
      currency: currency,
      balance: '0',
      formatted: `${currency}0.00`,
    };
  }, [fiatWallets, fundWalletSelectedCountry, isLoadingWallets]);

  // Get balance for selected country currency (for Send Funds Fiat)
  const sendFundsFiatBalance = useMemo(() => {
    if (isLoadingWallets) return null;
    const currency = getCurrencyFromCountryCode(sendFundsSelectedCountry);
    const wallet = fiatWallets.find((w: any) => w.currency === currency);
    if (wallet) {
      return {
        currency: wallet.currency || currency,
        balance: wallet.balance || '0',
        formatted: `${wallet.currency || currency}${formatBalance(wallet.balance || '0')}`,
      };
    }
    return {
      currency: currency,
      balance: '0',
      formatted: `${currency}0.00`,
    };
  }, [fiatWallets, sendFundsSelectedCountry, isLoadingWallets]);

  // Get balance for selected crypto asset (for Fund Wallet Crypto)
  const fundWalletCryptoBalance = useMemo(() => {
    if (isLoadingWallets || !selectedAsset) return null;
    const wallet = cryptoWallets.find((w: any) => 
      w.currency === selectedAsset.name || 
      w.symbol === selectedAsset.name ||
      w.currency?.toUpperCase() === selectedAsset.name.toUpperCase()
    );
    if (wallet) {
      return {
        currency: wallet.currency || selectedAsset.name,
        balance: wallet.balance || '0',
        formatted: `${formatBalanceNoDecimals(wallet.balance || '0')} ${wallet.currency || selectedAsset.name}`,
      };
    }
    return {
      currency: selectedAsset.name,
      balance: selectedAsset.balance || '0',
      formatted: `${selectedAsset.balance || '0'} ${selectedAsset.name}`,
    };
  }, [cryptoWallets, selectedAsset, isLoadingWallets]);

  // Balance data for Fiat and Crypto (from API or fallback)
  const fiatBalance = {
    currency: fiatWallets[0]?.currency || 'N',
    amount: formatBalance(fiatTotal).split('.')[0] + '.',
    decimals: formatBalance(fiatTotal).split('.')[1] || '00',
    fullAmount: formatBalance(fiatTotal),
  };

  const cryptoBalance = {
    currency: cryptoWallets[0]?.currency || 'BTC',
    amount: formatBalanceNoDecimals(cryptoTotal),
    decimals: '',
    fullAmount: formatBalanceNoDecimals(cryptoTotal),
  };

  // Extract transaction data from API
  const transactionsResponse = transactionsData?.data;
  const fiatTransactionsData = transactionsResponse?.fiat;
  const cryptoTransactionsData = transactionsResponse?.crypto;

  // Transaction totals for Fiat and Crypto (from API)
  const fiatTransactionTotal = useMemo(() => {
    if (!fiatTransactionsData?.totalBalance) {
      return { currency: 'N', amount: '0.', decimals: '00' };
    }
    const total = parseFloat(fiatTransactionsData.totalBalance);
    const formatted = formatBalance(total);
    const parts = formatted.split('.');
    return {
      currency: 'N',
      amount: parts[0] + '.',
      decimals: parts[1] || '00',
    };
  }, [fiatTransactionsData?.totalBalance]);

  const cryptoTransactionTotal = useMemo(() => {
    if (!cryptoTransactionsData?.totalBalanceInUSDT) {
      return { currency: 'USDT', amount: '0.00', decimals: '' };
    }
    const total = parseFloat(cryptoTransactionsData.totalBalanceInUSDT);
    const formatted = formatBalance(total);
    return {
      currency: 'USDT',
      amount: formatted,
      decimals: '',
    };
  }, [cryptoTransactionsData?.totalBalanceInUSDT]);

  // Helper function to get icon from transaction type
  const getIconFromType = (type: string): string => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('fund') || typeLower.includes('deposit')) return 'arrow-up-circle';
    if (typeLower.includes('send') || typeLower.includes('withdraw')) return 'arrow-up';
    if (typeLower.includes('bill')) return 'file-document';
    if (typeLower.includes('p2p')) return 'account-group';
    if (typeLower.includes('convert') || typeLower.includes('exchange')) return 'swap-horizontal';
    if (typeLower.includes('crypto')) return 'bitcoin';
    return 'arrow-up-circle';
  };

  // Transform API transactions to UI format
  const allTransactions = useMemo(() => {
    const transactionsList: any[] = [];
    
    // Add fiat transactions
    if (fiatTransactionsData?.recentTransactions && Array.isArray(fiatTransactionsData.recentTransactions)) {
      fiatTransactionsData.recentTransactions.forEach((tx: any) => {
        const date = tx.createdAt 
          ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'N/A';
        
        transactionsList.push({
          id: tx.id,
          title: tx.description || tx.type || 'Transaction',
          subtitle: tx.status || 'Completed',
          amount: tx.formattedAmount || `${tx.isPositive ? '+' : ''}${tx.currencySymbol || ''}${formatBalance(tx.amount)}`,
          date: date,
          icon: getIconFromType(tx.type || tx.description || ''),
          status: tx.status || 'Completed',
          type: 'fiat',
          rawData: tx,
        });
      });
    }
    
    // Add crypto transactions
    if (cryptoTransactionsData?.recentTransactions && Array.isArray(cryptoTransactionsData.recentTransactions)) {
      cryptoTransactionsData.recentTransactions.forEach((tx: any) => {
        const date = tx.createdAt 
          ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'N/A';
        
        transactionsList.push({
          id: tx.id,
          title: tx.description || tx.type || 'Crypto Transaction',
          subtitle: tx.status || 'Completed',
          amount: tx.formattedAmount || `${tx.isPositive ? '+' : ''}${formatBalance(tx.amount)} ${tx.currency}`,
          date: date,
          icon: getIconFromType(tx.type || tx.description || ''),
          status: tx.status || 'Completed',
          type: 'crypto',
          rawData: tx,
        });
      });
    }
    
    // Sort by date (most recent first)
    return transactionsList.sort((a, b) => {
      const dateA = a.rawData?.createdAt ? new Date(a.rawData.createdAt).getTime() : 0;
      const dateB = b.rawData?.createdAt ? new Date(b.rawData.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [fiatTransactionsData?.recentTransactions, cryptoTransactionsData?.recentTransactions]);

  // Filter transactions based on selected filter
  const transactions = useMemo(() => {
    if (!allTransactions || !Array.isArray(allTransactions)) {
      return [];
    }
    if (selectedFilter === 'Fiat') {
      return allTransactions.filter(tx => tx.type === 'fiat').slice(0, 10);
    } else {
      return allTransactions.filter(tx => tx.type === 'crypto').slice(0, 10);
    }
  }, [allTransactions, selectedFilter]);

  // Get recent send transactions for Send Funds modal
  const recentSendTransactions = useMemo(() => {
    // Safety check: ensure allTransactions is an array
    if (!allTransactions || !Array.isArray(allTransactions)) {
      return [];
    }
    
    // Filter fiat transactions to show only send/transfer transactions
    const sendTxs = allTransactions
      .filter((tx: any) => {
        const type = tx.type || '';
        const title = (tx.title || '').toLowerCase();
        const description = (tx.rawData?.description || '').toLowerCase();
        return (
          type === 'fiat' &&
          (title.includes('send') ||
            title.includes('transfer') ||
            description.includes('send') ||
            description.includes('transfer') ||
            tx.rawData?.normalizedType === 'Send Transactions')
        );
      })
      .slice(0, 5); // Show only 5 most recent

    return sendTxs.map((tx: any) => {
      // Extract recipient name from transaction
      const recipientName = 
        tx.rawData?.recipientInfo?.name ||
        tx.rawData?.description?.replace(/Transfer \d+ [A-Z]{3} to /, '') ||
        tx.title?.replace('Transfer ', '').replace(/ \d+ [A-Z]{3} to /, '') ||
        'Unknown User';
      
      // Get currency from transaction
      const currency = tx.rawData?.currency || 
        tx.rawData?.fiatCurrency || 
        getCurrencyFromCountryCode(sendFundsSelectedCountry);

      return {
        id: tx.id,
        name: recipientName,
        currency: currency,
        avatar: require('../../assets/Frame 2398.png'),
      };
    });
  }, [allTransactions, sendFundsSelectedCountry]);

  // Promotional banner images - using complete banner images
  const promoBanners = [
    { id: 1, image: require('../../assets/Frame 89.png') },
    { id: 2, image: require('../../assets/Frame 89.png') },
    { id: 3, image: require('../../assets/Frame 89.png') },
  ];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[HomeScreen] Refreshing data...');
    try {
      await Promise.all([
        refetchHomeData(),
        refetchWallets(),
        refetchTransactions(),
      ]);
      console.log('[HomeScreen] Data refreshed successfully');
    } catch (error) {
      console.error('[HomeScreen] Error refreshing data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Close dropdown when scrolling
  const handleScroll = () => {
    if (showFilterDropdown) {
      setShowFilterDropdown(false);
    }
  };

  // Handle transaction press - map simple transaction data to modal format
  const handleTransactionPress = (transaction: typeof transactions[0]) => {
    // Map the simple transaction data to the format expected by TransactionReceiptModal
    const mappedTransaction = {
      transactionTitle: transaction.title,
      transactionId: `TXN-${transaction.id}-${Date.now()}`,
      dateTime: transaction.date,
      amountNGN: transaction.amount,
      status: transaction.status,
      transactionType: transaction.title.includes('Fund') ? 'fund' as const : 
                      transaction.title.includes('NGN to') || transaction.title.includes('Convert') ? 'convert' as const :
                      'send' as const,
      // Add default values for other fields
      recipientName: transaction.title.includes('Fund') ? 'Bank Account' : 'Recipient',
      transferAmount: transaction.amount,
      fee: '0.00',
      paymentAmount: transaction.amount,
      paymentMethod: transaction.subtitle || 'Bank Transfer',
    };
    
    setSelectedTransaction(mappedTransaction);
    setShowReceiptModal(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={handleScroll}
        scrollEventThrottle={16}
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
        {/* Header Section */}
        <View style={styles.header}>
          {/* Memoji Avatar */}
          <Image
            source={require('../../assets/login/memoji.png')}
            style={styles.avatar}
            resizeMode="cover"
          />

          {/* Greeting Text */}
          <View style={styles.greetingContainer}>
            {isLoadingHomeData ? (
              <ActivityIndicator size="small" color="#A9EF45" />
            ) : (
              <ThemedText style={styles.greetingText}>
                Hi, {user?.firstName || 'User'}
              </ThemedText>
            )}
            <View style={styles.welcomeRow}>
              <ThemedText style={styles.welcomeText}>Welcome</ThemedText>
              <ThemedText style={styles.welcomeEmoji}>👋</ThemedText>
            </View>
          </View>

          {/* Flag Icon - Opens Country Modal */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowCountryModal(true)}
          >
            <View style={styles.iconCircle}>
              {isLoadingHomeData || isLoadingCountries ? (
                <ActivityIndicator size="small" color="#A9EF45" />
              ) : (() => {
                // Show selected country flag if available, otherwise user's country flag
                const selectedCountryData = countries.find((c: any) => c.id === selectedCountry);
                const flagToShow = selectedCountryData?.flag || user?.country?.flag;
                const codeToShow = selectedCountryData?.code || user?.country?.code;
                
                if (flagToShow) {
                  return (
                    <Image
                      source={{ uri: `${API_BASE_URL.replace('/api', '')}${flagToShow}` }}
                      style={[{ marginBottom: -1, width: 26, height: 26 }]}
                      resizeMode="cover"
                    />
                  );
                } else if (codeToShow) {
                  return (
                    <ThemedText style={{ color: '#FFFFFF', fontSize: 16 }}>{codeToShow}</ThemedText>
                  );
                } else {
                  return (
                    <Image
                      source={require('../../assets/login/nigeria-flag.png')}
                      style={[{ marginBottom: -1, width: 26, height: 26 }]}
                      resizeMode="cover"
                    />
                  );
                }
              })()}
            </View>
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              (navigation as any).navigate('Home', {
                screen: 'Notifications',
              });
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="bell" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <ThemedText style={styles.balanceLabel}>Your balance</ThemedText>
          <View style={styles.balanceRow}>
            {isLoadingHomeData ? (
              <ActivityIndicator size="small" color="#A9EF45" style={{ marginRight: 10 }} />
            ) : (
              <ThemedText style={styles.balanceAmount}>
                {selectedFilter === 'Fiat' ? (
                  <>
                    <ThemedText style={styles.balanceCurrency}>{fiatBalance.currency}</ThemedText>
                    {balanceVisible ? fiatBalance.amount : '*******.'}
                    <ThemedText style={styles.balanceDecimals}>{fiatBalance.decimals}</ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText>{balanceVisible ? cryptoBalance.amount : '*******'} </ThemedText>
                    <ThemedText style={styles.balanceCurrency}>{cryptoBalance.currency}</ThemedText>
                  </>
                )}
              </ThemedText>
            )}
            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
              style={styles.eyeButton}
            >
              <MaterialCommunityIcons
                name={balanceVisible ? 'eye' : 'eye-off'}
                size={24 * SCALE}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSendFundsModal(true)}
          >
            <Image
              source={require('../../assets/send-square.png')}
              style={[{ width: 42, height: 42 }]} resizeMode="cover"
            />            <ThemedText style={styles.actionButtonText}>Send</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFundWalletModal(true)}
          >
            <View style={styles.rotatedIcon}>
              <Image
                source={require('../../assets/send-2.png')}
                style={[{ width: 42, height: 42 }]} resizeMode="cover"
              />            </View>
            <ThemedText style={styles.actionButtonText}>Fund</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to Conversion screen in Settings stack
              (navigation as any).navigate('Settings', { screen: 'Conversion' });
            }}
          >
            <Image
              source={require('../../assets/arrow-swap.png')}
              style={[{ width: 42, height: 42 }]}
              resizeMode="cover"
            />            <ThemedText style={styles.actionButtonText}>Convert</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Active Wallets Section */}
        <View style={styles.walletsHeader}>
          <ThemedText style={styles.walletsTitle}>
            Active Wallets{selectedCountryName ? ` - ${selectedCountryName}` : ''}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              (navigation as any).navigate('Wallet', {
                screen: 'WalletMain',
              });
            }}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Wallet Cards - Horizontal Scrollable */}
        {isLoadingWallets && isLoadingHomeData ? (
          <View style={[styles.walletCard, { justifyContent: 'center', alignItems: 'center', minHeight: 139 * SCALE, marginHorizontal: SCREEN_WIDTH * 0.047 }]}>
            <ActivityIndicator size="small" color="#A9EF45" />
          </View>
        ) : filteredWallets.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletCardsScrollContent}
            style={styles.walletCardsScrollView}
          >
            {filteredWallets.map((wallet: any, index: number) => {
              const isFirst = index === 0;
              const isFiat = wallet.type === 'fiat';
              const flagUri = wallet.flag ? `${API_BASE_URL.replace('/api', '')}${wallet.flag}` : null;
              const currencyName = getCurrencyName(wallet.currency, wallet);
              
              const WalletCardContent = (
                <>
                  <View style={styles.walletCardContent}>
                    {isFiat && flagUri ? (
                      <Image
                        source={{ uri: flagUri }}
                        style={styles.walletIcon}
                        resizeMode="cover"
                      />
                    ) : isFiat ? (
                      <Image
                        source={require('../../assets/login/nigeria-flag.png')}
                        style={styles.walletIcon}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={require('../../assets/CurrencyBtc.png')}
                        style={styles.walletIcon}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.walletInfo}>
                      <ThemedText style={[styles.walletCode, !isFirst && styles.walletCodeDark]}>
                        {wallet.currency}
                      </ThemedText>
                      <ThemedText style={[styles.walletName, !isFirst && styles.walletNameDark]}>
                        {currencyName}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.walletDivider} />
                  <ThemedText style={[styles.walletBalanceLabel, !isFirst && styles.walletBalanceLabelDark]}>
                    Balance
                  </ThemedText>
                  <ThemedText style={[styles.walletBalanceAmount, !isFirst && styles.walletBalanceAmountDark]}>
                    {isFiat ? formatBalance(wallet.balance) : formatBalanceNoDecimals(wallet.balance)}
                    <ThemedText style={[styles.walletBalanceCurrency, !isFirst && styles.walletBalanceCurrencyDark]}>
                      {wallet.currency}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={[styles.walletUsdAmount, !isFirst && styles.walletUsdAmountDark]}>
                    ${formatBalance(parseFloat(wallet.balance || '0') * 0.001)} {/* Placeholder USD conversion */}
                  </ThemedText>
                </>
              );

              if (isFirst && isFiat) {
                return (
                  <LinearGradient
                    key={wallet.id}
                    colors={['#4880C0', '#1B589E']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.walletCard}
                  >
                    {WalletCardContent}
                  </LinearGradient>
                );
              } else {
                return (
                  <View key={wallet.id} style={[styles.walletCard, styles.walletCardWhite]}>
                    {WalletCardContent}
                  </View>
                );
              }
            })}
          </ScrollView>
        ) : (
          <View style={[styles.walletCard, { justifyContent: 'center', alignItems: 'center', minHeight: 139 * SCALE, marginHorizontal: SCREEN_WIDTH * 0.047 }]}>
            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {selectedCountry ? `No wallets found for ${selectedCountryName}` : 'No wallets found'}
            </ThemedText>
          </View>
        )}

        {/* Promotional Banner Carousel */}
        <View style={styles.promoBannerContainer}>
          <FlatList
            ref={promoBannerRef}
            data={promoBanners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - (SCREEN_WIDTH * 0.094))
              );
              setPromoBannerIndex(slideIndex);
            }}
            renderItem={({ item }) => (
              <View style={styles.promoBanner}>
                <Image
                  source={item.image}
                  style={styles.promoBannerImage}
                  resizeMode="cover"
                />
              </View>
            )}
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {promoBanners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === promoBannerIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* All Transactions Card */}
        <View style={styles.transactionCard}>
          <View style={styles.transactionCardHeader}>
            <ThemedText style={styles.transactionCardTitle}>All Transactions</ThemedText>
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <ThemedText style={styles.filterButtonText}>{selectedFilter}</ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={12 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <View style={styles.filterDropdown}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedFilter('Fiat');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <ThemedText style={styles.filterOptionText}>Fiat</ThemedText>
                    {selectedFilter === 'Fiat' && (
                      <MaterialCommunityIcons name="check" size={16} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedFilter('Crypto');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <ThemedText style={styles.filterOptionText}>Crypto</ThemedText>
                    {selectedFilter === 'Crypto' && (
                      <MaterialCommunityIcons name="check" size={16} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          {isLoadingTransactions ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : (
            <ThemedText style={styles.transactionTotalAmount}>
              {selectedFilter === 'Fiat' ? (
                <>
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.transactionTotalCurrency}>{fiatTransactionTotal.currency} </ThemedText>
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.transactionTotalAmount}>{fiatTransactionTotal.amount}</ThemedText>
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.transactionTotalDecimals}>{fiatTransactionTotal.decimals}</ThemedText>
                </>
              ) : (
                <>
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.transactionTotalAmount}>{cryptoTransactionTotal.amount} </ThemedText>
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.transactionTotalCurrency}>{cryptoTransactionTotal.currency}</ThemedText>
                </>
              )}
            </ThemedText>
          )}

          {/* Chart Bars */}
          <View style={styles.chartBars}>
            <View style={[styles.chartBar, styles.chartBar1]} />
            <View style={[styles.chartBar, styles.chartBar2]} />
            <View style={[styles.chartBar, styles.chartBar3]} />
            <View style={[styles.chartBar, styles.chartBar4]} />
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot1]} />
              <ThemedText style={styles.legendText}>Send</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot2]} />
              <ThemedText style={styles.legendText}>Deposits</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot3]} />
              <ThemedText style={styles.legendText}>Convert</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot4]} />
              <ThemedText style={styles.legendText}>Bill Payments</ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Transactions Card */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <ThemedText style={styles.recentTransactionsTitle}>Recent Transactions</ThemedText>
            <TouchableOpacity
              onPress={() => {
                (navigation as any).navigate('Transactions', {
                  screen: 'TransactionsList',
                });
              }}
            >
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionIconContainer}>
                  <View style={styles.transactionIconCircle}>
                    <MaterialCommunityIcons
                      name={transaction.icon as any}
                      size={14 * SCALE}
                      color="#A9EF45"
                    />
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionTitle}>{transaction.title}</ThemedText>
                  <View style={styles.transactionStatusRow}>
                    <View style={styles.statusDot} />
                    <ThemedText style={styles.transactionSubtitle}>{transaction.status || transaction.subtitle}</ThemedText>
                  </View>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <ThemedText style={styles.transactionAmount}>{transaction.amount}</ThemedText>
                  <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No recent transactions</ThemedText>
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

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
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(c.id);
                      setSelectedCountryName(c.name);
                      setShowCountryModal(false);
                      // Update wallets on home page based on selected country
                      // No navigation needed - wallets will update automatically
                    }}
                  >
                    {c.flag ? (
                      <Image
                        source={{ uri: `${API_BASE_URL.replace('/api', '')}${c.flag}` }}
                        style={styles.countryFlagImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ThemedText style={styles.countryFlag}>{c.code}</ThemedText>
                    )}
                    <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setShowCountryModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Funds Modal */}
      <Modal
        visible={showSendFundsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendFundsModal(false)}
      >
        <View style={styles.sendFundsModalOverlay}>
          <View style={styles.sendFundsModalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sendFundsModalScrollContent}
            >
              <View style={styles.sendFundsModalHeader}>
                <ThemedText style={styles.sendFundsModalTitle}>Send Funds</ThemedText>
                <TouchableOpacity onPress={() => setShowSendFundsModal(false)}>
                  <View style={styles.sendFundsModalCloseCircle}>
                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Large Icon */}
              <View style={styles.sendFundsIconContainer}>
                <View style={styles.sendFundsLargeIconCircle}>
                  <Image
                    source={require('../../assets/Group 57.png')}
                    style={styles.sendFundsLargeIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Wallet Type Toggle */}
              <View style={styles.sendFundsWalletToggleContainer}>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleLeft, sendFundsWalletType === 'Fiat' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setSendFundsWalletType('Fiat')}
                >
                  <MaterialCommunityIcons name="bank" size={16 * SCALE} color={sendFundsWalletType === 'Fiat' ? '#000000' : '#FFFFFF'} />
                  <ThemedText style={[styles.sendFundsWalletToggleText, sendFundsWalletType === 'Fiat' && styles.sendFundsWalletToggleTextActive]}>Fiat Wallet</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleRight, sendFundsWalletType === 'Crypto' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setSendFundsWalletType('Crypto')}
                >
                  <Image
                    source={require('../../assets/CurrencyBtc.png')}
                    style={styles.sendFundsBitcoinIcon}
                    resizeMode="contain"
                  />
                  <ThemedText style={[styles.sendFundsWalletToggleText, sendFundsWalletType === 'Crypto' && styles.sendFundsWalletToggleTextActive]}>Crypto Wallet</ThemedText>
                </TouchableOpacity>
              </View>

              {sendFundsWalletType === 'Fiat' ? (
                <>
                  {/* Select Currency Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Currency</ThemedText>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <ThemedText style={styles.sendFundsBalanceLabel}>My Balance</ThemedText>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          {isLoadingWallets ? (
                            <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                          ) : (
                            <ThemedText style={styles.sendFundsBalanceAmount}>
                              {sendFundsFiatBalance?.formatted || 'NGN0.00'}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsCountrySelector}
                        onPress={() => setShowSendFundsCountryModal(true)}
                        disabled={isLoadingCountries}
                      >
                        {isLoadingCountries ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (() => {
                          const selectedCountryData = countries.find((c: any) => c.code === sendFundsSelectedCountry);
                          const flagValue = selectedCountryData?.flag || '';
                          const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
                          const flagUrl = isFlagUrl 
                            ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
                            : null;
                          const flagEmoji = isFlagUrl ? null : (flagValue || '🏳️');
                          
                          return (
                            <>
                              {flagUrl ? (
                                <Image
                                  source={{ uri: flagUrl }}
                                  style={styles.sendFundsCountryFlagImage}
                                  resizeMode="cover"
                                />
                              ) : flagEmoji ? (
                                <ThemedText style={styles.sendFundsCountryFlagEmoji}>{flagEmoji}</ThemedText>
                              ) : (
                                <Image
                                  source={require('../../assets/login/nigeria-flag.png')}
                                  style={styles.sendFundsCountryFlagImage}
                                  resizeMode="cover"
                                />
                              )}
                              <ThemedText style={styles.sendFundsCountryNameText}>
                                {sendFundsSelectedCountryName || selectedCountryData?.name || 'Nigeria'}
                              </ThemedText>
                              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                            </>
                          );
                        })()}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Send Options Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Send Options</ThemedText>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Rhinox User Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFunds',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (42).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>RhionX User (User ID)</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Send funds immediately to another rhinoxuser anywhere in Africa.</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Bank Account Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFundsDirect',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (43).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Bank Account</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Send to a user's bank account.</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Mobile Money Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'MobileFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Cardholder.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Mobile Money</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Send via mobile moneyt</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Select Asset Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Crypto</ThemedText>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <ThemedText style={styles.sendFundsBalanceLabel}>My Balance</ThemedText>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          {isLoadingWallets ? (
                            <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                          ) : (
                            <ThemedText style={styles.sendFundsBalanceAmount}>
                              {(() => {
                                if (!selectedAsset) {
                                  // Default to first crypto wallet or BTC
                                  const firstCrypto = cryptoWallets[0];
                                  if (firstCrypto) {
                                    return `${formatBalanceNoDecimals(firstCrypto.balance || '0')} ${firstCrypto.currency || 'BTC'}`;
                                  }
                                  return '0.00000 BTC';
                                }
                                // Find the actual wallet balance from API
                                const wallet = cryptoWallets.find((w: any) => 
                                  w.currency === selectedAsset.name || 
                                  w.symbol === selectedAsset.name ||
                                  w.currency?.toUpperCase() === selectedAsset.name.toUpperCase()
                                );
                                if (wallet) {
                                  return `${formatBalanceNoDecimals(wallet.balance || '0')} ${wallet.currency || selectedAsset.name}`;
                                }
                                // Fallback to selectedAsset balance if wallet not found
                                return `${selectedAsset.balance} ${selectedAsset.name}`;
                              })()}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsAssetSelector}
                        onPress={() => setShowAssetModal(true)}
                      >
                        {selectedAsset ? (
                          <>
                            <Image
                              source={selectedAsset.icon}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <ThemedText style={styles.sendFundsAssetNameText}>{selectedAsset.name}</ThemedText>
                          </>
                        ) : (
                          <>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <ThemedText style={styles.sendFundsAssetNameText}>Bitcoin</ThemedText>
                          </>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Send Options Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Send Options</ThemedText>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Rhinox User Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFundCrypto',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (42).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>RhionX User (User ID)</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Send funds immediately to another rhinoxuser anywhere in Africa.</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Wallet Address Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          // TODO: Navigate to Wallet Address screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Wallet Address</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Send to a user's wallet address</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Recent Section - Only show for Fiat */}
              {sendFundsWalletType === 'Fiat' && (
                <View style={styles.sendFundsRecentSection}>
                  <ThemedText style={styles.sendFundsSectionTitle}>Recent</ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sendFundsRecentScrollContent}
                  >
                    {recentSendTransactions && recentSendTransactions.length > 0 ? (
                      recentSendTransactions.map((contact) => (
                        <View key={contact.id} style={styles.sendFundsRecentItem}>
                          <Image source={contact.avatar} style={styles.sendFundsRecentAvatar} resizeMode="cover" />
                          <ThemedText style={styles.sendFundsRecentName}>{contact.name}</ThemedText>
                          <ThemedText style={styles.sendFundsRecentCurrency}>{contact.currency}</ThemedText>
                        </View>
                      ))
                    ) : (
                      // Fallback to default contacts if no recent transactions
                      [
                        { id: '1', name: 'Adewale', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '2', name: 'Sasha', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '3', name: 'Olayemi', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '4', name: 'Adejoke', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '5', name: 'Tunde', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      ].map((contact) => (
                        <View key={contact.id} style={styles.sendFundsRecentItem}>
                          <Image source={contact.avatar} style={styles.sendFundsRecentAvatar} resizeMode="cover" />
                          <ThemedText style={styles.sendFundsRecentName}>{contact.name}</ThemedText>
                          <ThemedText style={styles.sendFundsRecentCurrency}>{contact.currency}</ThemedText>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Select Asset Modal */}
        <Modal
          visible={showAssetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAssetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Asset</ThemedText>
                <TouchableOpacity onPress={() => {
                  setShowAssetModal(false);
                  setAssetSearchTerm(''); // Reset search when closing
                }}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={assetSearchTerm}
                  onChangeText={setAssetSearchTerm}
                />
              </View>
              <ScrollView style={styles.modalList}>
                {isLoadingWallets ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#A9EF45" />
                    <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                      Loading crypto wallets...
                    </ThemedText>
                  </View>
                ) : (() => {
                  const allWallets = cryptoWallets && cryptoWallets.length > 0 ? cryptoWallets : (walletsData?.data?.crypto || []);
                  const filteredWallets = assetSearchTerm.trim() 
                    ? allWallets.filter((wallet: any) => {
                        const currency = (wallet.currency || wallet.symbol || '').toLowerCase();
                        const searchLower = assetSearchTerm.toLowerCase().trim();
                        return currency.includes(searchLower);
                      })
                    : allWallets;
                  
                  if (filteredWallets.length === 0) {
                    return (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                          {assetSearchTerm.trim() ? 'No assets found' : 'No crypto wallets available'}
                        </ThemedText>
                      </View>
                    );
                  }
                  
                  return filteredWallets.map((wallet: any) => {
                    // Map currency to icon
                    let icon = require('../../assets/CurrencyBtc.png');
                    const currency = wallet.currency || wallet.symbol || '';
                    if (currency === 'BTC' || currency === 'Bitcoin') {
                      icon = require('../../assets/CurrencyBtc.png');
                    } else if (currency === 'USDT' || currency === 'Tether') {
                      icon = require('../../assets/CurrencyBtc.png'); // Use default for now
                    } else if (currency === 'ETH' || currency === 'Ethereum') {
                      icon = require('../../assets/CurrencyBtc.png'); // Use default for now
                    }
                    
                    const asset = {
                      id: String(wallet.id || wallet.currency || wallet.symbol || ''),
                      name: currency,
                      balance: wallet.balance || '0',
                      icon: icon,
                    };
                    const isSelected = selectedAsset?.id === asset.id || selectedAsset?.name === asset.name;
                    return (
                      <TouchableOpacity
                        key={asset.id}
                        style={styles.assetItem}
                        onPress={() => {
                          setSelectedAsset(asset);
                          setShowAssetModal(false);
                          setAssetSearchTerm(''); // Reset search when selecting
                        }}
                      >
                        <Image
                          source={asset.icon}
                          style={styles.assetItemIcon}
                          resizeMode="cover"
                        />
                        <View style={styles.assetItemInfo}>
                          <ThemedText style={styles.assetItemName}>{asset.name}</ThemedText>
                          <ThemedText style={styles.assetItemBalance}>
                            Bal : {formatBalanceNoDecimals(wallet.balance || '0')}
                          </ThemedText>
                        </View>
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={24 * SCALE}
                          color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                        />
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
              <View style={styles.applyButtonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    setShowAssetModal(false);
                    setAssetSearchTerm(''); // Reset search when closing
                  }}
                >
                  <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Country Modal for Send Funds */}
        <Modal
          visible={showSendFundsCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSendFundsCountryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
                <TouchableOpacity onPress={() => setShowSendFundsCountryModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              {isLoadingCountries ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : (
                <ScrollView style={styles.modalList}>
                  {countries.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setSendFundsSelectedCountry(c.code || 'NG');
                        setSendFundsSelectedCountryName(c.name || 'Nigeria');
                      }}
                    >
                      {c.flag ? (
                        <Image
                          source={{ uri: `${API_BASE_URL.replace('/api', '')}${c.flag}` }}
                          style={styles.countryFlagImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlag}>{c.code}</ThemedText>
                      )}
                      <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={sendFundsSelectedCountry === c.code ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={sendFundsSelectedCountry === c.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowSendFundsCountryModal(false)}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* Fund Wallet Modal */}
      <Modal
        visible={showFundWalletModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFundWalletModal(false)}
      >
        <View style={styles.sendFundsModalOverlay}>
          <View style={styles.sendFundsModalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sendFundsModalScrollContent}
            >
              <View style={styles.sendFundsModalHeader}>
                <ThemedText style={styles.sendFundsModalTitle}>Fund Wallet</ThemedText>
                <TouchableOpacity onPress={() => setShowFundWalletModal(false)}>
                  <View style={styles.sendFundsModalCloseCircle}>
                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Large Icon */}
              <View style={styles.sendFundsIconContainer}>
                <View style={styles.sendFundsLargeIconCircle}>
                  <Image
                    source={require('../../assets/Group 57.png')}
                    style={styles.sendFundsLargeIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Wallet Type Toggle */}
              <View style={styles.sendFundsWalletToggleContainer}>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleLeft, fundWalletType === 'Fiat' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setFundWalletType('Fiat')}
                >
                  <MaterialCommunityIcons name="bank" size={16 * SCALE} color={fundWalletType === 'Fiat' ? '#000000' : '#FFFFFF'} />
                  <ThemedText style={[styles.sendFundsWalletToggleText, fundWalletType === 'Fiat' && styles.sendFundsWalletToggleTextActive]}>Fiat Wallet</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleRight, fundWalletType === 'Crypto' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setFundWalletType('Crypto')}
                >
                  <Image
                    source={require('../../assets/CurrencyBtc.png')}
                    style={styles.sendFundsBitcoinIcon}
                    resizeMode="contain"
                  />
                  <ThemedText style={[styles.sendFundsWalletToggleText, fundWalletType === 'Crypto' && styles.sendFundsWalletToggleTextActive]}>Crypto Wallet</ThemedText>
                </TouchableOpacity>
              </View>

              {fundWalletType === 'Fiat' ? (
                <>
                  {/* Select Currency Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Currency</ThemedText>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <ThemedText style={styles.sendFundsBalanceLabel}>My Balance</ThemedText>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          {isLoadingWallets ? (
                            <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                          ) : (
                            <ThemedText style={styles.sendFundsBalanceAmount}>
                              {fundWalletFiatBalance?.formatted || 'NGN0.00'}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsCountrySelector}
                        onPress={() => setShowFundWalletCountryModal(true)}
                        disabled={isLoadingCountries}
                      >
                        {isLoadingCountries ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (() => {
                          const selectedCountryData = countries.find((c: any) => c.code === fundWalletSelectedCountry);
                          const flagValue = selectedCountryData?.flag || '';
                          const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
                          const flagUrl = isFlagUrl 
                            ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
                            : null;
                          const flagEmoji = isFlagUrl ? null : (flagValue || '🏳️');
                          
                          return (
                            <>
                              {flagUrl ? (
                                <Image
                                  source={{ uri: flagUrl }}
                                  style={styles.sendFundsCountryFlagImage}
                                  resizeMode="cover"
                                />
                              ) : flagEmoji ? (
                                <ThemedText style={styles.sendFundsCountryFlagEmoji}>{flagEmoji}</ThemedText>
                              ) : (
                                <Image
                                  source={require('../../assets/login/nigeria-flag.png')}
                                  style={styles.sendFundsCountryFlagImage}
                                  resizeMode="cover"
                                />
                              )}
                              <ThemedText style={styles.sendFundsCountryNameText}>
                                {fundWalletSelectedCountryName || selectedCountryName || 'Nigeria'}
                              </ThemedText>
                              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                            </>
                          );
                        })()}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Select Channel Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Channel</ThemedText>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Bank Transfer Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'FundWallet',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (43).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Bank Transfer</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Fund your wallet via bank transfer</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Mobile Money Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'MobileFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Cardholder.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Mobile Money</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Fund your wallet via mobile moneyt</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Conversion Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', { screen: 'Conversion' });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (44).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Conversion</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Convert funds between your fiat wallets</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Select Asset Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Crypto</ThemedText>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <ThemedText style={styles.sendFundsBalanceLabel}>My Balance</ThemedText>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          {isLoadingWallets ? (
                            <ActivityIndicator size="small" color="#A9EF45" style={{ marginLeft: 8 }} />
                          ) : (
                            <ThemedText style={styles.sendFundsBalanceAmount}>
                              {fundWalletCryptoBalance?.formatted || (selectedAsset ? `${selectedAsset.balance} ${selectedAsset.name}` : '0.00000 BTC')}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsAssetSelector}
                        onPress={() => setShowFundWalletAssetModal(true)}
                      >
                        {selectedAsset ? (
                          <>
                            <Image
                              source={selectedAsset.icon}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <ThemedText style={styles.sendFundsAssetNameText}>{selectedAsset.name}</ThemedText>
                          </>
                        ) : (
                          <>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <ThemedText style={styles.sendFundsAssetNameText}>Bitcoin</ThemedText>
                          </>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Select Channel Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <ThemedText style={styles.sendFundsSectionTitle}>Select Channel</ThemedText>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Crypto Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'CryptoFundDeposit',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>Crypto</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Fund your wallet via crypto</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* P2P Trading Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'P2PFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (42).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <ThemedText style={styles.sendFundsOptionTitle}>P2P Trading</ThemedText>
                            <ThemedText style={styles.sendFundsOptionSubtitle}>Trade your assets in our p2p market</ThemedText>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Select Asset Modal for Fund Wallet */}
        <Modal
          visible={showFundWalletAssetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFundWalletAssetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Asset</ThemedText>
                <TouchableOpacity onPress={() => {
                  setShowFundWalletAssetModal(false);
                  setFundWalletAssetSearchTerm(''); // Reset search when closing
                }}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={fundWalletAssetSearchTerm}
                  onChangeText={setFundWalletAssetSearchTerm}
                />
              </View>
              <ScrollView style={styles.modalList}>
                {isLoadingWallets ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#A9EF45" />
                    <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 10, fontSize: 12 * SCALE }}>
                      Loading crypto wallets...
                    </ThemedText>
                  </View>
                ) : (() => {
                  const allWallets = cryptoWallets && cryptoWallets.length > 0 ? cryptoWallets : (walletsData?.data?.crypto || []);
                  const filteredWallets = fundWalletAssetSearchTerm.trim() 
                    ? allWallets.filter((wallet: any) => {
                        const currency = (wallet.currency || wallet.symbol || '').toLowerCase();
                        const searchLower = fundWalletAssetSearchTerm.toLowerCase().trim();
                        return currency.includes(searchLower);
                      })
                    : allWallets;
                  
                  if (filteredWallets.length === 0) {
                    return (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                          {fundWalletAssetSearchTerm.trim() ? 'No assets found' : 'No crypto wallets available'}
                        </ThemedText>
                      </View>
                    );
                  }
                  
                  return filteredWallets.map((wallet: any) => {
                    // Map currency to icon
                    let icon = require('../../assets/CurrencyBtc.png');
                    const currency = wallet.currency || wallet.symbol || '';
                    if (currency === 'BTC' || currency === 'Bitcoin') {
                      icon = require('../../assets/CurrencyBtc.png');
                    } else if (currency === 'USDT' || currency === 'Tether') {
                      icon = require('../../assets/CurrencyBtc.png'); // Use default for now
                    } else if (currency === 'ETH' || currency === 'Ethereum') {
                      icon = require('../../assets/CurrencyBtc.png'); // Use default for now
                    }
                    
                    const asset = {
                      id: String(wallet.id || wallet.currency || wallet.symbol || ''),
                      name: currency,
                      balance: wallet.balance || '0',
                      icon: icon,
                    };
                    const isSelected = selectedAsset?.id === asset.id || selectedAsset?.name === asset.name;
                    return (
                      <TouchableOpacity
                        key={asset.id}
                        style={styles.assetItem}
                        onPress={() => {
                          setSelectedAsset(asset);
                          setShowFundWalletAssetModal(false);
                          setFundWalletAssetSearchTerm(''); // Reset search when selecting
                        }}
                      >
                        <Image
                          source={asset.icon}
                          style={styles.assetItemIcon}
                          resizeMode="cover"
                        />
                        <View style={styles.assetItemInfo}>
                          <ThemedText style={styles.assetItemName}>{asset.name}</ThemedText>
                          <ThemedText style={styles.assetItemBalance}>
                            Bal : {formatBalanceNoDecimals(wallet.balance || '0')}
                          </ThemedText>
                        </View>
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={24 * SCALE}
                          color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                        />
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
              <View style={styles.applyButtonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    setShowFundWalletAssetModal(false);
                    setFundWalletAssetSearchTerm(''); // Reset search when closing
                  }}
                >
                  <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Country Modal for Fund Wallet */}
        <Modal
          visible={showFundWalletCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFundWalletCountryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
                <TouchableOpacity onPress={() => setShowFundWalletCountryModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              {isLoadingCountries ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : (
                <ScrollView style={styles.modalList}>
                  {countries.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.countryItem}
                      onPress={() => {
                        setFundWalletSelectedCountry(c.code || 'NG');
                        setFundWalletSelectedCountryName(c.name || 'Nigeria');
                      }}
                    >
                      {c.flag ? (
                        <Image
                          source={{ uri: `${API_BASE_URL.replace('/api', '')}${c.flag}` }}
                          style={styles.countryFlagImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ThemedText style={styles.countryFlag}>{c.code}</ThemedText>
                      )}
                      <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                      <MaterialCommunityIcons
                        name={fundWalletSelectedCountry === c.code ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24}
                        color={fundWalletSelectedCountry === c.code ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFundWalletCountryModal(false)}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </Modal>

      {/* Transaction Receipt Modal */}
      {selectedTransaction && (
        <TransactionReceiptModal
          visible={showReceiptModal}
          transaction={selectedTransaction}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* Decorative Circles */}

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047, // ~20px on 430px width
    paddingTop: 45 * SCALE,
    paddingBottom: 13 * SCALE,
  },
  avatar: {
    width: 40 * 1,
    height: 40 * 1,
    borderRadius: 20 * 1,
    backgroundColor: '#A9EF45',
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 12 * SCALE,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  welcomeEmoji: {
    fontSize: 12 * 1,
    marginLeft: 2 * 1,
  },
  iconButton: {
    marginLeft: 12 * 1,
  },
  iconCircle: {
    width: 40 * 1,
    height: 40 * 1,
    borderRadius: 20 * 1,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 26 * SCALE,
    height: 27 * SCALE,
    borderRadius: 13 * SCALE,
  },
  balanceSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.051, // ~22px
    paddingTop: 16 * SCALE,
  },
  balanceLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6 * SCALE,
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 50 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
    // lineHeight: 74 * SCALE,
    flex: 1,
  },
  balanceCurrency: {
    fontSize: 14 * 1,
    fontWeight:700,
  },
  balanceDecimals: {
    fontSize: 50 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight:700,
  },
  eyeButton: {
    padding: 4 * SCALE,
    marginTop: 4 * SCALE,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SCREEN_WIDTH * 0.049, // ~21px
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
    gap: 10 * 1,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 123 * 1,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 123 * SCALE,
  },
  actionButtonText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#A9EF45',
    marginTop: 5 * 1,
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  walletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 5 * 1,
    marginBottom: 17 * SCALE,
  },
  walletsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  walletCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
  },
  walletCardsScrollView: {
    marginBottom: 20 * SCALE,
  },
  walletCardsScrollContent: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 10 * SCALE,
  },
  walletCard: {
    flex: 1,
    borderRadius: 20 * SCALE,
    padding: 10 * SCALE,
    minHeight: 139 * SCALE,
    overflow: 'hidden',
  },
  walletCardWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
  },
  walletIcon: {
    width: 33 * 1,
    height: 33 * 1,
    borderRadius: 16.5 * 1,
    marginBottom: 8 * 1,
  },
  walletInfo: {
    marginBottom: 4 * 1,
  },
  walletCode: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
  },
  walletCodeDark: {
    color: '#000000',
  },
  walletName: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  walletNameDark: {
    color: '#000000',
  },
  walletDivider: {
    height: 0.3,
    backgroundColor: '#000',
    marginVertical: 6 * SCALE,
  },
  walletBalanceLabel: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  walletBalanceLabelDark: {
    color: '#000000',
  },
  walletBalanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  walletBalanceAmountDark: {
    color: '#000000',
  },
  walletBalanceCurrency: {
    fontSize: 8 * 1,
  },
  walletBalanceCurrencyDark: {
    color: '#000000',
  },
  walletUsdAmount: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  walletUsdAmountDark: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  promoBannerContainer: {
    marginBottom: 5 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  promoBanner: {
    width: SCREEN_WIDTH - (SCREEN_WIDTH * 0.094), // Full width minus horizontal margins
    borderRadius: 20 * 1,
    overflow: 'hidden',
    minHeight: 118 * 1,
  },
  promoBannerImage: {
    width: '100%',
    height: 118 * 1,
    borderRadius: 20 * 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1 * SCALE,
    marginTop: 5 * SCALE,
    marginBottom: 14 * SCALE,
  },
  paginationDot: {
    width: 4 * 1,
    height: 4 * 1,
    borderRadius: 2 * 1,
    backgroundColor: '#bababa',
  },
  paginationDotActive: {
    width: 14 * 1,
    backgroundColor: '#A9EF45',
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  transactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10 * SCALE,
  },
  transactionCardTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  filterButtonContainer: {
    position: 'relative',
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 100,
    paddingHorizontal: 13 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 10 * SCALE,
  },
  filterButtonText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8 * SCALE,
    backgroundColor: '#020c19',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    overflow: 'hidden',
    minWidth: 120 * SCALE,
    zIndex: 1000,
    elevation: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13 * SCALE,
    paddingVertical: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  transactionTotalAmount: {
    fontSize: 40 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
    marginTop: 13 * SCALE,
    lineHeight: 59 * SCALE,
  },
  transactionTotalCurrency: {
    fontSize: 10 * SCALE,
    fontWeight:700,
  },
  transactionTotalDecimals: {
    fontSize: 40 * 1,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chartBars: {
    flexDirection: 'row',
    gap: 7 * SCALE,
    marginBottom: 10 * SCALE,
    alignItems: 'flex-end',
    height: 15 * SCALE,
  },
  chartBar: {
    height: 15 * SCALE,
    borderRadius: 3 * SCALE,
  },
  chartBar1: {
    flex: 1.44,
    backgroundColor: '#2965a9',
  },
  chartBar2: {
    flex: 0.67,
    backgroundColor: 'purple',
  },
  chartBar3: {
    flex: 0.67,
    backgroundColor: 'green',
  },
  chartBar4: {
    flex: 0.72,
    backgroundColor: 'yellow',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7 * SCALE,
    marginTop: 10 * SCALE,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * SCALE,
  },
  legendDot: {
    width: 8 * SCALE,
    height: 8 * SCALE,
    borderRadius: 2 * 1,
  },
  legendDot1: {
    backgroundColor: '#2965a9',
  },
  legendDot2: {
    backgroundColor: 'purple',
  },
  legendDot3: {
    backgroundColor: 'green',
  },
  legendDot4: {
    backgroundColor: 'yellow',
  },
  legendText: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * 1,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18 * SCALE,
  },
  recentTransactionsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * 1,
    padding: 13 * 1,
    marginBottom: 10 * 1,
  },
  transactionIconContainer: {
    marginRight: 12 * SCALE,
  },
  transactionIconCircle: {
    width: 35 * 1,
    height: 35 * 1,
    borderRadius: 17.5 * 1,
    backgroundColor: '#A9EF4533',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  transactionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * SCALE,
  },
  statusDot: {
    width: 6 * SCALE,
    height: 6 * SCALE,
    borderRadius: 3 * SCALE,
    backgroundColor: '#A9EF45',
  },
  transactionSubtitle: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12 * 1,
    fontWeight: '500',
    color: '#008000',
    marginBottom: 4 * SCALE,
  },
  transactionDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 20 * 1,
  },
  // Send Funds Modal Styles
  sendFundsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sendFundsModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 10 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
    maxHeight: '80%',
  },
  sendFundsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 10 * SCALE,
  },
  sendFundsModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sendFundsModalCloseCircle: {
    width: 25 * SCALE,
    height: 25 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10 * SCALE,
  },
  sendFundsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#484848',
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 10 * SCALE,
    marginBottom: 12 * SCALE,
  },
  sendFundsIconCircle: {
    width: 45 * 1,
    height: 45 * 1,
    borderRadius: 30 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15 * SCALE,
  },
  sendFundsIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    tintColor: '#000000',
  },
  sendFundsTextContainer: {
    flex: 1,
  },
  sendFundsOptionTitle: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  sendFundsOptionSubtitle: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sendFundsModalScrollContent: {
    paddingBottom: 30 * SCALE,
  },
  sendFundsIconContainer: {
    alignItems: 'center',
    marginBottom: 25 * SCALE,
    // marginTop: 10 * SCALE,
  },
  sendFundsLargeIconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    borderRadius: 30 * SCALE,
    // backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendFundsLargeIcon: {
    width: 94 * SCALE,
    height: 94 * SCALE,
    // tintColor: '#FFFFFF',
  },
  sendFundsWalletToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    padding: 4 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsWalletToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * SCALE,
    borderRadius: 100,
    gap: 6 * SCALE,
  },
  sendFundsWalletToggleLeft: {
    // No special styling needed
  },
  sendFundsWalletToggleRight: {
    // No special styling needed
  },
  sendFundsWalletToggleActive: {
    backgroundColor: '#A9EF45',
  },
  sendFundsWalletToggleText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sendFundsWalletToggleTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  sendFundsBitcoinIcon: {
    width: 16 * SCALE,
    height: 16 * SCALE,
  },
  sendFundsCurrencySection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
    marginBottom: 12 * SCALE,
  },
  sendFundsBalanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 84 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendFundsBalanceCardContent: {
    flex: 1,
  },
  sendFundsBalanceLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  sendFundsBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  sendFundsWalletIcon: {
    width: 18 * SCALE,
    height: 16 * SCALE,
  },
  sendFundsBalanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  sendFundsCountrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  sendFundsCountryFlagImage: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 18 * SCALE,
  },
  sendFundsCountryFlagEmoji: {
    fontSize: 28 * SCALE,
    width: 36 * SCALE,
    height: 38 * SCALE,
    textAlign: 'center',
    lineHeight: 38 * SCALE,
  },
  sendFundsCountryNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  sendFundsAssetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  sendFundsAssetIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  sendFundsAssetNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 15 * SCALE,
    marginBottom: 15 * SCALE,
    gap: 10 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10 * SCALE,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
  },
  assetItemIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 15 * SCALE,
  },
  assetItemInfo: {
    flex: 1,
  },
  assetItemName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  assetItemBalance: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  applyButtonContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 30* SCALE,
    paddingBottom: 20 * SCALE,
  },
  sendFundsOptionsSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsOptionsContainer: {
    // gap: 12 * SCALE,
  },
  sendFundsRecentSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsRecentScrollContent: {
    gap: 12 * SCALE,
    paddingRight: SCREEN_WIDTH * 0.047,
  },
  sendFundsRecentItem: {
    alignItems: 'center',
    marginRight: 8 * SCALE,
  },
  sendFundsRecentAvatar: {
    width: 71 * SCALE,
    height: 71 * SCALE,
    borderRadius: 35.5 * SCALE,
    marginBottom: 4 * SCALE,
  },
  sendFundsRecentName: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
    textAlign: 'center',
  },
  sendFundsRecentCurrency: {
    fontSize: 6 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 216 * 1,
    height: 216 * 1,
    borderRadius: 108 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    opacity: 0.5,
  },
  circleTop: {
    top: 119 * 1,
    right: -14 * 1,
  },
  circleBottom: {
    bottom: -14 * SCALE,
    left: -14 * SCALE,
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
  countryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryFlagImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
});
