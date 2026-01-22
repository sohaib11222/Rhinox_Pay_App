import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    TextInput,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetUSDTTokens, useGetVirtualAccounts, useGetDepositAddress } from '../../../queries/crypto.queries';
import { showSuccessAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Helper function to get coin icon based on currency
const getCoinIcon = (currency: string): any => {
    const upperCurrency = currency.toUpperCase();
    if (upperCurrency.includes('BTC') || upperCurrency === 'BTC' || upperCurrency === 'BITCOIN') {
        return require('../../../assets/login/bitcoin-coin.png');
    } else if (upperCurrency.includes('USDT') || upperCurrency.includes('USDC') || upperCurrency === 'USDT' || upperCurrency === 'USDC' || upperCurrency === 'TETHER') {
        return require('../../../assets/login/usdt-coin.png');
    } else if (upperCurrency.includes('ETH') || upperCurrency === 'ETH' || upperCurrency === 'ETHEREUM') {
        return require('../../../assets/login/usdt-coin.png'); // Using USDT icon as placeholder for ETH
    } else {
        // Default to USDT icon for other currencies
        return require('../../../assets/login/usdt-coin.png');
    }
};

interface Token {
    id: string;
    blockchain: string;
    blockchainName: string;
    currency: string;
    symbol: string;
    name: string;
    displayName: string;
    contractAddress?: string;
    decimals: number;
    isToken: boolean;
    price: string;
    nairaPrice: string;
}

interface VirtualAccount {
    id: string;
    currency: string;
    blockchain: string;
    blockchainName: string;
    availableBalance: string;
    accountBalance: string;
    depositAddresses?: Array<{ address: string }>;
}

const AssetsScreen = () => {
    const navigation = useNavigation();

    // Hide bottom tab bar when this screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const parent = navigation.getParent();
            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: 'none' },
                });
            }
            return () => {
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

    const [searchQuery, setSearchQuery] = useState('');
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [depositAddress, setDepositAddress] = useState<string | null>(null);

    // Fetch available tokens
    const {
        data: tokensData,
        isLoading: isLoadingTokens,
        isError: isTokensError,
        error: tokensError,
        refetch: refetchTokens,
    } = useGetUSDTTokens();

    // Fetch virtual accounts
    const {
        data: virtualAccountsData,
        isLoading: isLoadingVirtualAccounts,
        isError: isVirtualAccountsError,
        error: virtualAccountsError,
        refetch: refetchVirtualAccounts,
    } = useGetVirtualAccounts();

    // Transform tokens
    const availableTokens = useMemo(() => {
        if (!tokensData?.data || !Array.isArray(tokensData.data)) {
            return [];
        }
        return tokensData.data.map((token: any) => ({
            id: token.id || `${token.blockchain}_${token.currency}`,
            blockchain: token.blockchain || '',
            blockchainName: token.blockchainName || token.blockchain || '',
            currency: token.currency || token.symbol || '',
            symbol: token.symbol || token.currency || '',
            name: token.name || token.currency || '',
            displayName: token.displayName || `${token.currency} (${token.blockchainName})`,
            contractAddress: token.contractAddress,
            decimals: token.decimals || 6,
            isToken: token.isToken || false,
            price: token.price || '0',
            nairaPrice: token.nairaPrice || '0',
        }));
    }, [tokensData?.data]);

    // Get unique currencies from virtual accounts
    const uniqueCurrencies = useMemo(() => {
        if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data)) {
            return [];
        }
        const currencies = new Map<string, VirtualAccount>();
        virtualAccountsData.data.forEach((va: any) => {
            const key = va.currency || va.symbol || '';
            if (key && !currencies.has(key)) {
                currencies.set(key, {
                    id: va.id || key,
                    currency: va.currency || va.symbol || '',
                    blockchain: va.blockchain || '',
                    blockchainName: va.blockchainName || va.blockchain || '',
                    availableBalance: va.availableBalance || va.accountBalance || '0.00',
                    accountBalance: va.accountBalance || va.availableBalance || '0.00',
                    depositAddresses: va.depositAddresses || [],
                });
            }
        });
        return Array.from(currencies.values());
    }, [virtualAccountsData?.data]);

    // Filter assets by search query
    const filteredAssets = uniqueCurrencies.filter(asset =>
        asset.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.blockchainName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get networks for selected currency from virtual accounts
    const networksForCurrency = useMemo(() => {
        if (!selectedCurrency || !virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data)) {
            return [];
        }
        const networks = new Map<string, { blockchain: string; blockchainName: string }>();
        virtualAccountsData.data.forEach((va: any) => {
            if (va.currency === selectedCurrency && va.blockchain) {
                if (!networks.has(va.blockchain)) {
                    networks.set(va.blockchain, {
                        blockchain: va.blockchain,
                        blockchainName: va.blockchainName || va.blockchain,
                    });
                }
            }
        });
        return Array.from(networks.values());
    }, [selectedCurrency, virtualAccountsData?.data]);

    // Handle asset press - show network selection modal
    const handleAssetPress = (asset: VirtualAccount) => {
        setSelectedCurrency(asset.currency);
        setShowNetworkModal(true);
    };

    // Handle network selection - fetch address and show QR modal
    const handleNetworkSelect = (blockchain: string) => {
        setSelectedNetwork(blockchain);
        setShowNetworkModal(false);
    };

    // Get deposit address from virtual accounts for selected currency and network
    const depositAddressFromVirtualAccount = useMemo(() => {
        if (!virtualAccountsData?.data || !Array.isArray(virtualAccountsData.data) || !selectedCurrency || !selectedNetwork) {
            return null;
        }
        const account = virtualAccountsData.data.find(
            (va: any) =>
                va.currency === selectedCurrency &&
                va.blockchain === selectedNetwork
        );
        
        if (account?.depositAddresses && Array.isArray(account.depositAddresses) && account.depositAddresses.length > 0) {
            return account.depositAddresses[0]?.address || null;
        }
        return null;
    }, [virtualAccountsData?.data, selectedCurrency, selectedNetwork]);

    // Fetch deposit address from API if not in virtual accounts
    const shouldFetchDepositAddress = useMemo(() => {
        return (
            !!selectedCurrency &&
            !!selectedNetwork &&
            !depositAddressFromVirtualAccount &&
            !isLoadingVirtualAccounts
        );
    }, [selectedCurrency, selectedNetwork, depositAddressFromVirtualAccount, isLoadingVirtualAccounts]);

    const {
        data: depositAddressData,
        isLoading: isLoadingDepositAddress,
        refetch: refetchDepositAddress,
    } = useGetDepositAddress(
        selectedCurrency || '',
        selectedNetwork || '',
        {
            enabled: shouldFetchDepositAddress,
            queryKey: ['crypto', 'deposit-address', selectedCurrency || '', selectedNetwork || ''],
        } as any
    );

    // Set deposit address
    useEffect(() => {
        if (depositAddressFromVirtualAccount) {
            setDepositAddress(depositAddressFromVirtualAccount);
        } else if (depositAddressData?.data?.address) {
            setDepositAddress(depositAddressData.data.address);
        } else if (selectedCurrency && selectedNetwork && !isLoadingDepositAddress) {
            setDepositAddress(null);
        }
    }, [depositAddressFromVirtualAccount, depositAddressData?.data?.address, selectedCurrency, selectedNetwork, isLoadingDepositAddress]);

    // Show QR modal when deposit address is ready
    useEffect(() => {
        if (depositAddress && selectedCurrency && selectedNetwork && !showQRModal) {
            setShowQRModal(true);
        }
    }, [depositAddress, selectedCurrency, selectedNetwork]);

    const handleCopyAddress = async () => {
        if (depositAddress) {
            await Clipboard.setStringAsync(depositAddress);
            showSuccessAlert('Success', 'Address copied to clipboard');
        }
    };

    // Get network name for display
    const getNetworkName = (blockchain: string) => {
        const network = networksForCurrency.find(n => n.blockchain === blockchain);
        return network?.blockchainName || blockchain;
    };

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        await Promise.all([
            refetchTokens(),
            refetchVirtualAccounts(),
        ]);
    };

    const { refreshing, onRefresh } = usePullToRefresh({
        onRefresh: handleRefresh,
        refreshDelay: 2000,
    });

    // Get balance for asset
    const getAssetBalance = (currency: string) => {
        const account = uniqueCurrencies.find(va => va.currency === currency);
        return account?.availableBalance || account?.accountBalance || '0.00';
    };

    // Get price for asset from tokens
    const getAssetPrice = (currency: string) => {
        const token = availableTokens.find(t => t.currency === currency);
        if (token?.price) {
            const priceNum = parseFloat(token.price.replace(/,/g, '')) || 0;
            return priceNum > 0 ? priceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';
        }
        return '0';
    };

    // Get currency name
    const getCurrencyName = (currency: string) => {
        const token = availableTokens.find(t => t.currency === currency);
        return token?.name || currency;
    };

    // Calculate USD value
    const getUSDValue = (currency: string, balance: string) => {
        const price = parseFloat(getAssetPrice(currency).replace(/,/g, '')) || 0;
        const balanceNum = parseFloat(balance) || 0;
        const usdValue = price * balanceNum;
        return usdValue > 0 ? `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0';
    };

    // Get icon background color based on currency
    const getIconBackgroundColor = (currency: string) => {
        const upperCurrency = currency.toUpperCase();
        if (upperCurrency.includes('ETH') || upperCurrency === 'ETH') {
            return '#627EEA'; // Ethereum blue
        } else if (upperCurrency.includes('BTC') || upperCurrency === 'BTC') {
            return '#F7931A'; // Bitcoin orange
        } else if (upperCurrency.includes('USDT') || upperCurrency.includes('USDC')) {
            return '#26A17B'; // Tether green
        } else {
            return '#627EEA'; // Default blue
        }
    };

    const renderAssetCard = ({ item }: { item: VirtualAccount }) => {
        const balance = getAssetBalance(item.currency);
        const price = getAssetPrice(item.currency);
        const currencyName = getCurrencyName(item.currency);
        const usdValue = getUSDValue(item.currency, balance);
        const iconBgColor = getIconBackgroundColor(item.currency);

        return (
            <TouchableOpacity
                style={styles.assetCard}
                onPress={() => handleAssetPress(item)}
            >
                <View style={styles.assetCardHeader}>
                    <View style={styles.assetCardHeaderLeft}>
                        <View style={[styles.assetIconContainer, { backgroundColor: iconBgColor }]}>
                            <Image
                                source={getCoinIcon(item.currency)}
                                style={styles.assetIcon}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.assetTickerContainer}>
                            <ThemedText style={styles.assetTicker}>{item.currency}</ThemedText>
                            <ThemedText style={styles.assetName}>{currencyName}</ThemedText>
                        </View>
                    </View>
                    <View style={styles.priceIndicator}>
                        <Image
                            source={require('../../../assets/Rectangle 25.png')}
                            style={styles.priceIndicatorBar}
                            resizeMode="cover"
                        />
                        <ThemedText style={styles.priceText}>${price}</ThemedText>
                    </View>
                </View>
                <View style={styles.assetCardDivider} />
                <View style={styles.assetCardBody}>
                    <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                    <ThemedText style={styles.balanceAmount}>{balance}{item.currency}</ThemedText>
                    <ThemedText style={styles.balanceUSD}>{usdValue}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#020c19" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => {
                    (navigation as any).navigate('Home', { screen: 'HomeMain' });
                }}>
                    <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Assets</ThemedText>
                <View style={styles.placeholder} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Assets"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Assets Grid */}
            {isLoadingVirtualAccounts ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A9EF45" />
                    <ThemedText style={styles.loadingText}>Loading assets...</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={filteredAssets}
                    renderItem={renderAssetCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.assetsGrid}
                    columnWrapperStyle={styles.assetsRow}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#A9EF45"
                            colors={['#A9EF45']}
                            progressBackgroundColor="#020c19"
                        />
                    }
                />
            )}

            {/* Network Selection Modal */}
            <Modal
                visible={showNetworkModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNetworkModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Network</ThemedText>
                            <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                                <MaterialCommunityIcons name="close" size={24 * SCALE} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalList}>
                            {networksForCurrency.map((network) => (
                                <TouchableOpacity
                                    key={network.blockchain}
                                    style={styles.modalItem}
                                    onPress={() => handleNetworkSelect(network.blockchain)}
                                >
                                    <View style={styles.modalItemInfo}>
                                        <ThemedText style={styles.modalItemName}>{network.blockchainName}</ThemedText>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={selectedNetwork === network.blockchain ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={24 * SCALE}
                                        color={selectedNetwork === network.blockchain ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => {
                                if (networksForCurrency.length > 0) {
                                    handleNetworkSelect(networksForCurrency[0].blockchain);
                                }
                            }}
                        >
                            <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                visible={showQRModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowQRModal(false);
                    setDepositAddress(null);
                    setSelectedCurrency(null);
                    setSelectedNetwork(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <View style={styles.qrModalHeader}>
                            <ThemedText style={styles.qrModalTitle}>Save QR Code</ThemedText>
                            <TouchableOpacity onPress={() => {
                                setShowQRModal(false);
                                setDepositAddress(null);
                                setSelectedCurrency(null);
                                setSelectedNetwork(null);
                            }}>
                                <View style={styles.qrModalCloseCircle}>
                                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {isLoadingDepositAddress ? (
                            <View style={styles.qrLoadingContainer}>
                                <ActivityIndicator size="large" color="#A9EF45" />
                                <ThemedText style={styles.qrLoadingText}>Generating deposit address...</ThemedText>
                            </View>
                        ) : depositAddress ? (
                            <>
                                <View style={styles.qrWhiteCard}>
                                    <ThemedText style={styles.qrDepositTitle}>Deposit {selectedCurrency}</ThemedText>

                                    <View style={styles.qrCodeContainer}>
                                        <View style={styles.qrCodeBox}>
                                            <View style={styles.qrCodePlaceholder}>
                                                <MaterialCommunityIcons name="qrcode" size={170 * SCALE} color="#000000" />
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.qrAddressContainer}>
                                        <View style={styles.qrAddressBox}>
                                            <ThemedText style={styles.qrAddressText} numberOfLines={1} ellipsizeMode="middle">
                                                {depositAddress}
                                            </ThemedText>
                                            <TouchableOpacity onPress={handleCopyAddress}>
                                                <MaterialCommunityIcons name="content-copy" size={20 * SCALE} color="#A9EF45" />
                                            </TouchableOpacity>
                                        </View>
                                        <ThemedText style={styles.qrNetworkText}>Network: {selectedNetwork ? getNetworkName(selectedNetwork) : ''}</ThemedText>
                                    </View>
                                </View>

                                <View style={styles.qrModalButtons}>
                                    <TouchableOpacity
                                        style={styles.downloadButton}
                                        onPress={() => {
                                            // Handle download QR code functionality
                                        }}
                                    >
                                        <ThemedText style={styles.downloadButtonText}>Download</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            // Handle share QR code functionality
                                        }}
                                    >
                                        <ThemedText style={styles.shareButtonText}>Share</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AssetsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020c19',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        paddingTop: 30 * SCALE,
        paddingBottom: 20 * SCALE,
    },
    backButton: {
        backgroundColor: '#FFFFFF08',
        borderWidth: 0.3,
        borderColor: '#FFFFFF33',
        borderRadius: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 24 * SCALE,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 12 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
        gap: 10 * SCALE,
    },
    searchInput: {
        flex: 1,
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10 * SCALE,
    },
    loadingText: {
        fontSize: 14 * SCALE,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    assetsGrid: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        paddingBottom: 100 * SCALE,
    },
    assetsRow: {
        justifyContent: 'space-between',
        marginBottom: 15 * SCALE,
    },
    assetCard: {
        width: (SCREEN_WIDTH - SCREEN_WIDTH * 0.047 * 2 - 15 * SCALE) / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12 * SCALE,
        padding: 12 * SCALE,
    },
    assetCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12 * SCALE,
    },
    assetCardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10 * SCALE,
        flex: 1,
    },
    assetIconContainer: {
        width: 40 * SCALE,
        height: 40 * SCALE,
        borderRadius: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8 * SCALE,
    },
    assetIcon: {
        width: 24 * SCALE,
        height: 24 * SCALE,
    },
    assetTickerContainer: {
        flex: 1,
    },
    assetTicker: {
        fontSize: 14 * SCALE,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2 * SCALE,
    },
    assetName: {
        fontSize: 10 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    priceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 * SCALE,
        marginTop: 2 * SCALE,
    },
    priceIndicatorBar: {
        width: 14 * SCALE,
        height: 9 * SCALE,
    },
    priceText: {
        fontSize: 10 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    assetCardDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginTop: 5 * SCALE,
        marginBottom: 12 * SCALE,
        width: '100%',
    },
    assetCardBody: {
        marginTop: 0,
    },
    balanceLabel: {
        fontSize: 10 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 6 * SCALE,
    },
    balanceAmount: {
        fontSize: 20 * SCALE,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    balanceUSD: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 30 * SCALE,
        width: '100%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    modalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 12 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
        gap: 10 * SCALE,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    modalList: {
        maxHeight: 400 * SCALE,
        paddingHorizontal: 20 * SCALE,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15 * SCALE,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalItemIcon: {
        width: 40 * SCALE,
        height: 40 * SCALE,
        borderRadius: 20 * SCALE,
        marginRight: 12 * SCALE,
    },
    modalItemInfo: {
        flex: 1,
    },
    modalItemName: {
        fontSize: 14 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    modalItemBalance: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    modalLoadingContainer: {
        padding: 40 * SCALE,
        alignItems: 'center',
        gap: 10 * SCALE,
    },
    modalLoadingText: {
        fontSize: 14 * SCALE,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    applyButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginTop: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    // QR Modal Styles
    qrModalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 30 * SCALE,
        width: '100%',
        maxHeight: '90%',
    },
    qrModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    qrModalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    qrModalCloseCircle: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 12 * SCALE,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrLoadingContainer: {
        padding: 40 * SCALE,
        alignItems: 'center',
        gap: 10 * SCALE,
    },
    qrLoadingText: {
        fontSize: 14 * SCALE,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    qrWhiteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20 * SCALE,
        padding: 20 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    qrDepositTitle: {
        fontSize: 18 * SCALE,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 20 * SCALE,
        textAlign: 'center',
    },
    qrCodeContainer: {
        alignItems: 'center',
        marginBottom: 20 * SCALE,
    },
    qrCodeBox: {
        width: 200 * SCALE,
        height: 200 * SCALE,
        borderRadius: 15 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20 * SCALE,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#00000008',
    },
    qrCodePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrAddressContainer: {
        marginBottom: 0,
    },
    qrAddressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 12 * SCALE,
        gap: 10 * SCALE,
        borderWidth: 1,
        borderColor: '#A9EF45',
        marginBottom: 8 * SCALE,
    },
    qrAddressText: {
        flex: 1,
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#000000',
    },
    qrNetworkText: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(0, 0, 0, 0.5)',
        paddingLeft: 0,
    },
    qrModalButtons: {
        flexDirection: 'row',
        gap: 12 * SCALE,
        paddingHorizontal: 20 * SCALE,
    },
    downloadButton: {
        flex: 1,
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 30 * SCALE,
        width: '100%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    modalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    modalList: {
        maxHeight: 400 * SCALE,
        paddingHorizontal: 20 * SCALE,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15 * SCALE,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalItemInfo: {
        flex: 1,
    },
    modalItemName: {
        fontSize: 14 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    applyButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginTop: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
});
