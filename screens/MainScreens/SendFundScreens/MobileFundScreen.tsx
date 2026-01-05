import React, { useState, useMemo, useEffect } from 'react';
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
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetTransferEligibility, useGetTransferReceipt } from '../../../queries/transfer.queries';
import { useGetPaymentSettingsMobileMoneyProviders } from '../../../queries/paymentSettings.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useInitiateTransfer, useVerifyTransfer } from '../../../mutations/transfer.mutations';
import { showSuccessAlert, showErrorAlert, showInfoAlert } from '../../../utils/customAlert';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

const COUNTRIES = [
    { id: 1, name: 'Nigeria', flag: '🇳🇬', selected: false },
    { id: 2, name: 'Botswana', flag: '🇧🇼', selected: false },
    { id: 3, name: 'Ghana', flag: '🇬🇭', selected: false },
    { id: 4, name: 'Kenya', flag: '🇰🇪', selected: false },
    { id: 5, name: 'South Africa', flag: '🇿🇦', selected: false },
    { id: 6, name: 'Tanzania', flag: '🇹🇿', selected: false },
    { id: 7, name: 'Uganda', flag: '🇺🇬', selected: false },
];

const PROVIDERS = [
    { id: 1, name: 'MTN', logo: require('../../../assets/Ellipse 21 (2).png') },
    { id: 2, name: 'Vodafone', logo: require('../../../assets/Ellipse 21.png') },
];

