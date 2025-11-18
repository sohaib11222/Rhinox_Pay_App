import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
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

    // Mock data - Replace with API calls later
    const totalAmount = '$7,000.23';
    const summaryData: SummaryData = {
        incoming: {
            ngn: '2,000,000.00NGN',
            usd: '$20,000',
        },
        outgoing: {
            ngn: '500.00NGN',
            usd: '$0.001',
        },
    };

    // Chart data - Replace with API data (values represent bar heights in pixels from Figma)
    // Chart area: 176px tall, but bars should not exceed the visible area
    // Adjusting values to ensure bars fit within the chart area without being cut off
    const chartData: ChartData[] = [
        { time: '12 - 1 AM', value: 150 }, // Reduced to fit within chart
        { time: '1 - 2 AM', value: 86 },    // Medium height
        { time: '2 - 3 AM', value: 220 },  // Reduced to fit within chart
        { time: '3 - 4 AM', value: 140 },  // Tallest bar (active)
        { time: '4 - 5 AM', value: 220 },  // Reduced to fit within chart
    ];

    const maxChartValue = 176; // Maximum chart area height in pixels
    const CHART_MAX_HEIGHT = 176 * SCALE;
    const CHART_BOTTOM_PADDING = 20 * SCALE; // Space for X-axis labels
    const CHART_TOP_PADDING = 5 * SCALE; // Space at top to prevent cutoff
    const AVAILABLE_CHART_HEIGHT = CHART_MAX_HEIGHT - CHART_BOTTOM_PADDING - CHART_TOP_PADDING;

    // Transaction data - Replace with API calls
    const fiatTransactions: Transaction[] = [
        {
            id: '1',
            type: 'fiat',
            title: 'Send Transactions',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'send-2',
        },
        {
            id: '2',
            type: 'fiat',
            title: 'Fund Transaction',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'send-square',
        },
        {
            id: '3',
            type: 'fiat',
            title: 'Withdrawals',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'send-2',
        },
        {
            id: '4',
            type: 'fiat',
            title: 'Bill Payments',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'document-download',
        },
        {
            id: '5',
            type: 'fiat',
            title: 'P2P Transactions',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'account-group',
        },
    ];

    const cryptoTransactions: Transaction[] = [
        {
            id: '6',
            type: 'crypto',
            title: 'Crypto Withdrawals',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'bitcoin',
        },
        {
            id: '7',
            type: 'crypto',
            title: 'Crypto Deposit',
            date: 'Oct 16, 2025',
            amountNGN: 'N2,000,0000',
            amountUSD: '$5,000.00',
            icon: 'bitcoin',
        },
    ];

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


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#020c19" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Transaction History</ThemedText>
                </View>

                {/* Chart Section */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <ThemedText style={styles.chartLabel}>Total</ThemedText>
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
                            onPress={() => setSelectedPeriod('Custom')}
                        >
                            <ThemedText style={[styles.periodButtonText, selectedPeriod === 'Custom' && styles.periodButtonTextActive]}>
                                Custom
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Chart Container */}
                    <View style={styles.chartContainer}>
                        {/* Y-axis Labels */}
                        <View style={styles.yAxisLabels}>
                            <ThemedText style={styles.yAxisText}>$800</ThemedText>
                            <ThemedText style={styles.yAxisText}>$600</ThemedText>
                            <ThemedText style={styles.yAxisText}>$400</ThemedText>
                            <ThemedText style={styles.yAxisText}>$200</ThemedText>
                            <ThemedText style={styles.yAxisText}>$0</ThemedText>
                        </View>

                        {/* Chart Area - Scrollable */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chartScrollContent}
                            style={styles.chartScrollView}
                        >
                            <View style={styles.chartArea}>
                                {/* Horizontal Grid Lines */}
                                <View style={styles.gridLines}>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <View key={i} style={styles.gridLine} />
                                    ))}
                                </View>

                                {/* Chart Bars */}
                                <View style={styles.barsContainer}>
                                    {chartData.map((data, index) => {
                                        // Calculate bar height relative to available space, ensuring it doesn't exceed
                                        const barHeight = Math.min(
                                            (data.value / maxChartValue) * AVAILABLE_CHART_HEIGHT,
                                            AVAILABLE_CHART_HEIGHT
                                        );
                                        // 4th bar (index 3) should be bright green, others light green
                                        const isActive = index === 3;
                                        return (
                                            <View key={index} style={styles.barWrapper}>
                                                <View style={[
                                                    styles.bar,
                                                    { height: barHeight },
                                                    isActive ? styles.barActive : styles.barInactive
                                                ]} />
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* X-axis Labels */}
                                <View style={styles.xAxisLabels}>
                                    {chartData.map((data, index) => (
                                        <ThemedText key={index} style={styles.xAxisText}>
                                            {data.time}
                                        </ThemedText>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
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
                        <View style={styles.summaryAmountContainer}>
                            <View style={styles.summaryAmountRow}>
                                <ThemedText style={styles.summaryAmountMain}>2,000,000.00</ThemedText>
                                <ThemedText style={styles.summaryAmountCurrency}>NGN</ThemedText>
                            </View>
                        </View>
                        <ThemedText style={styles.summaryUSD}>{summaryData.incoming.usd}</ThemedText>
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
                        <View style={styles.summaryAmountContainer}>
                            <View style={styles.summaryAmountRow}>
                                <ThemedText style={styles.summaryAmountMainWhite}>500.00</ThemedText>
                                <ThemedText style={styles.summaryAmountCurrencyWhite}>NGN</ThemedText>
                            </View>
                        </View>
                        <ThemedText style={styles.summaryUSDWhite}>{summaryData.outgoing.usd}</ThemedText>
                    </View>
                </View>

                {/* Transaction List Card */}
                <View style={styles.transactionCard}>
                    {/* Fiat Section */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
                        <ThemedText style={styles.sectionFilterLabel}>Fiat</ThemedText>
                    </View>

                    <View style={styles.transactionList}>
                        {fiatTransactions.map((transaction) => (
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

                    {/* Crypto Section */}
                    <View style={[styles.sectionHeader, { marginTop: 20 * SCALE }]}>
                        <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
                        <ThemedText style={styles.sectionFilterLabel}>Crypto</ThemedText>
                    </View>

                    <View style={styles.transactionList}>
                        {cryptoTransactions.map((transaction) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={styles.transactionItem}
                                onPress={() => {
                                    if (transaction.title === 'Crypto Deposit') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('CryptoDeposit' as never);
                                    } else if (transaction.title === 'Crypto Withdrawals') {
                                        // @ts-ignore - allow parent route name
                                        navigation.navigate('CryptoWithdrawals' as never);
                                    } else if (transaction.title === 'Crypto Received') {
                                        // @ts-ignore - allow parent route name
                                        // navigation.navigate('CryptoReceived' as never);
                                        // TODO: Add Crypto Received screen navigation
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
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        paddingTop: 15 * SCALE,
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
});

