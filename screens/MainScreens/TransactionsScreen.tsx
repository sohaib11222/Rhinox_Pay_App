import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useGetTransactionHistory, useGetTransactionDetails } from '../../queries/transactionHistory.queries';
import TransactionReceiptModal from '../components/TransactionReceiptModal';
import TransactionErrorModal from '../components/TransactionErrorModal';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9; // Scale factor from Figma to actual device

// Types for API integration
interface Transaction {
    id: string;
    type: 'fiat' | 'crypto';
    title: string;
    date: string;
    amountNGN: string;
    amountUSD: string;
    icon: string;
    rawData?: any; // Store raw API data for details
}

interface ChartData {
    time: string;
    value: number;
}

interface SummaryData {
    incoming: {
        ngn: string;
        usd: string;
    };
    outgoing: {
        ngn: string;
        usd: string;
    };
}

const TransactionsScreen = () => {
    const navigation = useNavigation();
    const [selectedPeriod, setSelectedPeriod] = useState<'D' | 'W' | 'M' | 'Custom'>('D');
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [tempStartDate, setTempStartDate] = useState<string>('');
    const [tempEndDate, setTempEndDate] = useState<string>('');
    const [fiatDisplayLimit, setFiatDisplayLimit] = useState<number>(10);
    const [cryptoDisplayLimit, setCryptoDisplayLimit] = useState<number>(10);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Format date for API (YYYY-MM-DD)
    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format date for display (MM/DD/YYYY)
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        // If already in YYYY-MM-DD format, convert to MM/DD/YYYY
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[1]}/${parts[2]}/${parts[0]}`;
            }
        }
        // If already in MM/DD/YYYY format, return as is
        if (dateString.includes('/')) {
            return dateString;
        }
        // Try parsing as date
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
        return dateString;
    };

    // Parse date from input (MM/DD/YYYY or YYYY-MM-DD) and return YYYY-MM-DD
    const parseDateToAPIFormat = (dateString: string): string | null => {
        if (!dateString || dateString.trim() === '') return null;
        
        // Try MM/DD/YYYY format first
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            if (!isNaN(month) && !isNaN(day) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) {
                    return formatDateForAPI(date);
                }
            }
        }
        
        // Try YYYY-MM-DD format
        if (dateString.includes('-')) {
            const dateParts = dateString.split('-');
            if (dateParts.length === 3) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const date = new Date(year, month - 1, day);
                    if (!isNaN(date.getTime())) {
                        return formatDateForAPI(date);
                    }
                }
            }
        }
        
        return null;
    };

    // Handle Custom period selection
    const handleCustomPeriodPress = () => {
        // If dates are already set, use them; otherwise initialize with current date range
        if (!startDate || !endDate) {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            setTempStartDate(formatDateForAPI(thirtyDaysAgo));
            setTempEndDate(formatDateForAPI(today));
        } else {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
        }
        setShowCustomDateModal(true);
    };

    // Check if dates are valid
    const areDatesValid = useMemo(() => {
        const startDateAPI = parseDateToAPIFormat(tempStartDate);
        const endDateAPI = parseDateToAPIFormat(tempEndDate);
        return startDateAPI !== null && endDateAPI !== null;
    }, [tempStartDate, tempEndDate]);

    // Apply custom date range
    const handleApplyCustomDates = () => {
        const startDateAPI = parseDateToAPIFormat(tempStartDate);
        const endDateAPI = parseDateToAPIFormat(tempEndDate);
        
        if (!startDateAPI || !endDateAPI) {
            // Show error or validation message
            console.error('[TransactionsScreen] Invalid dates provided');
            return;
        }
        
        // Parse to compare dates
        const start = new Date(startDateAPI);
        const end = new Date(endDateAPI);
        
        if (start > end) {
            // Swap if start is after end
            setStartDate(endDateAPI);
            setEndDate(startDateAPI);
        } else {
            setStartDate(startDateAPI);
            setEndDate(endDateAPI);
        }
        
        setShowCustomDateModal(false);
        setSelectedPeriod('Custom');
    };

    // Fetch transaction history from API
    const { 
        data: transactionHistoryData, 
        isLoading: isLoadingHistory, 
        error: historyError,
        refetch: refetchHistory 
    } = useGetTransactionHistory({ 
        period: selectedPeriod,
        startDate: selectedPeriod === 'Custom' ? startDate : undefined,
        endDate: selectedPeriod === 'Custom' ? endDate : undefined,
    });

    // Extract data from API response
    const transactionData = transactionHistoryData?.data;
    const summary = transactionData?.summary || { total: '0', incoming: '0', outgoing: '0' };
    const chartDataFromAPI = transactionData?.chartData || [];
    const fiatTransactionsFromAPI = transactionData?.fiat || [];
    const cryptoTransactionsFromAPI = transactionData?.crypto || [];

    // Format currency amounts
    const formatCurrency = (amount: string | number, currency: string = 'NGN') => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '0.00';
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatUSD = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '$0.00';
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Transform API chart data to UI format
    const chartData = useMemo(() => {
        if (chartDataFromAPI.length === 0) {
            // Return empty chart data if no data based on period
            if (selectedPeriod === 'D') {
                // For daily, return 24 hours
                return Array(24).fill(0).map((_, i) => {
                    const hour = i === 0 ? 12 : i;
                    const period = i < 12 ? 'AM' : 'PM';
                    const displayHour = i === 0 ? 12 : (i > 12 ? i - 12 : i);
                    const nextHour = i === 23 ? 1 : (i + 1 > 12 ? (i + 1) - 12 : i + 1);
                    const nextPeriod = i + 1 < 12 ? 'AM' : 'PM';
                    return { 
                        time: `${displayHour} ${period}-${nextHour} ${nextPeriod}`, 
                        value: 0 
                    };
                });
            } else if (selectedPeriod === 'W') {
                // For weekly, return 7 days
                return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ time: day, value: 0 }));
            } else if (selectedPeriod === 'M') {
                // For monthly, return 4 weeks
                return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(week => ({ time: week, value: 0 }));
            } else {
                // For custom, return single period
                return [{ time: 'Period 1', value: 0 }];
            }
        }
        // Map API chart data to UI format
        return chartDataFromAPI.map((item: any) => ({
            time: item.hour || item.time || item.day || item.week || 'N/A',
            value: parseFloat(item.amount || '0'),
        }));
    }, [chartDataFromAPI, selectedPeriod]);

    // Calculate total amount from summary
    const totalAmount = useMemo(() => {
        const total = parseFloat(summary.total || '0');
        return formatUSD(total);
    }, [summary.total]);

    // Transform summary data
    const summaryData = useMemo(() => {
        const incomingAmount = parseFloat(summary.incoming || '0');
        const outgoingAmount = parseFloat(summary.outgoing || '0');
        return {
            incoming: {
                ngn: formatCurrency(incomingAmount),
                usd: formatUSD(incomingAmount * 0.001), // Placeholder conversion rate - replace with actual rate
            },
            outgoing: {
                ngn: formatCurrency(outgoingAmount),
                usd: formatUSD(outgoingAmount * 0.001), // Placeholder conversion rate - replace with actual rate
            },
        };
    }, [summary.incoming, summary.outgoing]);

    // Transform API transactions to UI format
    // Helper function to get icon from transaction type
    const getIconFromType = (type: string): string => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('fund') || typeLower.includes('deposit')) return 'send-square';
        if (typeLower.includes('send') || typeLower.includes('withdraw')) return 'send-2';
        if (typeLower.includes('bill')) return 'document-download';
        if (typeLower.includes('p2p')) return 'account-group';
        if (typeLower.includes('crypto')) return 'bitcoin';
        return 'send-2';
    };

    const fiatTransactions = useMemo(() => {
        if (!Array.isArray(fiatTransactionsFromAPI)) return [];
        return fiatTransactionsFromAPI.map((tx: any) => {
            const amount = parseFloat(tx.amount || '0');
            const currency = tx.currency || 'NGN';
            const date = tx.completedAt 
                ? new Date(tx.completedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })
                : tx.createdAt 
                ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })
                : 'N/A';
            
            return {
                id: String(tx.id || ''),
                type: 'fiat' as const,
                title: tx.normalizedType || tx.type || 'Transaction',
                date: date,
                amountNGN: `${currency}${formatCurrency(amount)}`,
                amountUSD: formatUSD(amount * 0.001), // Placeholder conversion - replace with actual rate
                icon: getIconFromType(tx.normalizedType || tx.type || ''),
                rawData: tx, // Store raw data for navigation
            };
        });
    }, [fiatTransactionsFromAPI]);

    // Paginated fiat transactions
    const displayedFiatTransactions = useMemo(() => {
        return fiatTransactions.slice(0, fiatDisplayLimit);
    }, [fiatTransactions, fiatDisplayLimit]);

    const hasMoreFiatTransactions = fiatTransactions.length > fiatDisplayLimit;

    const cryptoTransactions = useMemo(() => {
        if (!Array.isArray(cryptoTransactionsFromAPI)) return [];
        return cryptoTransactionsFromAPI.map((tx: any) => {
            const amount = parseFloat(tx.amount || '0');
            const currency = tx.currency || 'BTC';
            const date = tx.completedAt 
                ? new Date(tx.completedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })
                : tx.createdAt 
                ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })
                : 'N/A';
            
            return {
                id: String(tx.id || ''),
                type: 'crypto' as const,
                title: tx.normalizedType || tx.type || 'Crypto Transaction',
                date: date,
                amountNGN: `${currency}${formatCurrency(amount)}`,
                amountUSD: formatUSD(amount * 0.001), // Placeholder conversion - replace with actual rate
                icon: getIconFromType(tx.normalizedType || tx.type || ''),
                rawData: tx, // Store raw data for navigation
            };
        });
    }, [cryptoTransactionsFromAPI]);

    // Paginated crypto transactions
    const displayedCryptoTransactions = useMemo(() => {
        return cryptoTransactions.slice(0, cryptoDisplayLimit);
    }, [cryptoTransactions, cryptoDisplayLimit]);

    const hasMoreCryptoTransactions = cryptoTransactions.length > cryptoDisplayLimit;

    // Reset pagination when period or dates change
    useEffect(() => {
        setFiatDisplayLimit(10);
        setCryptoDisplayLimit(10);
    }, [selectedPeriod, startDate, endDate]);

    // Calculate max value from current chart data
    const maxChartValue = Math.max(...chartData.map((d: ChartData) => d.value), 176);
    const CHART_MAX_HEIGHT = 176 * SCALE;
    const CHART_BOTTOM_PADDING = 20 * SCALE; // Space for X-axis labels
    const CHART_TOP_PADDING = 5 * SCALE; // Space at top to prevent cutoff
    const AVAILABLE_CHART_HEIGHT = CHART_MAX_HEIGHT - CHART_BOTTOM_PADDING - CHART_TOP_PADDING;
    
    // Calculate chart area width based on number of data points
    const CHART_BAR_WIDTH = 54 * SCALE;
    const CHART_BAR_GAP = 10 * SCALE;
    const CHART_AREA_WIDTH = chartData.length * (CHART_BAR_WIDTH + CHART_BAR_GAP) + CHART_BAR_GAP;

    const getIconName = (icon: string) => {
        const iconMap: { [key: string]: string } = {
            'send-2': 'arrow-up',
            'send-square': 'arrow-up-circle',
            'document-download': 'file-download',
            'account-group': 'account-group',
            'bitcoin': 'bitcoin',
        };
        return iconMap[icon] || 'circle';
    };

    const getIconSource = (icon: string) => {
        const iconMap: { [key: string]: any } = {
            'send-2': require('../../assets/send-2.png'),
            'send-square': require('../../assets/send-square.png'),
        };
        return iconMap[icon] || null;
    };

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        console.log('[TransactionsScreen] Refreshing transaction history...');
        try {
            await refetchHistory();
            console.log('[TransactionsScreen] Transaction history refreshed successfully');
        } catch (error) {
            console.error('[TransactionsScreen] Error refreshing transaction history:', error);
        }
    };

    const { refreshing, onRefresh } = usePullToRefresh({
        onRefresh: handleRefresh,
        refreshDelay: 2000,
    });

    // Fetch transaction details when a transaction is selected
    const {
        data: transactionDetailsData,
        isLoading: isLoadingDetails,
        error: detailsError,
    } = useGetTransactionDetails(selectedTransactionId || 0, {
        enabled: !!selectedTransactionId,
        queryKey: ['transaction-history', 'details', selectedTransactionId],
    });

    // Helper function to normalize status
    const normalizeStatus = (status: string): 'Successful' | 'Pending' | 'Failed' => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'completed' || statusLower === 'successful') return 'Successful';
        if (statusLower === 'pending') return 'Pending';
        if (statusLower === 'failed') return 'Failed';
        return 'Successful'; // Default
    };

    // Handle crypto transaction press
    const handleCryptoTransactionPress = (transaction: Transaction) => {
        const rawData = transaction.rawData;
        const transactionId = rawData?.id;
        
        if (transactionId) {
            setSelectedTransactionId(Number(transactionId));
        }
        
        setSelectedTransaction(transaction);
        
        // If no ID, show modal immediately with existing data
        if (!transactionId) {
            const status = normalizeStatus(rawData?.status || '');
            if (status === 'Failed') {
                setShowErrorModal(true);
            } else {
                setShowReceiptModal(true);
            }
        }
    };

    // Show modal when details are loaded
    useEffect(() => {
        if (selectedTransaction && selectedTransactionId) {
            if (isLoadingDetails) {
                // Still loading details, don't show modal yet
                return;
            }
            
            // Details loaded, show appropriate modal
            const status = normalizeStatus(
                transactionDetailsData?.data?.status || 
                selectedTransaction.rawData?.status || 
                ''
            );
            
            if (status === 'Failed') {
                setShowErrorModal(true);
            } else {
                setShowReceiptModal(true);
            }
        }
    }, [selectedTransaction, selectedTransactionId, isLoadingDetails, transactionDetailsData]);

    // Update selected transaction with details when loaded
    useEffect(() => {
        if (transactionDetailsData?.data && selectedTransaction) {
            // Transaction details are loaded, they will be used in the modal
        }
    }, [transactionDetailsData, selectedTransaction]);

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
                    <ThemedText style={styles.headerTitle}>Transaction History</ThemedText>
                </View>

                {/* Chart Section */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <ThemedText style={styles.chartLabel}>Totals</ThemedText>
                        <ThemedText style={styles.chartAmount}>{totalAmount}</ThemedText>
                    </View>

                    {/* Period Filters */}
                    <View style={styles.periodFilters}>
                        <TouchableOpacity
                            style={[styles.periodButton, selectedPeriod === 'D' && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod('D')}
                        >
                            <ThemedText style={[styles.periodButtonText, selectedPeriod === 'D' && styles.periodButtonTextActive]}>
                                D
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.periodButton, selectedPeriod === 'W' && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod('W')}
                        >
                            <ThemedText style={[styles.periodButtonText, selectedPeriod === 'W' && styles.periodButtonTextActive]}>
                                W
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.periodButton, selectedPeriod === 'M' && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod('M')}
                        >
                            <ThemedText style={[styles.periodButtonText, selectedPeriod === 'M' && styles.periodButtonTextActive]}>
                                M
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.periodButton, selectedPeriod === 'Custom' && styles.periodButtonActive]}
                            onPress={handleCustomPeriodPress}
                        >
                            <ThemedText style={[styles.periodButtonText, selectedPeriod === 'Custom' && styles.periodButtonTextActive]}>
                                Custom
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Chart Container */}
                    {isLoadingHistory ? (
                        <View style={{ height: 176 * SCALE, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#A9EF45" />
                        </View>
                    ) : (
                        <View style={styles.chartContainer}>
                            {/* Y-axis Labels - Dynamic based on max value */}
                            <View style={styles.yAxisLabels}>
                                {(() => {
                                    const maxValue = Math.max(...chartData.map((d: ChartData) => d.value), 1);
                                    const step = maxValue / 4;
                                    return [4, 3, 2, 1, 0].map((i) => (
                                        <ThemedText key={i} style={styles.yAxisText}>
                                            {formatUSD(step * i)}
                                        </ThemedText>
                                    ));
                                })()}
                            </View>

                            {/* Chart Area - Scrollable */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chartScrollContent}
                                style={styles.chartScrollView}
                            >
                                <View style={[styles.chartArea, { width: CHART_AREA_WIDTH }]}>
                                    {/* Horizontal Grid Lines */}
                                    <View style={[styles.gridLines, { width: CHART_AREA_WIDTH }]}>
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <View key={i} style={[styles.gridLine, { width: CHART_AREA_WIDTH }]} />
                                        ))}
                                    </View>

                                    {/* Chart Bars */}
                                    <View style={[styles.barsContainer, { width: CHART_AREA_WIDTH }]}>
                                        {chartData.map((data: ChartData, index: number) => {
                                            // Calculate max value from current chart data (minimum 1 to avoid division by zero)
                                            const maxChartValue = Math.max(...chartData.map((d: ChartData) => d.value), 1);
                                            // Calculate bar height relative to available space, ensuring it doesn't exceed
                                            const barHeight = maxChartValue > 0 
                                                ? Math.min(
                                                    (data.value / maxChartValue) * AVAILABLE_CHART_HEIGHT,
                                                    AVAILABLE_CHART_HEIGHT
                                                )
                                                : 0;
                                            // Find the index of the bar with the highest value, make it active
                                            const maxValueIndex = chartData.findIndex((d: ChartData) => d.value === maxChartValue && d.value > 0);
                                            const isActive = index === maxValueIndex && maxValueIndex !== -1;
                                            return (
                                                <View key={index} style={styles.barWrapper}>
                                                    <View style={[
                                                        styles.bar,
                                                        { height: Math.max(barHeight, 3 * SCALE) }, // Minimum height for visibility
                                                        isActive ? styles.barActive : styles.barInactive
                                                    ]} />
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {/* X-axis Labels */}
                                    <View style={[styles.xAxisLabels, { width: CHART_AREA_WIDTH }]}>
                                        {chartData.map((data: ChartData, index: number) => (
                                            <ThemedText key={index} style={styles.xAxisText}>
                                                {data.time}
                                            </ThemedText>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    {/* Incoming Card - Linear Gradient Blue background */}
                    <LinearGradient
                        colors={['#4880C0', '#1B589E']} // Darker blue at top to lighter blue at bottom
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.summaryCardGradient}
                    >
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIconCircle}>
                                <Image
                                    source={require('../../assets/ArrowLineDownLeft (1).png')}
                                    style={[{ marginBottom: -1, width: 7, height: 7 }]}
                                    resizeMode="cover"
                                />
                            </View>
                            <ThemedText style={styles.summaryLabel}>Incoming</ThemedText>
                        </View>
                        {isLoadingHistory ? (
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                <View style={styles.summaryAmountContainer}>
                                    <View style={styles.summaryAmountRow}>
                                        <ThemedText style={styles.summaryAmountMain}>
                                            {summaryData.incoming.ngn}
                                        </ThemedText>
                                        <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={styles.summaryUSD}>{summaryData.incoming.usd}</ThemedText>
                            </>
                        )}
                    </LinearGradient>

                    {/* Outgoing Card - White background */}
                    <View style={styles.summaryCardWhite}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIconCircleWhite}>
                                <Image
                                    source={require('../../assets/Vector (31).png')}
                                    style={[{ marginBottom: -1, width: 7, height: 7 }]}
                                    resizeMode="cover"
                                />
                            </View>
                            <ThemedText style={styles.summaryLabelWhite}>Outgoing</ThemedText>
                        </View>
                        {isLoadingHistory ? (
                            <ActivityIndicator size="small" color="#000000" style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                <View style={styles.summaryAmountContainer}>
                                    <View style={styles.summaryAmountRow}>
                                        <ThemedText style={styles.summaryAmountMainWhite}>
                                            {summaryData.outgoing.ngn}
                                        </ThemedText>
                                        <ThemedText style={styles.summaryAmountCurrencyWhite}>NGN</ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={styles.summaryUSDWhite}>{summaryData.outgoing.usd}</ThemedText>
                            </>
                        )}
                    </View>
                </View>

                {/* Transaction List Card */}
                <View style={styles.transactionCard}>
                    {/* Fiat Section */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
                        <ThemedText style={styles.sectionFilterLabel}>Fiat</ThemedText>
                    </View>

                    {isLoadingHistory ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ActivityIndicator size="small" color="#A9EF45" />
                        </View>
                    ) : displayedFiatTransactions.length > 0 ? (
                        <View style={styles.transactionList}>
                            {displayedFiatTransactions.map((transaction: Transaction) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={styles.transactionItem}
                                onPress={() => {
                                    if (transaction.title === 'Send Transactions') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('SendTransactions' as never);
                                    } else if (transaction.title === 'Fund Transaction') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('FundTransactions' as never);
                                    } else if (transaction.title === 'Withdrawals') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('Withdrawals' as never);
                                    } else if (transaction.title === 'Bill Payments') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('BillPayments' as never);

                                    } else if (transaction.title === 'P2P Transactions') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('P2PTransactions' as never);
                                    } else if (transaction.title === 'Crypto Deposit') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('CryptoDeposit' as never);
                                    }
                                }}
                            >
                                <View style={styles.transactionIconContainer}>
                                    <View style={styles.transactionIconCircle}>
                                        {getIconSource(transaction.icon) ? (
                                            <Image
                                                source={getIconSource(transaction.icon)}
                                                style={styles.transactionIconImage}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <MaterialCommunityIcons
                                                name={getIconName(transaction.icon) as any}
                                                size={20 * SCALE}
                                                color="#A9EF45"
                                            />
                                        )}
                                    </View>
                                </View>
                                <View style={styles.transactionDetails}>
                                    <ThemedText style={styles.transactionTitle}>{transaction.title}</ThemedText>
                                    <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                                </View>
                                <View style={styles.transactionAmountContainer}>
                                    <ThemedText style={styles.transactionAmountNGN}>{transaction.amountNGN}</ThemedText>
                                    <ThemedText style={styles.transactionAmountUSD}>{transaction.amountUSD}</ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No fiat transactions found</ThemedText>
                        </View>
                    )}

                    {/* Load More Button for Fiat */}
                    {hasMoreFiatTransactions && (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={() => setFiatDisplayLimit(prev => prev + 10)}
                        >
                            <ThemedText style={styles.loadMoreText}>
                                Load More ({fiatTransactions.length - fiatDisplayLimit} remaining)
                            </ThemedText>
                        </TouchableOpacity>
                    )}

                    {/* Crypto Section */}
                    <View style={[styles.sectionHeader, { marginTop: 20 * SCALE }]}>
                        <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
                        <ThemedText style={styles.sectionFilterLabel}>Crypto</ThemedText>
                    </View>

                    {isLoadingHistory ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ActivityIndicator size="small" color="#A9EF45" />
                        </View>
                    ) : displayedCryptoTransactions.length > 0 ? (
                        <View style={styles.transactionList}>
                            {displayedCryptoTransactions.map((transaction: Transaction) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={styles.transactionItem}
                                onPress={() => handleCryptoTransactionPress(transaction)}
                            >
                                <View style={styles.transactionIconContainer}>
                                    <View style={styles.transactionIconCircle}>
                                        {getIconSource(transaction.icon) ? (
                                            <Image
                                                source={getIconSource(transaction.icon)}
                                                style={styles.transactionIconImage}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <MaterialCommunityIcons
                                                name={getIconName(transaction.icon) as any}
                                                size={20 * SCALE}
                                                color="#A9EF45"
                                            />
                                        )}
                                    </View>
                                </View>
                                <View style={styles.transactionDetails}>
                                    <ThemedText style={styles.transactionTitle}>{transaction.title}</ThemedText>
                                    <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
                                </View>
                                <View style={styles.transactionAmountContainer}>
                                    <ThemedText style={styles.transactionAmountNGN}>{transaction.amountNGN}</ThemedText>
                                    <ThemedText style={styles.transactionAmountUSD}>{transaction.amountUSD}</ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No crypto transactions found</ThemedText>
                        </View>
                    )}

                    {/* Load More Button for Crypto */}
                    {hasMoreCryptoTransactions && (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={() => setCryptoDisplayLimit(prev => prev + 10)}
                        >
                            <ThemedText style={styles.loadMoreText}>
                                Load More ({cryptoTransactions.length - cryptoDisplayLimit} remaining)
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Transaction Receipt Modal */}
            {selectedTransaction && (
                <TransactionReceiptModal
                    visible={showReceiptModal && !isLoadingDetails}
                    transaction={{
                        transactionType: selectedTransaction.rawData?.type === 'deposit'
                            ? 'cryptoDeposit'
                            : selectedTransaction.rawData?.type === 'withdrawal'
                            ? 'cryptoWithdrawal'
                            : selectedTransaction.rawData?.type === 'p2p'
                            ? 'p2p'
                            : 'cryptoDeposit',
                        cryptoType: selectedTransaction.rawData?.currency || '',
                        network: selectedTransaction.rawData?.metadata?.blockchain || '',
                        quantity: `${selectedTransaction.rawData?.amount || '0'} ${selectedTransaction.rawData?.currency || ''}`,
                        dateTime: selectedTransaction.date,
                        transactionId: transactionDetailsData?.data?.reference || selectedTransaction.rawData?.reference || selectedTransaction.id,
                        amountNGN: selectedTransaction.amountNGN,
                        receivingAddress: transactionDetailsData?.data?.metadata?.toAddress || selectedTransaction.rawData?.metadata?.toAddress,
                        sendingAddress: transactionDetailsData?.data?.metadata?.fromAddress || selectedTransaction.rawData?.metadata?.fromAddress,
                        txHash: transactionDetailsData?.data?.metadata?.txHash || selectedTransaction.rawData?.metadata?.txHash,
                        fee: transactionDetailsData?.data?.fee ? `$${parseFloat(transactionDetailsData.data.fee).toFixed(2)}` : undefined,
                        feeCrypto: transactionDetailsData?.data?.fee ? `${transactionDetailsData.data.fee} ${transactionDetailsData.data.currency}` : undefined,
                        feeUSD: transactionDetailsData?.data?.fee ? `$${parseFloat(transactionDetailsData.data.fee).toFixed(2)}` : undefined,
                        status: normalizeStatus(
                            transactionDetailsData?.data?.status || 
                            selectedTransaction.rawData?.status || 
                            'Successful'
                        ),
                    }}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedTransaction(null);
                        setSelectedTransactionId(null);
                    }}
                />
            )}

            {/* Loading Modal for Transaction Details */}
            {selectedTransaction && isLoadingDetails && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
                        <View style={styles.loadingModalContent}>
                            <ActivityIndicator size="large" color="#A9EF45" />
                            <ThemedText style={styles.loadingModalText}>Loading transaction details...</ThemedText>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Transaction Error Modal */}
            {selectedTransaction && (
                <TransactionErrorModal
                    visible={showErrorModal && !isLoadingDetails}
                    transaction={transactionDetailsData?.data || selectedTransaction.rawData || selectedTransaction}
                    onRetry={() => {
                        if (selectedTransactionId) {
                            refetchHistory();
                        }
                        setShowErrorModal(false);
                        setSelectedTransaction(null);
                        setSelectedTransactionId(null);
                    }}
                    onCancel={() => {
                        setShowErrorModal(false);
                        setSelectedTransaction(null);
                        setSelectedTransactionId(null);
                    }}
                />
            )}

            {/* Custom Date Range Modal */}
            <Modal
                visible={showCustomDateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomDateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.customDateModalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Date Range</ThemedText>
                            <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <ThemedText style={styles.customDateSubtitle}>
                            Select start and end dates for your transaction history
                        </ThemedText>

                        {/* Start Date Input */}
                        <View style={styles.dateInputSection}>
                            <ThemedText style={styles.dateInputLabel}>Start Date</ThemedText>
                            <View style={styles.dateInputContainer}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="MM/DD/YYYY"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={formatDateForDisplay(tempStartDate)}
                                    onChangeText={(text) => {
                                        // Allow user to type in MM/DD/YYYY format
                                        setTempStartDate(text);
                                    }}
                                    keyboardType="numeric"
                                />
                                <MaterialCommunityIcons name="calendar" size={20} color="rgba(255, 255, 255, 0.5)" />
                            </View>
                        </View>

                        {/* End Date Input */}
                        <View style={styles.dateInputSection}>
                            <ThemedText style={styles.dateInputLabel}>End Date</ThemedText>
                            <View style={styles.dateInputContainer}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="MM/DD/YYYY"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={tempEndDate ? formatDateForDisplay(tempEndDate) : ''}
                                    onChangeText={(text) => {
                                        // Allow user to type in MM/DD/YYYY format
                                        // Remove non-numeric characters except /
                                        const cleaned = text.replace(/[^\d/]/g, '');
                                        setTempEndDate(cleaned);
                                    }}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                <MaterialCommunityIcons name="calendar" size={20} color="rgba(255, 255, 255, 0.5)" />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.customDateButtons}>
                            <TouchableOpacity
                                style={[styles.customDateButton, styles.customDateButtonCancel]}
                                onPress={() => setShowCustomDateModal(false)}
                            >
                                <ThemedText style={styles.customDateButtonTextCancel}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.customDateButton,
                                    styles.customDateButtonApply,
                                    !areDatesValid && styles.customDateButtonDisabled
                                ]}
                                onPress={handleApplyCustomDates}
                                disabled={!areDatesValid}
                            >
                                <ThemedText style={styles.customDateButtonTextApply}>Apply</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default TransactionsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020c19',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        paddingTop: 30* SCALE,
        paddingBottom: 13 * SCALE,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#FFFFFF',
        paddingTop: 10
    },
    chartCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15 * 1,
        padding: 14 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
    },
    chartHeader: {
        marginBottom: 20 * SCALE,
    },
    chartLabel: {
        fontSize: 14 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 8 * SCALE,
    },
    chartAmount: {
        fontSize: 36 * SCALE,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    periodFilters: {
        flexDirection: 'row',
        gap: 10 * SCALE,
        marginBottom: 20 * SCALE,
        marginTop: 10 * SCALE,
    },
    periodButton: {
        flex: 1,
        height: 30 * 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100 * 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#A9EF45',
        borderColor: '#A9EF45',
    },
    periodButtonText: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    periodButtonTextActive: {
        color: '#000000',
        fontWeight: '500',
    },
    chartContainer: {
        flexDirection: 'row',
        height: 176 * SCALE,
        marginTop: 10 * SCALE, // Add spacing from tabs
    },
    chartScrollView: {
        flex: 1,
    },
    chartScrollContent: {
        paddingRight: 20 * SCALE,
    },
    yAxisLabels: {
        width: 40 * SCALE,
        justifyContent: 'space-between',
        paddingRight: 8 * SCALE,
    },
    yAxisText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    chartArea: {
        width: 322 * SCALE, // Fixed width for scrollable content
        position: 'relative',
        height: 176 * SCALE,
        overflow: 'visible', // Allow bars to be visible even if they extend slightly
    },
    gridLines: {
        position: 'absolute',
        top: 5 * SCALE, // Add top padding to match bar container
        left: 0,
        width: 322 * SCALE, // Match chartArea width
        bottom: 25 * SCALE, // Match bottom padding for X-axis
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 322 * SCALE, // Match chartArea width
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 146 * SCALE, // Reduced height to account for padding (176 - 25 - 5)
        paddingBottom: 0,
        paddingTop: 5 * SCALE, // Top padding to prevent cutoff
        justifyContent: 'space-between',
        paddingHorizontal: 5 * SCALE,
        position: 'absolute',
        bottom: 25 * SCALE, // Space for X-axis labels
        left: 0,
        width: 322 * SCALE, // Match chartArea width
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 146 * SCALE, // Match barsContainer height
    },
    bar: {
        width: 54 * SCALE,
        borderRadius: 100, // Fully rounded (pill shape)
        minHeight: 3 * SCALE,
    },
    barActive: {
        backgroundColor: '#A9EF45', // Bright green for active bar
    },
    barInactive: {
        backgroundColor: '#e7ffc4', // Light green for inactive bars
    },
    xAxisLabels: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 322 * SCALE, // Match chartArea width
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5 * SCALE,
    },
    xAxisText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    summaryContainer: {
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
        lineHeight: 20 * SCALE, // Position it slightly above baseline
        marginBottom: 2 * SCALE, // Slight upward offset
    },
    summaryAmountCurrencyWhite: {
        fontSize: 8 * 1,
        fontWeight: '500',
        color: '#000000',
        marginLeft: 4 * SCALE,
        lineHeight: 20 * SCALE, // Position it slightly above baseline
        marginBottom: 2 * SCALE, // Slight upward offset
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
    transactionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15 * 1,
        padding: 14 * 1,
        marginHorizontal: SCREEN_WIDTH * 0.047,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20 * SCALE,
        paddingBottom: 14 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    sectionTitle: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    sectionFilterLabel: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    transactionList: {
        gap: 10 * 1,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15 * 1,
        borderBottomWidth: 0.3,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#FFFFFF0D',
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    transactionIconContainer: {
        marginRight: 12 * SCALE,
    },
    transactionIconCircle: {
        width: 35 * 1,
        height: 35 * 1,
        borderRadius: 17.5 * 1,
        backgroundColor: 'rgba(169, 239, 69, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionIconImage: {
        width: 20 * 1,
        height: 20 * 1,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    transactionDate: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    transactionAmountContainer: {
        alignItems: 'flex-end',
    },
    transactionAmountNGN: {
        fontSize: 14 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    transactionAmountUSD: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    bottomSpacer: {
        height: 20 * 1,
    },
    loadMoreButton: {
        marginTop: 15 * SCALE,
        marginBottom: 10 * SCALE,
        paddingVertical: 12 * SCALE,
        paddingHorizontal: 20 * SCALE,
        backgroundColor: 'rgba(169, 239, 69, 0.1)',
        borderRadius: 10 * SCALE,
        borderWidth: 1,
        borderColor: 'rgba(169, 239, 69, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadMoreText: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: '#A9EF45',
    },
    // Custom Date Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    customDateModalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 30 * SCALE,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20 * SCALE,
        paddingBottom: 15 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    modalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    customDateSubtitle: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 25 * SCALE,
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
    dateInputSection: {
        marginBottom: 20 * SCALE,
    },
    dateInputLabel: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 10 * SCALE,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 12 * SCALE,
        gap: 10 * SCALE,
    },
    dateInput: {
        flex: 1,
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    customDateButtons: {
        flexDirection: 'row',
        gap: 12 * SCALE,
        marginTop: 20 * SCALE,
    },
    customDateButton: {
        flex: 1,
        height: 50 * SCALE,
        borderRadius: 10 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customDateButtonCancel: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    customDateButtonApply: {
        backgroundColor: '#A9EF45',
    },
    customDateButtonDisabled: {
        backgroundColor: 'rgba(169, 239, 69, 0.3)',
        opacity: 0.5,
    },
    customDateButtonTextCancel: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    customDateButtonTextApply: {
        fontSize: 14 * SCALE,
        fontWeight: '500',
        color: '#000000',
    },
});

