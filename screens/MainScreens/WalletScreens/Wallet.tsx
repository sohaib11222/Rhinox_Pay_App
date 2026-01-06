import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import TransactionErrorModal from '../../components/TransactionErrorModal';
import { useGetWallets, useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetHomeData, useGetHomeTransactions } from '../../../queries/home.queries';
import { useGetVirtualAccounts } from '../../../queries/crypto.queries';
import { useGetTransactionDetails } from '../../../queries/transactionHistory.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { showErrorAlert } from '../../../utils/customAlert';


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
  rawData?: any; // Raw API data
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
  rawData?: any; // Raw API data for filtering/searching
}

const Wallet = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecentTransaction | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState<string>('');
  const [showCryptoSearch, setShowCryptoSearch] = useState(false);
  const [fiatSearchQuery, setFiatSearchQuery] = useState<string>('');
  const [showFiatSearch, setShowFiatSearch] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch user data for name
  const { data: homeData, isLoading: isLoadingUser } = useGetHomeData();
  const user = homeData?.data?.user;

  // Fetch all wallets
  const { 
    data: walletsData, 
    isLoading: isLoadingWallets, 
    refetch: refetchWallets 
  } = useGetWallets();

  // Fetch wallet balances (fiat + crypto with USDT conversion)
  const { 
    data: balancesData, 
    isLoading: isLoadingBalances, 
    refetch: refetchBalances 
  } = useGetWalletBalances();

  // Fetch virtual accounts for crypto
  const { 
    data: virtualAccountsData, 
    isLoading: isLoadingVirtualAccounts, 
    refetch: refetchVirtualAccounts 
  } = useGetVirtualAccounts();

  // Fetch home transactions (both fiat and crypto)
  const { 
    data: homeTransactionsData, 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useGetHomeTransactions({
    limit: 10,
    fiatLimit: 10,
    cryptoLimit: 10,
  });

  // Fetch transaction details when a transaction is selected
  const {
    data: transactionDetailsData,
    isLoading: isLoadingTransactionDetails,
  } = useGetTransactionDetails(
    selectedTransactionId || 0,
    {
      enabled: !!selectedTransactionId,
      queryKey: ['transaction-history', 'details', selectedTransactionId],
    }
  );

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
      'USDT_ETH': 'Tether USD (Ethereum)',
      'USDT_TRON': 'Tether USD (TRON)',
      'USDT_BSC': 'Tether USD (BSC)',
      'USDT_SOL': 'Tether USD (Solana)',
      'USDT_POLYGON': 'Tether USD (Polygon)',
      'BNB': 'Binance Coin',
      'SOL': 'Solana',
      'DOGE': 'Dogecoin',
      'LTC': 'Litecoin',
      'XRP': 'Ripple',
      'TRX': 'Tron',
      'MATIC': 'Polygon',
      'USDC': 'USD Coin',
    };
    // Try exact match first, then try base currency (before underscore)
    if (currencyNames[currency]) {
      return currencyNames[currency];
    }
    const baseCurrency = currency.split('_')[0];
    return currencyNames[baseCurrency] || currency;
  };

  // Format balance for display
  const formatBalance = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Transform API wallets to UI format
  const fiatWallets: Wallet[] = useMemo(() => {
    if (!walletsData?.data || !Array.isArray(walletsData.data)) return [];
    
    // Filter for active fiat wallets
    const fiatWalletsFromAPI = walletsData.data.filter((w: any) => w.type === 'fiat' && w.isActive !== false);
    
    return fiatWalletsFromAPI.map((w: any) => {
      const balance = formatBalance(w.balance || '0');
      const flagUri = w.flag ? `${API_BASE_URL.replace('/api', '')}${w.flag}` : null;
      
      return {
        id: String(w.id),
        currencyCode: w.currency || '',
        currencyName: getCurrencyName(w.currency, w),
        balance: balance,
        balanceUSD: `$${formatBalance(parseFloat(w.balance || '0') * 0.001)}`, // Placeholder conversion
        icon: flagUri ? { uri: flagUri } : require('../../../assets/login/nigeria-flag.png'),
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User',
        rawData: w,
      };
    });
  }, [walletsData?.data, user]);

  // Get wallet ID from first fiat wallet
  const walletId = useMemo(() => {
    if (fiatWallets.length > 0) {
      return fiatWallets[0].id;
    }
    return 'NGN1234';
  }, [fiatWallets]);

  // Transform API virtual accounts to UI format
  const cryptoAssets: CryptoAsset[] = useMemo(() => {
    // Use virtual accounts data if available, otherwise fallback to balancesData
    const accountsData = virtualAccountsData?.data || [];
    
    if (!Array.isArray(accountsData) || accountsData.length === 0) {
      // Fallback to balancesData if virtual accounts not available
      if (!balancesData?.data?.crypto || !Array.isArray(balancesData.data.crypto)) return [];
      
      return balancesData.data.crypto.map((asset: any) => {
        const balance = parseFloat(asset.balance || '0');
        const balanceInUSDT = parseFloat(asset.balanceInUSDT || '0');
        const iconUri = asset.icon ? `${API_BASE_URL.replace('/api', '')}${asset.icon}` : null;
        
        // Determine trend (placeholder - would need price history)
        const trend: 'up' | 'down' = balanceInUSDT > 0 ? 'up' : 'down';
        const trendData = [20, 30, 25, 40, 35, 50, 45]; // Placeholder data
        
        return {
          id: String(asset.id),
          name: getCurrencyName(asset.currency),
          ticker: asset.currency || '',
          balance: balance.toFixed(8).replace(/\.?0+$/, ''), // Remove trailing zeros
          balanceUSD: `$${formatBalance(balanceInUSDT)}`,
          icon: iconUri ? { uri: iconUri } : require('../../../assets/login/bitcoin-coin.png'),
          trend: trend,
          trendData: trendData,
          rawData: asset,
        };
      });
    }
    
    // Transform virtual accounts to crypto assets format
    return accountsData
      .filter((account: any) => account.active !== false) // Only active accounts
      .map((account: any) => {
        const balance = parseFloat(account.accountBalance || account.availableBalance || '0');
        const currency = account.currency || '';
        const blockchain = account.blockchain || '';
        
        // Get currency name
        const currencyName = getCurrencyName(currency);
        
        // Determine trend (placeholder - would need price history)
        const trend: 'up' | 'down' = balance > 0 ? 'up' : 'down';
        const trendData = [20, 30, 25, 40, 35, 50, 45]; // Placeholder data
        
        // Get icon based on currency
        let icon = require('../../../assets/login/bitcoin-coin.png'); // Default
        if (currency.includes('BTC') || currency === 'BTC') {
          icon = require('../../../assets/login/bitcoin-coin.png');
        } else if (currency.includes('ETH') || currency === 'ETH') {
          icon = require('../../../assets/login/usdt-coin.png'); // Placeholder for ETH
        } else if (currency.includes('USDT') || currency.includes('USDC')) {
          icon = require('../../../assets/login/usdt-coin.png');
        } else if (currency.includes('BNB') || currency === 'BNB') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('SOL') || currency === 'SOL') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('DOGE') || currency === 'DOGE') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('LTC') || currency === 'LTC') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('XRP') || currency === 'XRP') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('TRX') || currency === 'TRX') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        } else if (currency.includes('MATIC') || currency === 'MATIC') {
          icon = require('../../../assets/login/bitcoin-coin.png'); // Placeholder
        }
        
        // Format balance - show at least 8 decimal places for crypto, remove trailing zeros
        const formattedBalance = balance === 0 
          ? '0' 
          : balance.toFixed(8).replace(/\.?0+$/, '');
        
        // Calculate USD value (placeholder - would need actual price conversion)
        // For now, use a simple conversion or 0
        // Note: In production, this should use actual crypto prices from an API
        const balanceUSD = balance > 0 ? `$${formatBalance(balance * 0.001)}` : '$0.00';
        
        return {
          id: String(account.id),
          name: currencyName,
          ticker: currency,
          balance: formattedBalance,
          balanceUSD: balanceUSD,
          icon: icon,
          trend: trend,
          trendData: trendData,
          rawData: account, // Store full account data for search/filtering
        };
      });
  }, [virtualAccountsData?.data, balancesData?.data?.crypto]);

  // Calculate total crypto balance from API (always in USD for now)
  const totalCryptoBalanceUSD = useMemo(() => {
    // First try to get from balancesData totals
    if (balancesData?.data?.totals?.cryptoInUSDT) {
      return parseFloat(balancesData.data.totals.cryptoInUSDT);
    }
    
    // Calculate from virtual accounts if available
    if (virtualAccountsData?.data && Array.isArray(virtualAccountsData.data)) {
      const activeAccounts = virtualAccountsData.data.filter((account: any) => account.active !== false);
      // Sum all account balances (using availableBalance as it's the actual usable balance)
      const total = activeAccounts.reduce((sum: number, account: any) => {
        const balance = parseFloat(account.availableBalance || account.accountBalance || '0');
        // For now, use placeholder conversion (would need actual price API)
        // Using a simple multiplier - in production, would fetch real prices
        return sum + (balance * 0.001); // Placeholder: 0.001 conversion rate
      }, 0);
      return total;
    }
    
    // Fallback: calculate from crypto assets
    return cryptoAssets.reduce((sum, asset) => {
      const usdValue = parseFloat(asset.balanceUSD.replace(/[$,]/g, ''));
      return sum + usdValue;
    }, 0);
  }, [balancesData?.data?.totals?.cryptoInUSDT, virtualAccountsData?.data, cryptoAssets]);

  // Currency options for dropdown
  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'USDT', symbol: '$', name: 'Tether USD' },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' },
    { code: 'BNB', symbol: '', name: 'Binance Coin' },
    { code: 'SOL', symbol: '', name: 'Solana' },
    { code: 'DOGE', symbol: '', name: 'Dogecoin' },
    { code: 'LTC', symbol: '', name: 'Litecoin' },
    { code: 'XRP', symbol: '', name: 'Ripple' },
    { code: 'TRX', symbol: '', name: 'Tron' },
    { code: 'MATIC', symbol: '', name: 'Polygon' },
    { code: 'USDC', symbol: '$', name: 'USD Coin' },
  ];

  // Filter currency options based on search query
  const filteredCurrencyOptions = useMemo(() => {
    if (!currencySearchQuery.trim()) {
      return currencyOptions;
    }
    const query = currencySearchQuery.toLowerCase().trim();
    return currencyOptions.filter((currency) => {
      return (
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
      );
    });
  }, [currencySearchQuery]);

  // Get currency symbol for display
  const getCurrencySymbol = (currency: string) => {
    const option = currencyOptions.find(opt => opt.code === currency);
    return option?.symbol || '';
  };

  // Format balance based on selected currency
  const formatBalanceByCurrency = (balanceUSD: number, currency: string) => {
    // For now, all balances are in USD
    // In production, this would convert using exchange rates
    // Placeholder conversion rates (would need real API)
    const conversionRates: { [key: string]: number } = {
      'USD': 1,
      'USDT': 1,
      'BTC': 0.000023, // Placeholder: 1 USD = 0.000023 BTC
      'ETH': 0.00038, // Placeholder: 1 USD = 0.00038 ETH
      'BNB': 0.0018, // Placeholder
      'SOL': 0.0045, // Placeholder
    };

    const rate = conversionRates[currency] || 1;
    const convertedBalance = balanceUSD * rate;

    if (currency === 'USD' || currency === 'USDT') {
      return `${getCurrencySymbol(currency)}${convertedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // For crypto, show more decimal places
      return `${getCurrencySymbol(currency)}${convertedBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`;
    }
  };

  // Filter crypto assets based on search query
  const filteredCryptoAssets = useMemo(() => {
    if (!cryptoSearchQuery.trim()) {
      return cryptoAssets;
    }
    const query = cryptoSearchQuery.toLowerCase().trim();
    return cryptoAssets.filter((asset) => {
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.ticker.toLowerCase().includes(query) ||
        asset.rawData?.blockchain?.toLowerCase().includes(query)
      );
    });
  }, [cryptoAssets, cryptoSearchQuery]);

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

  // Helper function to get icon from transaction type
  const getIconFromType = (type: string): any => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('fund') || typeLower.includes('deposit')) return require('../../../assets/send-2.png');
    if (typeLower.includes('send') || typeLower.includes('withdraw')) return require('../../../assets/send-2.png');
    if (typeLower.includes('bill')) return require('../../../assets/arrow-swap.png');
    if (typeLower.includes('p2p')) return require('../../../assets/arrow-swap.png');
    if (typeLower.includes('convert') || typeLower.includes('exchange')) return require('../../../assets/arrow-swap.png');
    return require('../../../assets/send-2.png');
  };

  // Transform API transactions to UI format (combining fiat and crypto)
  const recentTransactions: RecentTransaction[] = useMemo(() => {
    if (!homeTransactionsData?.data) return [];
    
    const fiatTransactions = homeTransactionsData.data.fiat?.recentTransactions || [];
    const cryptoTransactions = homeTransactionsData.data.crypto?.recentTransactions || [];
    
    // Combine and sort by date (newest first)
    const allTransactions = [...fiatTransactions, ...cryptoTransactions].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }).slice(0, 10); // Limit to 10 most recent
    
    return allTransactions.map((tx: any) => {
      const date = tx.createdAt 
        ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'N/A';
      
      // Handle formatted amount if available, otherwise format manually
      let formattedAmount = tx.formattedAmount;
      if (!formattedAmount) {
        const amount = parseFloat(tx.amount || '0');
        const currency = tx.currency || '';
        const currencySymbol = tx.currencySymbol || '';
        const isPositive = tx.isPositive !== false && (tx.type === 'deposit' || tx.type === 'credit');
        formattedAmount = `${isPositive ? '+' : ''}${currencySymbol}${formatBalance(amount)}`;
      }
      
      // Get transaction title from description or type
      const title = tx.description || tx.normalizedType || tx.type || 'Transaction';
      
      return {
        id: String(tx.id),
        title: title,
        subtitle: tx.status || 'Completed',
        amount: formattedAmount,
        date: date,
        status: (tx.status === 'completed' ? 'Successful' : tx.status === 'pending' ? 'Pending' : 'Failed') as 'Successful' | 'Pending' | 'Failed',
        icon: getIconFromType(tx.type || tx.normalizedType || ''),
        rawData: tx,
      };
    });
  }, [homeTransactionsData?.data]);

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
    try {
      await Clipboard.setStringAsync(walletId);
      setShowCopyMessage(true);
      // Hide the message after 2 seconds
      setTimeout(() => {
        setShowCopyMessage(false);
      }, 2000);
    } catch (error) {
      showErrorAlert('Error', 'Failed to copy wallet ID');
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleViewAllPress = () => {
    // Navigate to Transactions tab
    // @ts-ignore - allow parent route name
    navigation.navigate('Transactions' as never, {
      screen: 'TransactionsList' as never,
    } as never);
  };

  const handleTransactionPress = (transaction: RecentTransaction) => {
    setSelectedTransaction(transaction);
    const transactionId = transaction.rawData?.id || parseInt(transaction.id);
    if (transactionId) {
      setSelectedTransactionId(transactionId);
    }
  };

  // Show receipt modal when transaction details are loaded
  React.useEffect(() => {
    if (transactionDetailsData?.data && selectedTransactionId) {
      const details = transactionDetailsData.data;
      // Only show receipt if transaction is successful
      if (details.status === 'completed' || details.status === 'successful') {
        setShowReceiptModal(true);
        setShowErrorModal(false);
      } else {
        setShowErrorModal(true);
        setShowReceiptModal(false);
      }
    }
  }, [transactionDetailsData?.data, selectedTransactionId]);

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

  // Filter fiat wallets based on search query
  const filteredFiatWallets = useMemo(() => {
    if (!fiatSearchQuery.trim()) {
      return fiatWallets;
    }
    const query = fiatSearchQuery.toLowerCase().trim();
    return fiatWallets.filter((wallet) => {
      return (
        wallet.currencyCode.toLowerCase().includes(query) ||
        wallet.currencyName.toLowerCase().includes(query) ||
        wallet.userName.toLowerCase().includes(query)
      );
    });
  }, [fiatWallets, fiatSearchQuery]);

  const currentWallets = activeTab === 'fiat' ? filteredFiatWallets : [];

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[Wallet] Refreshing wallet data...');
    try {
      await Promise.all([
        refetchWallets(),
        refetchBalances(),
        refetchTransactions(),
        refetchVirtualAccounts(), // Add virtual accounts refresh
      ]);
      console.log('[Wallet] Wallet data refreshed successfully');
    } catch (error) {
      console.error('[Wallet] Error refreshing wallet data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

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
          <TouchableOpacity onPress={() => setShowFiatSearch(!showFiatSearch)}>
            <MaterialCommunityIcons name={showFiatSearch ? "close" : "magnify"} size={24 * SCALE} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Fiat */}
        {showFiatSearch && (
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by currency, name..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={fiatSearchQuery}
              onChangeText={setFiatSearchQuery}
              autoFocus={true}
            />
            {fiatSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setFiatSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            )}
          </View>
        )}

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
                  if (action.id === '1' && action.title === 'Send') {
                    // Navigate to SendFunds screen in Settings stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Settings' as never, {
                      screen: 'SendFunds' as never,
                    } as never);
                  } else if (action.id === '2' && action.title === 'Fund') {
                    // Navigate to Fund screen in Wallet stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Fund' as never);
                  } else if (action.id === '3' && action.title === 'Withdraw') {
                    // Navigate to Withdrawal screen in Wallet stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Withdrawal' as never);
                  } else if (action.id === '4' && action.title === 'Convert') {
                    // Navigate to Conversion screen in Settings stack
                    // @ts-ignore - allow parent route name
                    navigation.navigate('Settings' as never, {
                      screen: 'Conversion' as never,
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
                <TouchableOpacity 
                  style={styles.currencyDropdown}
                  onPress={() => setShowCurrencyDropdown(true)}
                >
                  <ThemedText style={styles.currencyDropdownText}>{selectedCurrency}</ThemedText>
                  <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.totalBalanceHeader}>
                  <ThemedText style={styles.totalBalanceLabel}>Total Balance</ThemedText>
                </View>
                {isLoadingBalances || isLoadingVirtualAccounts ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 20 }} />
                ) : balanceVisible ? (
                  <ThemedText fontFamily='Agbalumo-Regular' style={styles.totalBalanceAmount}>
                    {formatBalanceByCurrency(totalCryptoBalanceUSD, selectedCurrency)}
                  </ThemedText>
                ) : (
                  <ThemedText style={styles.totalBalanceAmount}>••••••</ThemedText>
                )}

                {/* Overlaid Quick Actions Card */}
                <View style={styles.cryptoOverlaidActionsCard}>
                  {cryptoQuickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.cryptoOverlaidActionButton}
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
                <TouchableOpacity onPress={() => setShowCryptoSearch(!showCryptoSearch)}>
                  <MaterialCommunityIcons name="magnify" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              {showCryptoSearch && (
                <View style={styles.searchInputContainer}>
                  <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search crypto assets..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={cryptoSearchQuery}
                    onChangeText={setCryptoSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {cryptoSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCryptoSearchQuery('')}>
                      <MaterialCommunityIcons name="close-circle" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isLoadingVirtualAccounts ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                </View>
              ) : filteredCryptoAssets.length > 0 ? (
                <View style={styles.cryptoAssetsList}>
                  {filteredCryptoAssets.map((asset) => (
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
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                    {cryptoSearchQuery.trim() ? 'No crypto assets found matching your search' : 'No crypto assets found'}
                  </ThemedText>
                </View>
              )}
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
              <TouchableOpacity 
                style={styles.walletIdActionButton}
                onPress={handleShowQR}
              >
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
          {showCopyMessage && (
            <View style={styles.copyMessageContainer}>
              <ThemedText style={styles.copyMessage}>Copied!</ThemedText>
            </View>
          )}
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
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color="#A9EF45" />
            </View>
          ) : recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                >
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
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE }}>
                No transactions found
              </ThemedText>
            </View>
          )}
        </View>
          </>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Currency Dropdown Modal */}
      <Modal
        visible={showCurrencyDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCurrencyDropdown(false);
          setCurrencySearchQuery(''); // Clear search when closing
        }}
      >
        <TouchableOpacity
          style={styles.currencyModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCurrencyDropdown(false);
            setCurrencySearchQuery(''); // Clear search when closing
          }}
        >
          <View style={styles.currencyModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.currencyModalHeader}>
              <ThemedText style={styles.currencyModalTitle}>Select Currency</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowCurrencyDropdown(false);
                  setCurrencySearchQuery(''); // Clear search when closing
                }}
                style={styles.currencyModalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.currencySearchInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" style={styles.currencySearchIcon} />
              <TextInput
                style={styles.currencySearchInput}
                placeholder="Search currencies..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={currencySearchQuery}
                onChangeText={setCurrencySearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {currencySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCurrencySearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable Currency Options List */}
            <ScrollView
              style={styles.currencyOptionsScrollView}
              contentContainerStyle={styles.currencyOptionsList}
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
            >
              {filteredCurrencyOptions.length > 0 ? (
                filteredCurrencyOptions.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOptionItem,
                      selectedCurrency === currency.code && styles.currencyOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCurrency(currency.code);
                      setShowCurrencyDropdown(false);
                      setCurrencySearchQuery(''); // Clear search when selecting
                    }}
                  >
                    <View style={styles.currencyOptionInfo}>
                      <ThemedText style={styles.currencyOptionCode}>{currency.code}</ThemedText>
                      <ThemedText style={styles.currencyOptionName}>{currency.name}</ThemedText>
                    </View>
                    {selectedCurrency === currency.code && (
                      <MaterialCommunityIcons name="check-circle" size={20 * SCALE} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.currencyEmptyState}>
                  <ThemedText style={styles.currencyEmptyText}>
                    No currencies found matching "{currencySearchQuery}"
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalHeader}>
              <ThemedText style={styles.qrModalTitle}>Wallet QR Code</ThemedText>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={walletId}
                size={250 * SCALE}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <ThemedText style={styles.qrWalletId}>{walletId}</ThemedText>
            <ThemedText style={styles.qrModalDescription}>
              Share this QR code to receive funds from other RhinoxPay users
            </ThemedText>
          </View>
        </View>
      </Modal>

      {/* Transaction Receipt Modal */}
      {selectedTransaction && transactionDetailsData?.data && (
        <TransactionReceiptModal
          visible={showReceiptModal && !isLoadingTransactionDetails}
          transaction={(() => {
            const details = transactionDetailsData.data;
            const type = details.type || details.normalizedType || '';
            const typeLower = type.toLowerCase();
            
            // Determine transaction type
            let transactionType: 'send' | 'withdrawal' | 'fund' | 'deposit' | 'convert' | 'billPayment' | 'p2p' | 'cryptoDeposit' | 'cryptoWithdrawal' = 'deposit';
            if (typeLower.includes('deposit') || typeLower.includes('fund')) {
              transactionType = details.walletType === 'crypto' ? 'cryptoDeposit' : 'fund';
            } else if (typeLower.includes('withdraw') || typeLower.includes('send')) {
              transactionType = details.walletType === 'crypto' ? 'cryptoWithdrawal' : 'send';
            } else if (typeLower.includes('convert') || typeLower.includes('exchange')) {
              transactionType = 'convert';
            } else if (typeLower.includes('bill') || typeLower.includes('payment')) {
              transactionType = 'billPayment';
            } else if (typeLower.includes('p2p')) {
              transactionType = 'p2p';
            }
            
            // Format amount
            const amount = parseFloat(details.amount || '0');
            const currency = details.currency || 'NGN';
            const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
            const formattedAmount = `${currencySymbol}${formatBalance(amount)}`;
            
            // Format date
            const dateTime = details.createdAt || details.completedAt || selectedTransaction.date;
            const formattedDateTime = dateTime
              ? new Date(dateTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : selectedTransaction.date;
            
            // Map API status to UI status
            const mapStatusToUI = (status?: string): 'Successful' | 'Pending' | 'Failed' => {
              if (!status) return 'Successful';
              const statusLower = status.toLowerCase();
              if (statusLower === 'completed' || statusLower === 'successful' || statusLower === 'success') {
                return 'Successful';
              }
              if (statusLower === 'pending') {
                return 'Pending';
              }
              if (statusLower === 'failed' || statusLower === 'fail') {
                return 'Failed';
              }
              return 'Successful';
            };

            // Base transaction object
            const baseTransaction: any = {
              transactionType,
              transactionTitle: details.description || details.normalizedType || selectedTransaction.title,
              amountNGN: formattedAmount,
              transferAmount: formattedAmount,
              dateTime: formattedDateTime,
              transactionId: details.reference || `TXN-${details.id}`,
              fee: details.fee ? `${currencySymbol}${formatBalance(parseFloat(details.fee))}` : undefined,
              paymentAmount: details.totalAmount ? `${currencySymbol}${formatBalance(parseFloat(details.totalAmount))}` : formattedAmount,
              status: mapStatusToUI(details.status),
            };
            
            // Add type-specific fields
            if (transactionType === 'send' || transactionType === 'cryptoWithdrawal') {
              baseTransaction.recipientName = details.recipientInfo?.name || details.metadata?.recipientInfo?.name || details.accountName;
              baseTransaction.accountNumber = details.recipientInfo?.phone || details.metadata?.recipientInfo?.phone || details.accountNumber;
              baseTransaction.bank = details.paymentMethod || details.channel;
              baseTransaction.country = details.country;
            } else if (transactionType === 'fund' || transactionType === 'deposit') {
              baseTransaction.fundingRoute = details.channel;
              baseTransaction.provider = details.paymentMethod || details.channel;
            } else if (transactionType === 'convert') {
              baseTransaction.recipientName = details.metadata?.toCurrency || details.currency;
            } else if (transactionType === 'billPayment') {
              baseTransaction.billerType = details.provider?.name || details.category?.name;
              baseTransaction.mobileNumber = details.accountNumber;
              baseTransaction.plan = details.plan?.name;
              baseTransaction.recipientName = details.accountName || details.description;
            }
            
            if (transactionType === 'cryptoDeposit' || transactionType === 'cryptoWithdrawal') {
              baseTransaction.cryptoType = details.currency;
              baseTransaction.quantity = `${details.amount} ${details.currency}`;
              baseTransaction.receivingAddress = details.metadata?.address || details.metadata?.walletAddress;
              baseTransaction.txHash = details.metadata?.txHash || details.reference;
            }
            
            return baseTransaction;
          })()}
          onClose={() => {
            setShowReceiptModal(false);
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Transaction Error Modal */}
      {selectedTransaction && transactionDetailsData?.data && (
        <TransactionErrorModal
          visible={showErrorModal && !isLoadingTransactionDetails}
          transaction={{
            amountNGN: selectedTransaction.amount,
            recipientName: transactionDetailsData.data.description || transactionDetailsData.data.normalizedType || selectedTransaction.title,
            errorMessage: 'Transaction failed. Please try again or contact support.',
            transactionType: (() => {
              const type = transactionDetailsData.data.type || transactionDetailsData.data.normalizedType || '';
              const typeLower = type.toLowerCase();
              if (typeLower.includes('withdraw') || typeLower.includes('send')) return 'withdrawal';
              if (typeLower.includes('deposit') || typeLower.includes('fund')) return 'fund';
              if (typeLower.includes('convert')) return 'convert';
              return 'send';
            })() as 'send' | 'withdrawal' | 'fund' | 'deposit' | 'convert',
            transferAmount: selectedTransaction.amount,
          }}
          onRetry={() => {
            // Retry logic - could navigate to retry screen or show retry modal
            setShowErrorModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
          onCancel={() => {
            setShowErrorModal(false);
            setShowReceiptModal(false);
            setSelectedTransaction(null);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Loading overlay when fetching transaction details */}
      {isLoadingTransactionDetails && selectedTransactionId && (
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 12 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 15 * SCALE,
    minHeight: 45 * SCALE,
    gap: 8 * SCALE,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 12 * SCALE,
    marginBottom: 15 * SCALE,
    minHeight: 45 * SCALE,
  },
  searchIcon: {
    marginRight: 8 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 12 * 1,
    color: '#FFFFFF',
    paddingVertical: 10 * SCALE,
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
  copyMessageContainer: {
    marginTop: 10 * SCALE,
    alignItems: 'center',
  },
  copyMessage: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#A9EF45',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  qrModalContainer: {
    backgroundColor: '#020c19',
    borderRadius: 20 * SCALE,
    padding: 20 * SCALE,
    width: '100%',
    maxWidth: 350 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20 * SCALE,
  },
  qrModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4 * SCALE,
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20 * SCALE,
    borderRadius: 15 * SCALE,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWalletId: {
    fontSize: 20 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
    textAlign: 'center',
  },
  qrModalDescription: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16 * SCALE,
  },
  currencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModalContent: {
    backgroundColor: '#020C19',
    borderRadius: 20 * SCALE,
    width: SCREEN_WIDTH * 0.85,
    maxHeight: '70%',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currencyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyModalTitle: {
    fontSize: 16 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currencyModalCloseButton: {
    padding: 4 * SCALE,
  },
  currencySearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 12 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginVertical: 15 * SCALE,
    minHeight: 45 * SCALE,
  },
  currencySearchIcon: {
    marginRight: 8 * SCALE,
  },
  currencySearchInput: {
    flex: 1,
    fontSize: 12 * 1,
    color: '#FFFFFF',
    paddingVertical: 10 * SCALE,
  },
  currencyOptionsScrollView: {
    maxHeight: 400 * SCALE,
  },
  currencyOptionsList: {
    paddingVertical: 10 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  currencyEmptyState: {
    paddingVertical: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyEmptyText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  currencyOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 15 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  currencyOptionItemSelected: {
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
  },
  currencyOptionInfo: {
    flex: 1,
  },
  currencyOptionCode: {
    fontSize: 14 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  currencyOptionName: {
    fontSize: 11 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default Wallet;