const MobileFundScreen = () => {
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

    const queryClient = useQueryClient();
    const [balance, setBalance] = useState('0');
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<number | null>(1); // Default to Nigeria
    const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
    const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
    const [selectedCurrency, setSelectedCurrency] = useState('NGN');
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
    const [tempSelectedProvider, setTempSelectedProvider] = useState<number | null>(null);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [pin, setPin] = useState('');
    const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
    const [emailCode, setEmailCode] = useState('');
    const [authenticatorCode, setAuthenticatorCode] = useState('');
    const [transactionId, setTransactionId] = useState<number | null>(null);
    const [transferData, setTransferData] = useState<any>(null);
    const [searchProviderQuery, setSearchProviderQuery] = useState('');

    // Check transfer eligibility
    const {
        data: eligibilityData,
        isLoading: isLoadingEligibility,
        refetch: refetchEligibility,
    } = useGetTransferEligibility();

    // Fetch mobile money providers
    const {
        data: providersData,
        isLoading: isLoadingProviders,
    } = useGetPaymentSettingsMobileMoneyProviders({
        countryCode: selectedCountryCode,
        currency: selectedCurrency,
    });

    // Fetch countries
    const {
        data: countriesData,
        isLoading: isLoadingCountries,
    } = useGetCountries();

    // Fetch wallet balances
    const {
        data: balancesData,
        isLoading: isLoadingBalances,
    } = useGetWalletBalances();

    // Transform providers from API
    const providers = useMemo(() => {
        if (!providersData?.data || !Array.isArray(providersData.data)) {
            return PROVIDERS;
        }
        return providersData.data.map((provider: any) => ({
            id: provider.id,
            name: provider.name || provider.code || 'Unknown',
            code: provider.code || '',
            logo: provider.logoUrl 
                ? { uri: `${API_BASE_URL.replace('/api', '')}${provider.logoUrl}` }
                : require('../../../assets/Ellipse 21 (2).png'),
            rawData: provider,
        }));
    }, [providersData?.data]);

    // Filter providers by search query
    const filteredProviders = useMemo(() => {
        if (!searchProviderQuery.trim()) {
            return providers;
        }
        const query = searchProviderQuery.toLowerCase();
        return providers.filter((provider) =>
            provider.name.toLowerCase().includes(query)
        );
    }, [providers, searchProviderQuery]);

    // Transform countries from API
    const countries = useMemo(() => {
        if (!countriesData?.data || !Array.isArray(countriesData.data)) {
            return COUNTRIES;
        }
        return countriesData.data.map((country: any, index: number) => {
            const flagValue = country.flag || '';
            const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
            const flagUrl = isFlagUrl 
                ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
                : null;
            const defaultFlag = require('../../../assets/login/nigeria-flag.png');
            
            return {
                id: country.id || index + 1,
                name: country.name || '',
                code: country.code || '',
                flag: defaultFlag,
                flagUrl: flagUrl,
            };
        });
    }, [countriesData?.data]);

    // Get currency from country code
    const getCurrencyFromCountryCode = (code: string): string => {
        const currencyMap: { [key: string]: string } = {
            'NG': 'NGN',
            'KE': 'KES',
            'GH': 'GHS',
            'ZA': 'ZAR',
            'BW': 'BWP',
            'TZ': 'TZS',
            'UG': 'UGX',
        };
        return currencyMap[code] || 'NGN';
    };

    // Get balance for selected currency
    const fiatBalance = useMemo(() => {
        if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) {
            return '0';
        }
        const wallet = balancesData.data.fiat.find(
            (w: any) => w.currency === selectedCurrency
        );
        return wallet?.balance || '0';
    }, [balancesData?.data?.fiat, selectedCurrency]);

    // Update balance when currency changes
    useEffect(() => {
        if (fiatBalance) {
            const formatted = parseFloat(fiatBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            setBalance(formatted);
        }
    }, [fiatBalance]);

    // Check eligibility on mount
    useEffect(() => {
        if (eligibilityData?.data) {
            const eligible = eligibilityData.data.eligible;
            if (!eligible) {
                showErrorAlert('Not Eligible', eligibilityData.data.message || 'You cannot complete your transaction because you are yet to complete your KYC');
            }
        }
    }, [eligibilityData?.data]);

    // Initiate transfer mutation
    const initiateTransferMutation = useInitiateTransfer({
        onSuccess: (data) => {
            const transactionIdFromResponse = data.data?.id;
            if (transactionIdFromResponse) {
                setTransactionId(transactionIdFromResponse);
                setTransferData(data.data);
                setShowSummaryModal(false);
                setShowPinModal(true);
                showInfoAlert('OTP Sent', 'Please check your email for the verification code');
            }
        },
        onError: (error: any) => {
            showErrorAlert('Error', error?.message || 'Failed to initiate transfer');
        },
    });

    // Verify transfer mutation
    const verifyTransferMutation = useVerifyTransfer({
        onSuccess: (data) => {
            showSuccessAlert('Success', 'Transfer completed successfully', () => {
                setShowPinModal(false);
                setShowSecurityModal(false);
                setShowSuccessModal(true);
                // Invalidate queries to refresh balances
                queryClient.invalidateQueries({ queryKey: ['home', 'wallets'] });
                queryClient.invalidateQueries({ queryKey: ['wallets'] });
            });
        },
        onError: (error: any) => {
            showErrorAlert('Error', error?.message || 'Failed to verify transfer');
        },
    });

    // Get transfer receipt
    const {
        data: receiptData,
        isLoading: isLoadingReceipt,
    } = useGetTransferReceipt(
        transactionId ? String(transactionId) : '',
        {
            enabled: !!transactionId && showReceiptModal,
        }
    );

    const handlePinPress = (num: string) => {
        setLastPressedButton(num);
        setTimeout(() => {
            setLastPressedButton(null);
        }, 200);

        // Only allow numeric digits for PIN
        if (num === '.' || !/^\d$/.test(num)) {
            return;
        }

        if (pin.length < 5) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 5) {
                // Auto proceed to security verification
                setTimeout(() => {
                    setShowPinModal(false);
                    setShowSecurityModal(true);
                }, 300);
            }
        }
    };

    const handlePinBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleSecurityComplete = () => {
        if (!transactionId) {
            showErrorAlert('Error', 'Transaction ID not found');
            return;
        }
        if (!emailCode || emailCode.length !== 5) {
            showErrorAlert('Validation Error', 'Please enter a valid 5-digit email code');
            return;
        }
        if (!pin || pin.length !== 5) {
            showErrorAlert('Validation Error', 'Please enter a valid 5-digit PIN');
            return;
        }

        // Verify transfer
        verifyTransferMutation.mutate({
            transactionId: transactionId,
            emailCode: emailCode,
            pin: pin,
        });
    };

    const handleSummaryComplete = () => {
        // Validation
        if (!amount || parseFloat(amount.replace(/,/g, '')) <= 0) {
            showErrorAlert('Validation Error', 'Please enter a valid amount');
            return;
        }
        if (!selectedProvider) {
            showErrorAlert('Validation Error', 'Please select a mobile money provider');
            return;
        }
        if (!phoneNumber || phoneNumber.length < 10) {
            showErrorAlert('Validation Error', 'Please enter a valid phone number (minimum 10 characters)');
            return;
        }
        if (!eligibilityData?.data?.eligible) {
            showErrorAlert('Not Eligible', eligibilityData?.data?.message || 'You cannot complete your transaction because you are yet to complete your KYC');
            return;
        }

        // Initiate transfer
        const numericAmount = amount.replace(/,/g, '');
        
        initiateTransferMutation.mutate({
            amount: numericAmount,
            currency: selectedCurrency,
            countryCode: selectedCountryCode,
            channel: 'mobile_money',
            providerId: selectedProvider,
            phoneNumber: phoneNumber,
        });
    };

    // Check if form is valid
    const isFormValid = useMemo(() => {
        const numericAmount = amount.replace(/,/g, '');
        return amount.trim() !== '' &&
               parseFloat(numericAmount) > 0 &&
               selectedProvider !== null &&
               phoneNumber.length >= 10 &&
               eligibilityData?.data?.eligible === true;
    }, [amount, selectedProvider, phoneNumber, eligibilityData?.data?.eligible]);

    const handleViewTransaction = () => {
        setShowSuccessModal(false);
        setShowReceiptModal(true);
    };

    const handleSuccessCancel = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    const handleReceiptClose = () => {
        setShowReceiptModal(false);
        navigation.goBack();
    };

    const getCurrencySymbol = () => {
        if (selectedCurrency === 'NGN') return '₦';
        if (selectedCurrency === 'KES') return 'Ksh';
        if (selectedCurrency === 'GHS') return 'GHC';
        if (selectedCurrency === 'ZAR') return 'R';
        return selectedCurrency;
    };

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        try {
            await Promise.all([
                refetchEligibility(),
                // Refetch providers, countries, and balances if needed
            ]);
            console.log('[MobileFund] Data refreshed successfully');
        } catch (error) {
            console.error('[MobileFund] Error refreshing data:', error);
        }
    };

    const { refreshing, onRefresh } = usePullToRefresh({
        onRefresh: handleRefresh,
        refreshDelay: 2000,
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                    <TouchableOpacity onPress={() => {
                        // Navigate back to Home tab instead of Settings tab
                        (navigation as any).navigate('Home', { screen: 'HomeMain' });
                    }}>
                        <View style={styles.backButtonCircle}>
                            <MaterialCommunityIcons name="chevron-left" size={20 * SCALE} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Fund Wallet</ThemedText>
                    <View style={styles.placeholder} />
                </View>

                {/* Balance Card */}
                <View style={styles.balanceCardContainer}>
                    <LinearGradient
                        colors={['#A9EF4533', '#FFFFFF0D']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceCardContent}>
                            <ThemedText style={styles.balanceLabel}>My Balance</ThemedText>
                            <View style={styles.balanceRow}>
                                {isLoadingBalances ? (
                                    <ActivityIndicator size="small" color="#A9EF45" />
                                ) : (
                                    <>
                                        <Image
                                            source={require('../../../assets/Vector (34).png')}
                                            style={styles.walletIcon}
                                            resizeMode="cover"
                                        />
                                        <ThemedText style={styles.balanceAmount}>{getCurrencySymbol()}{balance}</ThemedText>
                                    </>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.countrySelector}
                            onPress={() => setShowCountryModal(true)}
                            disabled={isLoadingCountries}
                        >
                            {isLoadingCountries ? (
                                <ActivityIndicator size="small" color="#A9EF45" />
                            ) : (
                                <>
                                    {(() => {
                                        const country = countries.find(c => c.id === selectedCountry);
                                        const flagSource = country?.flagUrl 
                                            ? { uri: country.flagUrl }
                                            : country?.flag || require('../../../assets/login/nigeria-flag.png');
                                        return (
                                            <Image
                                                source={flagSource}
                                                style={styles.countryFlagImage}
                                                resizeMode="cover"
                                            />
                                        );
                                    })()}
                                    <ThemedText style={styles.countryNameText}>{selectedCountryName}</ThemedText>
                                    <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Main Card */}
                <View style={styles.mainCard}>
                    {/* Amount Input Section */}
                    <View style={styles.amountSection}>
                        {/* <ThemedText style={styles.amountLabel}>Enter Amount</ThemedText> */}
                        <View style={styles.amountInputLabelContainer}>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={(text) => {
                                    // Remove commas and format
                                    const numericValue = text.replace(/,/g, '');
                                    if (numericValue === '' || /^\d+$/.test(numericValue)) {
                                        setAmount(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            />
                            <ThemedText style={styles.amountInputLabel}>{getCurrencySymbol()}</ThemedText>
                        </View>
                    </View>

                    {/* Provider Section */}
                    <View style={styles.providerSection}>
                        <TouchableOpacity
                            style={styles.providerField}
                            onPress={() => setShowProviderModal(true)}
                        >
                            <ThemedText style={[styles.providerFieldText, !selectedProvider && styles.providerFieldPlaceholder]}>
                                {selectedProvider ? providers.find(p => p.id === selectedProvider)?.name : 'Select Provider'}
                            </ThemedText>
                            <MaterialCommunityIcons name="chevron-down" size={18 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Phone Number Section */}
                    <View style={styles.providerSection}>
                        <View style={styles.providerField}>
                            <TextInput
                                style={styles.providerFieldText}
                                placeholder="Enter Phone Number"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    // Remove non-numeric characters
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setPhoneNumber(numericText);
                                }}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Important Notes Section */}
                </View>
                    <View style={styles.notesSection}>
                        <View style={styles.noteItem}>
                            <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#A9EF45" />
                            <ThemedText style={styles.noteText}>You will receive a mobile money prompt to confirm your payment</ThemedText>
                        </View>
                        <View style={styles.noteItem}>
                            <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#A9EF45" />
                            <ThemedText style={styles.noteText}>Payment will take a few minutes to reflect</ThemedText>
                        </View>
                        <View style={styles.noteItem}>
                            <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#A9EF45" />
                            <ThemedText style={styles.noteText}>
                                Fees : {transferData?.fee 
                                    ? `${getCurrencySymbol()}${parseFloat(transferData.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'Calculating...'}
                            </ThemedText>
                        </View>
                    </View>
            </ScrollView>

            {/* Proceed Button - Fixed at Bottom */}
            <View style={styles.proceedButtonContainer}>
                <TouchableOpacity
                    style={[
                        styles.proceedButton,
                        (!isFormValid || initiateTransferMutation.isPending || isLoadingEligibility) && styles.proceedButtonDisabled
                    ]}
                    onPress={() => setShowSummaryModal(true)}
                    disabled={!isFormValid || initiateTransferMutation.isPending || isLoadingEligibility}
                >
                    {initiateTransferMutation.isPending || isLoadingEligibility ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : (
                        <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
                    )}
                </TouchableOpacity>
            </View>

            {/* Country Selection Modal */}
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
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
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
                                {countries.map((c) => {
                                    const flagSource = c.flagUrl 
                                        ? { uri: c.flagUrl }
                                        : c.flag;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={styles.countryItem}
                                            onPress={() => {
                                                setSelectedCountry(c.id);
                                                setSelectedCountryName(c.name);
                                                setSelectedCountryCode(c.code);
                                                setSelectedCurrency(getCurrencyFromCountryCode(c.code));
                                                setShowCountryModal(false);
                                            }}
                                        >
                                            <Image
                                                source={flagSource}
                                                style={styles.countryFlagImage}
                                                resizeMode="cover"
                                            />
                                            <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                                            <MaterialCommunityIcons
                                                name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                                                size={24 * SCALE}
                                                color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
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

            {/* Select Provider Modal */}
            <Modal
                visible={showProviderModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProviderModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.providerModalContent}>
                        {/* Modal Header */}
                        <View style={styles.providerModalHeader}>
                            <ThemedText style={styles.providerModalTitle}>Select Provider</ThemedText>
                            <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Provider"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={searchProviderQuery}
                                onChangeText={setSearchProviderQuery}
                            />
                        </View>

                        {/* Provider List */}
                        {isLoadingProviders ? (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <ActivityIndicator size="small" color="#A9EF45" />
                                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, marginTop: 10 }}>
                                    Loading providers...
                                </ThemedText>
                            </View>
                        ) : filteredProviders.length > 0 ? (
                            <ScrollView style={styles.providerList}>
                                {filteredProviders.map((provider) => (
                                    <TouchableOpacity
                                        key={provider.id}
                                        style={styles.providerItem}
                                        onPress={() => setTempSelectedProvider(provider.id)}
                                    >
                                        <Image
                                            source={provider.logo}
                                            style={styles.providerLogo}
                                            resizeMode="cover"
                                        />
                                        <ThemedText style={styles.providerItemName}>{provider.name}</ThemedText>
                                        <MaterialCommunityIcons
                                            name={tempSelectedProvider === provider.id ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24 * SCALE}
                                            color={tempSelectedProvider === provider.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 * SCALE, textAlign: 'center', paddingHorizontal: 20 }}>
                                    {searchProviderQuery ? 'No providers found' : 'No mobile money providers available for this country.'}
                                </ThemedText>
                            </View>
                        )}

                        {/* Apply Button */}
                        <TouchableOpacity
                            style={[styles.applyButton, !tempSelectedProvider && styles.applyButtonDisabled]}
                            onPress={() => {
                                if (tempSelectedProvider) {
                                    setSelectedProvider(tempSelectedProvider);
                                    setTempSelectedProvider(null);
                                    setSearchProviderQuery('');
                                    setShowProviderModal(false);
                                }
                            }}
                            disabled={!tempSelectedProvider}
                        >
                            <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Summary Modal */}
            <Modal
                visible={showSummaryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSummaryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.summaryModalContent}>
                        <View style={styles.summaryModalHeader}>
                            <ThemedText style={styles.summaryModalTitle}>Summary</ThemedText>
                            <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                                <View style={styles.summaryCloseCircle}>
                                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.summaryScrollContent} showsVerticalScrollIndicator={false}>
                            {/* Amount Section */}
                            <View style={styles.summaryAmountSection}>
                                <ThemedText style={styles.summaryAmountLabel}>You are paying</ThemedText>
                                <ThemedText style={styles.summaryAmountValue}>{amount}{getCurrencySymbol()}</ThemedText>
                            </View>

                            {/* Transaction Details Card */}
                            <View style={styles.summaryDetailsCard}>
                                <View style={[styles.summaryRow, {borderWidth:0.5, borderTopRightRadius:10 * SCALE, borderTopLeftRadius:10 * SCALE}]}>
                                    <ThemedText style={styles.summaryLabel}>Transaction Fee</ThemedText>
                                    <ThemedText style={styles.summaryValue}>
                                        {transferData?.fee 
                                            ? `${getCurrencySymbol()}${parseFloat(transferData.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : 'Calculating...'}
                                    </ThemedText>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryRow}>
                                    <ThemedText style={styles.summaryLabel}>Funding Route</ThemedText>
                                    <ThemedText style={styles.summaryValue}>Mobile Money</ThemedText>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryRow}>
                                    <ThemedText style={styles.summaryLabel}>Provider</ThemedText>
                                    <ThemedText style={styles.summaryValue}>
                                        {providers.find(p => p.id === selectedProvider)?.name || ''}
                                    </ThemedText>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryRow}>
                                    <ThemedText style={styles.summaryLabel}>Phone Number</ThemedText>
                                    <ThemedText style={styles.summaryValue}>{phoneNumber}</ThemedText>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={[styles.summaryRow, {borderWidth:0.5, borderBottomRightRadius:10 * SCALE, borderBottomLeftRadius:10 * SCALE}]}>
                                    <ThemedText style={styles.summaryLabel}>Total</ThemedText>
                                    <ThemedText style={styles.summaryValue}>
                                        {transferData?.totalDeduction 
                                            ? `${getCurrencySymbol()}${parseFloat(transferData.totalDeduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `${getCurrencySymbol()}${amount.replace(/,/g, '')}.00`}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Information Section */}
                            <View style={styles.summaryInfoSection}>
                                <View style={styles.summaryNoteItem}>
                                    <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#A9EF45" />
                                    <ThemedText style={styles.summaryNoteText}>You will receive a mobile money prompt to confirm your payment</ThemedText>
                                </View>
                                <View style={styles.summaryNoteItem}>
                                    <MaterialCommunityIcons name="alert-circle" size={16 * SCALE} color="#A9EF45" />
                                    <ThemedText style={styles.summaryNoteText}>Payment will take a few minutes to reflect</ThemedText>
                                </View>
                            </View>
                        </ScrollView>

                        {/* I Understand Button */}
                        <TouchableOpacity
                            style={[
                                styles.understandButton,
                                initiateTransferMutation.isPending && styles.understandButtonDisabled
                            ]}
                            onPress={handleSummaryComplete}
                            disabled={initiateTransferMutation.isPending}
                        >
                            {initiateTransferMutation.isPending ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <ThemedText style={styles.understandButtonText}>I understand</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PIN Verification Modal */}
            <Modal
                visible={showPinModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.pinModalContent, styles.pinModalContentFull]}>
                        <View style={styles.pinModalHeader}>
                            <ThemedText style={styles.pinModalTitle}>Verification</ThemedText>
                            <TouchableOpacity onPress={() => setShowPinModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pinIconContainer}>
                            <View style={styles.pinIconCircle}>
                                <Image
                                    source={require('../../../assets/Group 49.png')}
                                    style={styles.pinIcon}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <View style={styles.pinModalTextContainer}>
                            <ThemedText style={styles.pinInstruction}>Input Pin to Fund</ThemedText>
                            <ThemedText style={styles.pinAmount}>{getCurrencySymbol()}{amount}</ThemedText>
                        </View>

                        <View style={styles.pinBar}>
                            <View style={styles.pinBarInner}>
                                {[0, 1, 2, 3, 4].map((index) => {
                                    const hasValue = index < pin.length;
                                    const digit = hasValue ? pin[index] : null;
                                    return (
                                        <View key={index} style={styles.pinSlot}>
                                            {hasValue ? (
                                                <ThemedText style={styles.pinSlotText}>{digit}</ThemedText>
                                            ) : (
                                                <ThemedText style={styles.pinSlotAsterisk}>*</ThemedText>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                            <TouchableOpacity style={styles.fingerprintButton}>
                                <MaterialCommunityIcons name="fingerprint" size={24 * SCALE} color="#A9EF45" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.numpad}>
                            <View style={styles.numpadRow}>
                                {[1, 2, 3].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={styles.numpadButton}
                                        onPress={() => handlePinPress(num.toString())}
                                    >
                                        <View
                                            style={[
                                                styles.numpadCircle,
                                                lastPressedButton === num.toString() && styles.numpadCirclePressed,
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.numpadText,
                                                    lastPressedButton === num.toString() && styles.numpadTextPressed,
                                                ]}
                                            >
                                                {num}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                {[4, 5, 6].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={styles.numpadButton}
                                        onPress={() => handlePinPress(num.toString())}
                                    >
                                        <View
                                            style={[
                                                styles.numpadCircle,
                                                lastPressedButton === num.toString() && styles.numpadCirclePressed,
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.numpadText,
                                                    lastPressedButton === num.toString() && styles.numpadTextPressed,
                                                ]}
                                            >
                                                {num}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                {[7, 8, 9].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={styles.numpadButton}
                                        onPress={() => handlePinPress(num.toString())}
                                    >
                                        <View
                                            style={[
                                                styles.numpadCircle,
                                                lastPressedButton === num.toString() && styles.numpadCirclePressed,
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.numpadText,
                                                    lastPressedButton === num.toString() && styles.numpadTextPressed,
                                                ]}
                                            >
                                                {num}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                <TouchableOpacity
                                    style={styles.numpadButton}
                                    onPress={() => handlePinPress('.')}
                                >
                                    <View
                                        style={[
                                            styles.numpadCircle,
                                            lastPressedButton === '.' && styles.numpadCirclePressed,
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.numpadText,
                                                lastPressedButton === '.' && styles.numpadTextPressed,
                                            ]}
                                        >
                                            .
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.numpadButton}
                                    onPress={() => handlePinPress('0')}
                                >
                                    <View
                                        style={[
                                            styles.numpadCircle,
                                            lastPressedButton === '0' && styles.numpadCirclePressed,
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.numpadText,
                                                lastPressedButton === '0' && styles.numpadTextPressed,
                                            ]}
                                        >
                                            0
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.numpadButton}
                                    onPress={handlePinBackspace}
                                >
                                    <View style={styles.backspaceSquare}>
                                        <MaterialCommunityIcons name="backspace-outline" size={18 * SCALE} color="#FFFFFF" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Security Verification Modal */}
            <Modal
                visible={showSecurityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSecurityModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.securityModalContentBottom}>
                        <View style={styles.securityModalHeader}>
                            <ThemedText style={styles.securityModalTitle}>Security Verification</ThemedText>
                            <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.securityIconContainer}>
                            <View style={styles.securityIconCircle}>
                                <Image
                                    source={require('../../../assets/Group 49.png')}
                                    style={styles.securityIcon}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <ThemedText style={styles.securityTitle}>Security Verification</ThemedText>
                        <ThemedText style={styles.securitySubtitle}>Verify via email and your authenticator app</ThemedText>

                        <View style={styles.securityInputWrapper}>
                            <ThemedText style={styles.securityInputLabel}>Email Code</ThemedText>
                            <View style={styles.securityInputField}>
                                <TextInput
                                    style={styles.securityInput}
                                    placeholder="Input Code sent to your email"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={emailCode}
                                    onChangeText={setEmailCode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.securityInputWrapper}>
                            <ThemedText style={styles.securityInputLabel}>Authenticator App Code</ThemedText>
                            <View style={styles.securityInputField}>
                                <TextInput
                                    style={styles.securityInput}
                                    placeholder="Input Code from your authenticator app"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={authenticatorCode}
                                    onChangeText={setAuthenticatorCode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.securityProceedButton,
                                (!emailCode || emailCode.length !== 5 || !pin || pin.length !== 5 || verifyTransferMutation.isPending) && styles.securityProceedButtonDisabled
                            ]}
                            onPress={handleSecurityComplete}
                            disabled={!emailCode || emailCode.length !== 5 || !pin || pin.length !== 5 || verifyTransferMutation.isPending}
                        >
                            {verifyTransferMutation.isPending ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <ThemedText style={styles.securityProceedButtonText}>Proceed</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <TransactionSuccessModal
                visible={showSuccessModal}
                transaction={{
                    amount: `${getCurrencySymbol()}${amount.replace(/,/g, '')}`,
                    fee: `20 ${getCurrencySymbol()}`,
                }}
                onViewTransaction={handleViewTransaction}
                onCancel={handleSuccessCancel}
            />

            {/* Receipt Modal */}
            {receiptData?.data && (
                <TransactionReceiptModal
                    visible={showReceiptModal && !isLoadingReceipt}
                    transaction={{
                        transactionType: 'send',
                        transactionTitle: `Send Funds - Mobile Money`,
                        transferAmount: `${getCurrencySymbol()}${parseFloat(receiptData.data.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        fee: receiptData.data.fee 
                            ? `${getCurrencySymbol()}${parseFloat(receiptData.data.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N0',
                        paymentAmount: receiptData.data.totalAmount 
                            ? `${getCurrencySymbol()}${parseFloat(receiptData.data.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${getCurrencySymbol()}${amount.replace(/,/g, '')}`,
                        country: selectedCountryName,
                        recipientName: receiptData.data.recipientInfo?.provider || providers.find(p => p.id === selectedProvider)?.name || '',
                        bank: receiptData.data.recipientInfo?.phoneNumber || phoneNumber,
                        accountNumber: receiptData.data.recipientInfo?.phoneNumber || phoneNumber,
                        transactionId: receiptData.data.reference || receiptData.data.transactionId || `TRF-${transactionId}`,
                        dateTime: receiptData.data.date || receiptData.data.completedAt || receiptData.data.createdAt
                            ? new Date(receiptData.data.date || receiptData.data.completedAt || receiptData.data.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : new Date().toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        paymentMethod: 'Mobile Money',
                    }}
                    onClose={handleReceiptClose}
                />
            )}

            {/* Loading overlay when fetching receipt */}
            {isLoadingReceipt && showReceiptModal && (
                <Modal
                    visible={true}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#A9EF45" />
                        <ThemedText style={{ color: '#FFFFFF', marginTop: 10, fontSize: 14 * SCALE }}>
                            Loading receipt...
                        </ThemedText>
                    </View>
                </Modal>
            )}
        </KeyboardAvoidingView>
    );
};

export default MobileFundScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020c19',
    },
    scrollContent: {
        paddingBottom: 100 * SCALE,
    },
    proceedButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#020c19',
        paddingTop: 10 * SCALE,
        paddingBottom: 30 * SCALE,
        paddingHorizontal: SCREEN_WIDTH * 0.047,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        paddingTop: 30* SCALE,
        paddingBottom: 20 * SCALE,
    },
    backButtonCircle: {
        width: 40 * SCALE,
        height: 40 * SCALE,
        borderRadius: 20 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    placeholder: {
        width: 40 * SCALE,
    },
    balanceCardContainer: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
    },
    balanceCard: {
        borderRadius: 15 * SCALE,
        padding: 14 * SCALE,
        minHeight: 84 * SCALE,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    balanceCardContent: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8 * SCALE,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
    },
    walletIcon: {
        width: 18 * SCALE,
        height: 16 * SCALE,
    },
    balanceAmount: {
        fontSize: 20 * 1,
        fontWeight: '500',
        color: '#A9EF45',
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 100,
        paddingHorizontal: 12 * SCALE,
        paddingVertical: 9 * SCALE,
        gap: 8 * SCALE,
        marginLeft: 12 * SCALE,
    },
    countryFlagImage: {
        width: 36 * SCALE,
        height: 38 * SCALE,
        borderRadius: 18 * SCALE,
    },
    countryNameText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    mainCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15 * SCALE,
        padding: 14 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
    },
    amountSection: {
        marginBottom: 20 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: '#FFFFFF08',
        borderRadius: 10 * SCALE,
        padding: 14 * SCALE,
    },
    amountLabel: {
        fontSize: 14 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 12 * SCALE,
    },
    amountInputLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4 * SCALE,
    },
    amountInputLabel: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        marginTop: 30,
        textAlign: 'center',
    },
    amountInput: {
        fontSize: 50 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
        fontFamily: 'Agbalumo-Regular',
        textAlign: 'center',
        paddingTop: 90,
        paddingBottom: 90 * 1,
        padding: 0,
        margin: 0,
    },
    providerSection: {
        marginBottom: 20 * SCALE,
    },
    fieldLabel: {
        fontSize: 14 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 12 * SCALE,
    },
    providerField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 15 * SCALE,
        paddingVertical: 20 * SCALE,
    },
    providerFieldText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    providerFieldPlaceholder: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    notesSection: {
        gap: 12 * SCALE,
        backgroundColor: '#CE56001A',
        borderRadius: 10 * SCALE,
        padding: 10 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom:20,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7 * SCALE,
    },
    noteText: {
        flex: 1,
        fontSize: 10 * 1,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    proceedButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    proceedButtonDisabled: {
        backgroundColor: 'rgba(169, 239, 69, 0.3)',
    },
    proceedButtonText: {
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
        borderTopLeftRadius: 20 * SCALE,
        borderTopRightRadius: 20 * SCALE,
        paddingBottom: 20 * SCALE,
        padding: 10 * SCALE,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    modalTitle: {
        fontSize: 15.2 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    modalList: {
        maxHeight: 390 * SCALE,
        padding: 10 * SCALE,
    },
    countryItem: {
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
    countryFlag: {
        fontSize: 20 * SCALE,
        marginRight: 15 * SCALE,
    },
    countryName: {
        flex: 1,
        fontSize: 11.2 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    applyButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 22 * SCALE,
        marginHorizontal: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    // Provider Modal Styles
    providerModalContent: {
        backgroundColor: '#020C19',
        borderTopLeftRadius: 20 * SCALE,
        borderTopRightRadius: 20 * SCALE,
        paddingBottom: 20 * SCALE,
        maxHeight: '80%',
    },
    providerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * 1,
        paddingTop: 18 * SCALE,
        paddingBottom: 15 * SCALE,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    providerModalTitle: {
        fontSize: 16 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF0D',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 17 * SCALE,
        paddingVertical: 7 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginTop: 20 * SCALE,
        marginBottom: 10 * SCALE,
        gap: 12 * SCALE,
    },
    searchInput: {
        flex: 1,
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    providerList: {
        paddingHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    providerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14 * SCALE,
        gap: 12 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#FFFFFF0D',
        borderRadius: 10 * 1,
        padding: 10 * SCALE,
        marginBottom: 10 * SCALE,
    },
    providerLogo: {
        width: 33 * SCALE,
        height: 33 * SCALE,
        borderRadius: 16.5 * SCALE,
    },
    providerItemName: {
        flex: 1,
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    // Summary Modal Styles
    summaryModalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingTop: 10 * SCALE,
        paddingBottom: 30 * SCALE,
        width: '100%',
        maxHeight: '90%',
    },
    summaryModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20 * SCALE,
        paddingBottom: 10 * SCALE,
    },
    summaryModalTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    summaryCloseCircle: {
        width: 25 * SCALE,
        height: 25 * SCALE,
        borderRadius: 16 * SCALE,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryScrollContent: {
        paddingHorizontal: 20 * SCALE,
        paddingTop: 20 * SCALE,
    },
    summaryAmountSection: {
        alignItems: 'center',
        marginBottom: 30 * SCALE,
    },
    summaryAmountLabel: {
        fontSize: 14 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8 * SCALE,
    },
    summaryAmountValue: {
        fontSize: 40 * 1,
        fontWeight: '600',
        color: '#A9EF45',
    },
    summaryDetailsCard: {
        // backgroundColor: 'rgba(255, 255, 255, 0.03)',
        // borderWidth: 0.3,
        // borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15 * SCALE,
        // padding: 14 * SCALE,
        marginBottom: 20 * SCALE,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF0D',
        // borderRadius: 10 * SCALE,
        padding: 10 * SCALE,
        paddingVertical: 14 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryLabel: {
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    summaryValue: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryDivider: {
        height: 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryInfoSection: {
        backgroundColor: '#CE56001A',
        borderRadius: 15 * SCALE,
        padding: 14 * SCALE,
        marginBottom: 20 * SCALE,
        gap: 12 * SCALE,
    },
    summaryNoteItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10 * SCALE,
    },
    summaryNoteText: {
        flex: 1,
        fontSize: 12 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    understandButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        marginHorizontal: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    understandButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    // PIN Modal Styles
    pinModalContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingBottom: 20 * SCALE,
        maxHeight: '90%',
    },
    pinModalContentFull: {
        maxHeight: '95%',
    },
    pinModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10 * SCALE,
        paddingTop: 30* SCALE,
        paddingBottom: 18 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    pinModalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        flex: 1,
    },
    pinIconContainer: {
        alignItems: 'center',
        marginTop: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    pinIconCircle: {
        width: 120 * SCALE,
        height: 120 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinIcon: {
        width: 120 * SCALE,
        height: 120 * SCALE,
    },
    pinModalTextContainer: {
        alignItems: 'center',
        marginBottom: 22 * SCALE,
    },
    pinInstruction: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8 * SCALE,
    },
    pinAmount: {
        fontSize: 36 * SCALE,
        fontWeight: '600',
        color: '#A9EF45',
        textAlign: 'center',
    },
    pinBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 22 * SCALE,
        marginBottom: 35 * SCALE,
        gap: 12 * SCALE,
    },
    pinBarInner: {
        height: 60 * SCALE,
        width: 248 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 100 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24 * SCALE,
    },
    fingerprintButton: {
        width: 60 * SCALE,
        height: 60 * SCALE,
        borderRadius: 30 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinSlot: {
        width: 28 * SCALE,
        height: 28 * SCALE,
        borderRadius: 18 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinSlotText: {
        fontSize: 20 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    pinSlotAsterisk: {
        fontSize: 19.2 * SCALE,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    numpad: {
        marginTop: 0,
        paddingHorizontal: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20 * SCALE,
    },
    numpadButton: {
        width: 117 * SCALE,
        alignItems: 'center',
    },
    numpadCircle: {
        width: 53 * SCALE,
        height: 53 * SCALE,
        borderRadius: 26.5 * SCALE,
        backgroundColor: '#000914',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numpadCirclePressed: {
        backgroundColor: '#A9EF45',
    },
    numpadText: {
        fontSize: 19.2 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    numpadTextPressed: {
        color: '#000000',
    },
    backspaceSquare: {
        width: 53 * SCALE,
        height: 53 * SCALE,
        borderRadius: 26.5 * SCALE,
        backgroundColor: '#000914',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Security Modal Styles
    securityModalContentBottom: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingHorizontal: 20 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 30 * SCALE,
        alignItems: 'center',
        maxHeight: '90%',
    },
    securityModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10 * SCALE,
        paddingVertical: 10 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 20 * SCALE,
    },
    securityModalTitle: {
        fontSize: 16 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        flex: 1,
    },
    securityIconContainer: {
        alignItems: 'center',
        marginTop: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    securityIconCircle: {
        width: 120 * SCALE,
        height: 120 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityIcon: {
        width: 120 * SCALE,
        height: 120 * SCALE,
    },
    securityTitle: {
        fontSize: 20 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 8 * SCALE,
        textAlign: 'center',
    },
    securitySubtitle: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginBottom: 30 * SCALE,
    },
    securityInputWrapper: {
        width: '100%',
        marginBottom: 20 * SCALE,
        paddingHorizontal: 10 * SCALE,
    },
    securityInputLabel: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 8 * SCALE,
    },
    securityInputField: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 11 * SCALE,
        minHeight: 60 * SCALE,
        justifyContent: 'center',
    },
    securityInput: {
        fontSize: 14 * SCALE,
        fontWeight: '300',
        color: '#FFFFFF',
        paddingVertical: 0,
    },
    securityProceedButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100 * SCALE,
        paddingVertical: 17 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60 * SCALE,
        width: '100%',
    },
    securityProceedButtonDisabled: {
        backgroundColor: 'rgba(169, 239, 69, 0.3)',
    },
    securityProceedButtonText: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#000',
    },
});

