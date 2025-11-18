import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface Asset {
    id: string;
    ticker: string;
    name: string;
    balance: string;
    usdValue: string;
    price: string;
    priceChange: 'up' | 'down';
    icon: any;
    address: string;
}

const ASSETS: Asset[] = [
    {
        id: '1',
        ticker: 'ETH',
        name: 'Ethereum',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    },
    {
        id: '2',
        ticker: 'SOL',
        name: 'Solana',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'So11111111111111111111111111111111111111112',
    },
    {
        id: '3',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    {
        id: '4',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    {
        id: '5',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    {
        id: '6',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    {
        id: '7',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    {
        id: '8',
        ticker: 'BTC',
        name: 'Bitcoin',
        balance: '10.123',
        usdValue: '20,000',
        price: '3,750',
        priceChange: 'down',
        icon: require('../../../assets/CurrencyBtc.png'),
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
];

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
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    const filteredAssets = ASSETS.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssetPress = (asset: Asset) => {
        setSelectedAsset(asset);
        setShowQRModal(true);
    };

    const handleCopyAddress = async () => {
        if (selectedAsset) {
            await Clipboard.setStringAsync(selectedAsset.address);
            // You can add a toast notification here
        }
    };

    const renderAssetCard = ({ item }: { item: Asset }) => (
        <TouchableOpacity
            style={styles.assetCard}
            onPress={() => handleAssetPress(item)}
        >
            <View style={styles.assetCardHeader}>
                <View style={styles.assetCardHeaderLeft}>
                    <Image
                        source={item.icon}
                        style={styles.assetIcon}
                        resizeMode="cover"
                    />
                    <View style={styles.assetTickerContainer}>
                        <ThemedText style={styles.assetTicker}>{item.ticker}</ThemedText>
                        <ThemedText style={styles.assetName}>{item.name}</ThemedText>
                    </View>
                </View>
                <View style={[styles.priceIndicator, item.priceChange === 'down' && styles.priceIndicatorDown]}>
                    <Image
                        source={require('../../../assets/Rectangle 25.png')}
                        style={{ width: 14, height: 9 }}
                        resizeMode="cover"
                    />
                    <ThemedText style={styles.priceText}>${item.price}</ThemedText>
                </View>
            </View>
            <View style={styles.assetCardDivider} />
            <View style={styles.assetCardBody}>
                <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
                <ThemedText style={styles.balanceAmount}>{item.balance}{item.ticker}</ThemedText>
                <ThemedText style={styles.balanceUSD}>${item.usdValue}</ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#020c19" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={{backgroundColor:'#FFFFFF08', borderWidth:0.3, borderColor:'#FFFFFF33', borderRadius:15, padding:5}} onPress={() => {
                    // Navigate back to Home tab instead of Settings tab
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
            <FlatList
                data={filteredAssets}
                renderItem={renderAssetCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.assetsGrid}
                columnWrapperStyle={styles.assetsRow}
                showsVerticalScrollIndicator={false}
            />


            {/* QR Code Modal */}
            <Modal
                visible={showQRModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowQRModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <View style={styles.qrModalHeader}>
                            <ThemedText style={styles.qrModalTitle}>Save QR Code</ThemedText>
                            <TouchableOpacity onPress={() => setShowQRModal(false)}>
                                <View style={styles.qrModalCloseCircle}>
                                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrWhiteCard}>
                            <ThemedText style={styles.qrDepositTitle}>Deposit {selectedAsset?.ticker}</ThemedText>

                            <View style={styles.qrCodeContainer}>
                                <View style={styles.qrCodeBox}>
                                    {/* QR Code Placeholder - Replace with actual QR code generation */}
                                    <View style={styles.qrCodePlaceholder}>
                                        <MaterialCommunityIcons name="qrcode" size={170 * SCALE} color="#000000" />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.qrAddressContainer}>
                                <View style={styles.qrAddressBox}>
                                    <ThemedText style={styles.qrAddressText} numberOfLines={1} ellipsizeMode="middle">
                                        {selectedAsset?.address}
                                    </ThemedText>
                                    <TouchableOpacity onPress={handleCopyAddress}>
                                        <MaterialCommunityIcons name="content-copy" size={20 * SCALE} color="#A9EF45" />
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.qrNetworkText}>Network: {selectedAsset?.name}</ThemedText>
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
        paddingTop: 15 * SCALE,
        paddingBottom: 20 * SCALE,
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
        gap: 8 * SCALE,
        flex: 1,
    },
    assetIcon: {
        width: 33 * 1,
        height: 33 * 1,
        borderRadius: 20 * SCALE,
    },
    assetTickerContainer: {
        flex: 1,
    },
    assetTicker: {
        fontSize: 12 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 2 * SCALE,
    },
    assetName: {
        fontSize: 8 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    priceIndicator: {
        borderRadius: 6 * SCALE,
        paddingHorizontal: 6 * SCALE,
        paddingVertical: 3 * SCALE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 * SCALE,
        marginTop: 20,
    },
    priceIndicatorDown: {
        // backgroundColor: 'rgba(255, 0, 0, 0.2)',
    },
    priceText: {
        fontSize: 8 * 1,
        fontWeight: '400',
        color: '#fff',
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
        fontSize: 8 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 6 * SCALE,
    },
    balanceAmount: {
        fontSize: 20 * 1,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    balanceUSD: {
        fontSize: 10 * 1,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    // QR Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
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
});

