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
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useCalculateConversion, useGetConversionReceipt } from '../../../queries/conversion.queries';
import { useInitiateConversion, useConfirmConversion } from '../../../mutations/conversion.mutations';
import { useGetWalletBalances } from '../../../queries/wallet.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { API_BASE_URL } from '../../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

// Fallback countries data
const FALLBACK_COUNTRIES = [
    { id: 1, name: 'Nigeria', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'NGN', currencySymbol: '₦', code: 'NG' },
    { id: 2, name: 'Botswana', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'BWP', currencySymbol: 'P', code: 'BW' },
    { id: 3, name: 'Ghana', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'GHS', currencySymbol: '₵', code: 'GH' },
    { id: 4, name: 'Kenya', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'KES', currencySymbol: 'Ksh', code: 'KE' },
    { id: 5, name: 'South Africa', flag: require('../../../assets/login/south-africa-flag.png'), currency: 'ZAR', currencySymbol: 'R', code: 'ZA' },
    { id: 6, name: 'Tanzania', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'TZS', currencySymbol: 'TSh', code: 'TZ' },
    { id: 7, name: 'Uganda', flag: require('../../../assets/login/nigeria-flag.png'), currency: 'UGX', currencySymbol: 'USh', code: 'UG' },
];

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

// Currency symbol mapping
const getCurrencySymbol = (currency: string): string => {
    const symbolMap: { [key: string]: string } = {
        'NGN': '₦',
        'KES': 'Ksh',
        'GHS': '₵',
        'ZAR': 'R',
        'BWP': 'P',
        'TZS': 'TSh',
        'UGX': 'USh',
    };
    return symbolMap[currency] || currency;
};

const Conversion = () => {
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

    const [sendCountry, setSendCountry] = useState<number | string>(1); // Nigeria
    const [receiveCountry, setReceiveCountry] = useState<number | string>(4); // Kenya
    const [sendAmount, setSendAmount] = useState('0.00');
    const [receiveAmount, setReceiveAmount] = useState('0.00');
    const [exchangeRate, setExchangeRate] = useState('0');
    const [exchangeRateDisplay, setExchangeRateDisplay] = useState('0');
    const [exchangeRateSummary, setExchangeRateSummary] = useState('0');
    const [fee, setFee] = useState('0');
    const [feeCurrency, setFeeCurrency] = useState('NGN');
    const [conversionReference, setConversionReference] = useState('');
    const [showSendCountryModal, setShowSendCountryModal] = useState(false);
    const [showReceiveCountryModal, setShowReceiveCountryModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [pin, setPin] = useState('');
    const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
    const [emailCode, setEmailCode] = useState('');
    const [authenticatorCode, setAuthenticatorCode] = useState('');
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);

    // Fetch countries from API
    const {
        data: countriesData,
        isLoading: isLoadingCountries,
    } = useGetCountries();

    // Transform countries data with currency info
    const countries = useMemo(() => {
        if (!countriesData?.data || !Array.isArray(countriesData.data)) {
            return FALLBACK_COUNTRIES;
        }
        return countriesData.data.map((country: any) => {
            const code = country.code || country.countryCode || '';
            const currency = getCurrencyFromCountryCode(code);
            const currencySymbol = getCurrencySymbol(currency);
            
            // Handle flag - can be URL from backend or use fallback
            let flagSource: any = require('../../../assets/login/nigeria-flag.png'); // Default fallback
            if (country.flag) {
                if (typeof country.flag === 'string') {
                    // If it's a URL path from backend
                    if (country.flag.startsWith('/') || country.flag.startsWith('http')) {
                        flagSource = { uri: country.flag.startsWith('/') 
                            ? `${API_BASE_URL.replace('/api', '')}${country.flag}`
                            : country.flag };
                    } else {
                        // Try to match with fallback countries
                        const fallback = FALLBACK_COUNTRIES.find(fc => fc.code === code);
                        flagSource = fallback?.flag || flagSource;
                    }
                } else {
                    flagSource = country.flag;
                }
            } else {
                // Try to match with fallback countries by code
                const fallback = FALLBACK_COUNTRIES.find(fc => fc.code === code);
                flagSource = fallback?.flag || flagSource;
            }

            return {
                id: country.id,
                name: country.name,
                code: code,
                currency: currency,
                currencySymbol: currencySymbol,
                flag: flagSource,
            };
        });
    }, [countriesData?.data]);

    const sendCountryData = countries.find(c => c.id === sendCountry || (c as any).code === sendCountry);
    const receiveCountryData = countries.find(c => c.id === receiveCountry || (c as any).code === receiveCountry);
    
    // Get currency codes
    const fromCurrency = useMemo(() => {
        if (sendCountryData) {
            return sendCountryData.currency;
        }
        // Fallback: try to get from country ID
        const country = countries.find(c => c.id === sendCountry);
        return country?.currency || 'NGN';
    }, [sendCountry, sendCountryData, countries]);
    
    const toCurrency = useMemo(() => {
        if (receiveCountryData) {
            return receiveCountryData.currency;
        }
        // Fallback: try to get from country ID
        const country = countries.find(c => c.id === receiveCountry);
        return country?.currency || 'KES';
    }, [receiveCountry, receiveCountryData, countries]);
    
    // Get numeric amount for API calls
    const numericAmount = useMemo(() => {
        const cleaned = sendAmount.replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) || num <= 0 ? '0' : num.toString();
    }, [sendAmount]);

    // Fetch wallet balances
    const {
        data: balancesData,
        isLoading: isLoadingBalances,
        refetch: refetchBalances,
    } = useGetWalletBalances();

    // Get balances for send and receive currencies
    const sendBalance = useMemo(() => {
        if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) return '0';
        const wallet = balancesData.data.fiat.find((w: any) => w.currency === fromCurrency);
        return wallet?.balance || '0';
    }, [balancesData?.data?.fiat, fromCurrency]);

    const receiveBalance = useMemo(() => {
        if (!balancesData?.data?.fiat || !Array.isArray(balancesData.data.fiat)) return '0';
        const wallet = balancesData.data.fiat.find((w: any) => w.currency === toCurrency);
        return wallet?.balance || '0';
    }, [balancesData?.data?.fiat, toCurrency]);

    // Format balance for display
    const formatBalance = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '0';
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    // Calculate conversion preview
    const shouldCalculate = numericAmount !== '0' && fromCurrency !== toCurrency;
    const {
        data: calculateData,
        isLoading: isLoadingCalculation,
        error: calculateError,
    } = useCalculateConversion(
        {
            fromCurrency,
            toCurrency,
            amount: shouldCalculate ? numericAmount : '0',
        }
    );

    // Update amounts and rates when calculation data changes
    useEffect(() => {
        if (calculateData?.data) {
            const data = calculateData.data;
            if (data.toAmount) {
                setReceiveAmount(formatNumber(data.toAmount));
            }
            if (data.receivedAmount) {
                setReceiveAmount(formatNumber(data.receivedAmount));
            }
            if (data.exchangeRate) {
                setExchangeRate(data.exchangeRate);
                // Calculate display rate (1 fromCurrency = ? toCurrency)
                const rate = parseFloat(data.exchangeRate);
                if (!isNaN(rate) && rate > 0) {
                    setExchangeRateDisplay(rate.toFixed(2));
                    setExchangeRateSummary(rate.toFixed(0));
                }
            }
            if (data.fee) {
                setFee(data.fee);
            }
            if (data.feeCurrency) {
                setFeeCurrency(data.feeCurrency);
            }
        }
    }, [calculateData]);

    // Initiate conversion mutation
    const initiateMutation = useInitiateConversion({
        onSuccess: (response) => {
            if (response?.data?.conversionReference) {
                setConversionReference(response.data.conversionReference);
                setShowSummaryModal(false);
                setShowPinModal(true);
            } else {
                Alert.alert('Error', 'Failed to initiate conversion. Please try again.');
            }
        },
        onError: (error: any) => {
            Alert.alert('Error', error?.message || 'Failed to initiate conversion. Please try again.');
        },
    });

    // Confirm conversion mutation
    const confirmMutation = useConfirmConversion({
        onSuccess: (response) => {
            setShowPinModal(false);
            setShowSecurityModal(true);
        },
        onError: (error: any) => {
            Alert.alert('Error', error?.message || 'Invalid PIN. Please try again.');
            setPin('');
        },
    });

    // Get conversion receipt
    const {
        data: receiptData,
        isLoading: isLoadingReceipt,
    } = useGetConversionReceipt(conversionReference || '');

    // Check biometric availability
    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                setIsBiometricAvailable(false);
                return;
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                setIsBiometricAvailable(false);
                return;
            }

            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            setIsBiometricAvailable(true);

            // Determine biometric type
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setBiometricType('Face ID');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setBiometricType('Fingerprint');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                setBiometricType('Iris');
            } else {
                setBiometricType('Biometric');
            }
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            setIsBiometricAvailable(false);
        }
    };

    // Get stored PIN from secure storage
    const getStoredPin = async (): Promise<string | null> => {
        try {
            // Note: In a real app, you should use secure storage like expo-secure-store
            // For now, we'll use AsyncStorage as a placeholder
            // In production, use: import * as SecureStore from 'expo-secure-store';
            const storedPin = await AsyncStorage.getItem('user_pin');
            return storedPin;
        } catch (error) {
            console.error('Error retrieving stored PIN:', error);
            return null;
        }
    };

    // Handle biometric authentication
    const handleBiometricAuth = async () => {
        if (!isBiometricAvailable) {
            Alert.alert(
                'Biometrics Not Available',
                'Your device does not support biometrics or it is not set up. Please enter your PIN manually.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!conversionReference) {
            Alert.alert('Error', 'Conversion reference not found. Please try again.');
            return;
        }

        setIsScanning(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: `Authenticate with ${biometricType} to confirm conversion`,
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
                fallbackLabel: 'Use PIN',
            });

            setIsScanning(false);

            if (result.success) {
                // Try to get stored PIN
                const storedPin = await getStoredPin();
                
                if (storedPin) {
                    // Use stored PIN to confirm conversion
                    confirmMutation.mutate({
                        conversionReference,
                        pin: storedPin,
                    });
                } else {
                    // If no stored PIN, prompt user to enter PIN
                    Alert.alert(
                        'PIN Required',
                        'Please enter your PIN to complete the conversion.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                if (result.error === 'user_cancel') {
                    // User cancelled - do nothing
                } else {
                    Alert.alert(
                        'Biometric Authentication Failed',
                        'Please try again or enter your PIN manually.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error: any) {
            setIsScanning(false);
            console.error('Biometric authentication error:', error);
            Alert.alert(
                'Error',
                'An error occurred during biometric authentication. Please enter your PIN manually.',
                [{ text: 'OK' }]
            );
        }
    };

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        await refetchBalances();
        return Promise.resolve();
    };

    const { refreshing, onRefresh } = usePullToRefresh({
        onRefresh: handleRefresh,
        refreshDelay: 2000,
    });

    const handleNumberPress = (num: string) => {
        setLastPressedButton(num);
        setTimeout(() => {
            setLastPressedButton(null);
        }, 200);

        if (num === 'backspace') {
            const cleaned = sendAmount.replace(/,/g, '');
            if (cleaned.length > 1) {
                const newValue = cleaned.slice(0, -1);
                const formatted = formatNumber(newValue);
                setSendAmount(formatted);
                // The receive amount will be updated via the useCalculateConversion hook
            } else {
                setSendAmount('0.00');
                setReceiveAmount('0.00');
            }
            return;
        }

        if (num === '.') {
            if (!sendAmount.includes('.')) {
                setSendAmount(prev => prev + '.');
            }
            return;
        }

        const cleaned = sendAmount.replace(/,/g, '');
        const newValue = cleaned === '0.00' ? num : cleaned + num;
        const formatted = formatNumber(newValue);
        setSendAmount(formatted);
        // The receive amount will be updated via the useCalculateConversion hook
    };

    const formatNumber = (value: string): string => {
        const parts = value.split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const decimalPart = parts[1] ? (parts[1].length > 2 ? parts[1].substring(0, 2) : parts[1].padEnd(2, '0')) : '00';
        return `${integerPart}.${decimalPart}`;
    };

    const handleSwap = () => {
        const tempCountry = sendCountry;
        const tempAmount = sendAmount;

        setSendCountry(receiveCountry);
        setReceiveCountry(tempCountry);
        setSendAmount(receiveAmount);
        // The receive amount and rates will be recalculated via the useCalculateConversion hook
    };

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
                // Confirm conversion with PIN
                if (conversionReference) {
                    confirmMutation.mutate({
                        conversionReference,
                        pin: newPin,
                    });
                }
            }
        }
    };

    const handlePinBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleSecurityComplete = () => {
        if (emailCode && authenticatorCode) {
            // In a real implementation, you would verify the security codes here
            // For now, we'll proceed to success
            setShowSecurityModal(false);
            setShowSuccessModal(true);
            // Refetch balances after successful conversion
            refetchBalances();
        }
    };

    const handleSummaryComplete = () => {
        // Initiate conversion
        initiateMutation.mutate({
            fromCurrency,
            toCurrency,
            amount: numericAmount,
        });
    };

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
                    <ThemedText style={styles.headerTitle}>Convert</ThemedText>
                    <View style={styles.placeholder} />
                </View>

                {/* Exchange Rate */}
                <View style={styles.exchangeRateSection}>
                    <ThemedText style={styles.exchangeRateLabel}>Exchange Rate</ThemedText>
                    {isLoadingCalculation ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator size="small" color="#A9EF45" />
                            <ThemedText style={styles.exchangeRateValue}>Calculating...</ThemedText>
                        </View>
                    ) : calculateError ? (
                        <ThemedText style={[styles.exchangeRateValue, { color: '#ff0000', fontSize: 14 }]}>
                            Error loading rate
                        </ThemedText>
                    ) : (
                        <ThemedText style={styles.exchangeRateValue}>
                            {sendCountryData?.currencySymbol}1 = {receiveCountryData?.currencySymbol.toLowerCase()}{exchangeRateDisplay}
                        </ThemedText>
                    )}
                </View>

                {/* You Send Card */}
                <View style={styles.sendCard}>
                    <ThemedText style={styles.cardLabel}>You send</ThemedText>
                    <View style={styles.cardHeader}>
                        <TouchableOpacity
                            style={styles.countrySelector}
                            onPress={() => setShowSendCountryModal(true)}
                        >
                            {typeof sendCountryData?.flag === 'object' && 'uri' in sendCountryData.flag ? (
                                <Image
                                    source={sendCountryData.flag}
                                    style={styles.countryFlagImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Image
                                    source={sendCountryData?.flag || FALLBACK_COUNTRIES[0].flag}
                                    style={styles.countryFlagImage}
                                    resizeMode="cover"
                                />
                            )}
                            <ThemedText style={styles.countryNameText}>{sendCountryData?.name}</ThemedText>
                            <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.amountText}>{sendCountryData?.currencySymbol}{sendAmount}</ThemedText>
                    </View>
                    <View style={styles.balanceRow}>
                        <Image
                            source={require('../../../assets/Vector (34).png')}
                            style={styles.walletIcon}
                            resizeMode="cover"
                        />
                        {isLoadingBalances ? (
                            <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
                        ) : (
                            <ThemedText style={styles.balanceText}>{sendCountryData?.currencySymbol}{formatBalance(sendBalance)}</ThemedText>
                        )}
                    </View>
                </View>

                {/* Swap Button */}
                <View style={styles.swapButtonContainer}>
                    <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
                        <Image
                            source={require('../../../assets/conversion_icon.png')}
                            style={styles.sendFundsIcon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                {/* You Receive Card */}
                <View style={styles.receiveCard}>
                    <ThemedText style={styles.cardLabel}>You Receive</ThemedText>
                    <View style={styles.cardHeader}>
                            <TouchableOpacity
                                style={styles.countrySelector}
                                onPress={() => setShowReceiveCountryModal(true)}
                                disabled={isLoadingCountries}
                            >
                                {isLoadingCountries ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        {typeof receiveCountryData?.flag === 'object' && 'uri' in receiveCountryData.flag ? (
                                            <Image
                                                source={receiveCountryData.flag}
                                                style={styles.countryFlagImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image
                                                source={receiveCountryData?.flag || FALLBACK_COUNTRIES[3].flag}
                                                style={styles.countryFlagImage}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <ThemedText style={styles.countryNameText}>{receiveCountryData?.name || 'Select Country'}</ThemedText>
                                    </>
                                )}
                            <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.amountText}>{receiveCountryData?.currencySymbol}{receiveAmount}</ThemedText>
                    </View>
                    <View style={styles.balanceRow}>
                        <Image
                            source={require('../../../assets/Vector (34).png')}
                            style={styles.walletIcon}
                            resizeMode="cover"
                        />
                        {isLoadingBalances ? (
                            <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
                        ) : (
                            <ThemedText style={styles.balanceText}>{receiveCountryData?.currencySymbol}{formatBalance(receiveBalance)}</ThemedText>
                        )}
                    </View>
                </View>

                {/* Numeric Keypad */}
                <View style={styles.keypad}>
                    <View style={styles.keypadRow}>
                        {[1, 2, 3].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.keypadButton}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <View
                                    style={[
                                        styles.keypadCircle,
                                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.keypadText,
                                            lastPressedButton === num.toString() && styles.keypadTextPressed,
                                        ]}
                                    >
                                        {num}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.keypadRow}>
                        {[4, 5, 6].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.keypadButton}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <View
                                    style={[
                                        styles.keypadCircle,
                                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.keypadText,
                                            lastPressedButton === num.toString() && styles.keypadTextPressed,
                                        ]}
                                    >
                                        {num}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.keypadRow}>
                        {[7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.keypadButton}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <View
                                    style={[
                                        styles.keypadCircle,
                                        lastPressedButton === num.toString() && styles.keypadCirclePressed,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.keypadText,
                                            lastPressedButton === num.toString() && styles.keypadTextPressed,
                                        ]}
                                    >
                                        {num}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.keypadRow}>
                        <TouchableOpacity
                            style={styles.keypadButton}
                            onPress={() => handleNumberPress('.')}
                        >
                            <View
                                style={[
                                    styles.keypadCircle,
                                    lastPressedButton === '.' && styles.keypadCirclePressed,
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.keypadText,
                                        lastPressedButton === '.' && styles.keypadTextPressed,
                                    ]}
                                >
                                    .
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.keypadButton}
                            onPress={() => handleNumberPress('0')}
                        >
                            <View
                                style={[
                                    styles.keypadCircle,
                                    lastPressedButton === '0' && styles.keypadCirclePressed,
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.keypadText,
                                        lastPressedButton === '0' && styles.keypadTextPressed,
                                    ]}
                                >
                                    0
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.keypadButton}
                            onPress={() => handleNumberPress('backspace')}
                        >
                            <View style={styles.backspaceSquare}>
                                <MaterialCommunityIcons name="backspace-outline" size={18 * SCALE} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Convert Button - Fixed at Bottom */}
            {numericAmount !== '0' && fromCurrency !== toCurrency && (
                <View style={styles.convertButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.convertButton,
                            (isLoadingCalculation || initiateMutation.isPending) && styles.convertButtonDisabled
                        ]}
                        onPress={() => setShowSummaryModal(true)}
                        disabled={isLoadingCalculation || initiateMutation.isPending}
                    >
                        {initiateMutation.isPending ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ActivityIndicator size="small" color="#000000" />
                                <ThemedText style={styles.convertButtonText}>Processing...</ThemedText>
                            </View>
                        ) : (
                            <ThemedText style={styles.convertButtonText}>Convert</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Send Country Selection Modal */}
            <Modal
                visible={showSendCountryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSendCountryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
                            <TouchableOpacity onPress={() => setShowSendCountryModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {isLoadingCountries ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#A9EF45" />
                                </View>
                            ) : countries.length === 0 ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ThemedText style={styles.countryName}>No countries available</ThemedText>
                                </View>
                            ) : (
                                countries.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={styles.countryItem}
                                        onPress={() => {
                                            setSendCountry(c.id);
                                        }}
                                    >
                                        {typeof c.flag === 'object' && 'uri' in c.flag ? (
                                            <Image
                                                source={c.flag}
                                                style={styles.countryFlagImageModal}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image
                                                source={c.flag}
                                                style={styles.countryFlagImageModal}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                                        <MaterialCommunityIcons
                                            name={sendCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24 * SCALE}
                                            color={sendCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                        />
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowSendCountryModal(false)}
                        >
                            <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Receive Country Selection Modal */}
            <Modal
                visible={showReceiveCountryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowReceiveCountryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
                            <TouchableOpacity onPress={() => setShowReceiveCountryModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {isLoadingCountries ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#A9EF45" />
                                </View>
                            ) : countries.length === 0 ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ThemedText style={styles.countryName}>No countries available</ThemedText>
                                </View>
                            ) : (
                                countries.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={styles.countryItem}
                                        onPress={() => {
                                            setReceiveCountry(c.id);
                                        }}
                                    >
                                        {typeof c.flag === 'object' && 'uri' in c.flag ? (
                                            <Image
                                                source={c.flag}
                                                style={styles.countryFlagImageModal}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image
                                                source={c.flag}
                                                style={styles.countryFlagImageModal}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                                        <MaterialCommunityIcons
                                            name={receiveCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24 * SCALE}
                                            color={receiveCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                        />
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowReceiveCountryModal(false)}
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
                            {/* Transfer Details Card */}
                            <View style={styles.summaryTransferCard}>
                                {/* You Converted Section */}
                                <ThemedText style={styles.summarySectionLabel}>You Converted</ThemedText>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryRowLeft}>
                                        <Image
                                            source={typeof sendCountryData?.flag === 'object' && 'uri' in sendCountryData.flag ? sendCountryData.flag : (sendCountryData?.flag || FALLBACK_COUNTRIES[0].flag)}
                                            style={styles.summaryFlag}
                                            resizeMode="cover"
                                        />
                                        <ThemedText style={styles.summaryCountryText}>{sendCountryData?.name}</ThemedText>
                                        <MaterialCommunityIcons name="chevron-down" size={16 * SCALE} color="#FFFFFF" />
                                    </View>
                                    <ThemedText style={styles.summaryAmount}>
                                        {sendCountryData?.currencySymbol}{sendAmount.replace(/,/g, '')}.00
                                    </ThemedText>
                                </View>

                                {/* Transfer Icon Divider */}
                                <View style={styles.summaryDividerContainer}>
                                    <View style={styles.summaryDividerLine} />
                                    <View style={styles.summaryTransferCircle}>
                                        <Image
                                            source={require('../../../assets/conversion_icon.png')}
                                            style={{width: 24, height: 24}}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <View style={styles.summaryDividerLine} />
                                </View>

                                {/* User Received Section */}
                                <ThemedText style={styles.summarySectionLabel}>User Received</ThemedText>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryRowLeft}>
                                        <Image
                                            source={typeof receiveCountryData?.flag === 'object' && 'uri' in receiveCountryData.flag ? receiveCountryData.flag : (receiveCountryData?.flag || FALLBACK_COUNTRIES[3].flag)}
                                            style={styles.summaryFlag}
                                            resizeMode="cover"
                                        />
                                        <ThemedText style={styles.summaryCountryText}>{receiveCountryData?.name}</ThemedText>
                                    </View>
                                    <ThemedText style={styles.summaryAmount}>
                                        {receiveCountryData?.currencySymbol.toLowerCase()}{receiveAmount.replace(/,/g, '')}.00
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Details Card */}
                            <View style={styles.summaryDetailsCard}>
                                <View style={[styles.summaryDetailRow, {borderTopRightRadius: 10, borderTopLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                                    <ThemedText style={styles.summaryDetailLabel}>Transaction Fee</ThemedText>
                                    <ThemedText style={styles.summaryDetailValue}>
                                        {isLoadingCalculation ? '...' : `${fee} ${feeCurrency || fromCurrency}`}
                                    </ThemedText>
                                </View>
                                <View style={styles.summaryDetailRow}>
                                    <ThemedText style={styles.summaryDetailLabel}>Exchange Rate</ThemedText>
                                    <ThemedText style={styles.summaryDetailValue}>
                                        {sendCountryData?.currencySymbol}1 ~ {receiveCountryData?.currencySymbol.toLowerCase()}{exchangeRateSummary}
                                    </ThemedText>
                                </View>
                                <View style={[styles.summaryDetailRow, {borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)'}]}>
                                    <ThemedText style={styles.summaryDetailLabel}>Funding Route</ThemedText>
                                    <ThemedText style={styles.summaryDetailValue}>Conversion</ThemedText>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.summaryProceedButton,
                                (initiateMutation.isPending || isLoadingCalculation) && styles.summaryProceedButtonDisabled
                            ]}
                            onPress={handleSummaryComplete}
                            disabled={initiateMutation.isPending || isLoadingCalculation}
                        >
                            {initiateMutation.isPending ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color="#000000" />
                                    <ThemedText style={styles.summaryProceedButtonText}>Processing...</ThemedText>
                                </View>
                            ) : (
                                <ThemedText style={styles.summaryProceedButtonText}>Complete</ThemedText>
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
                            <ThemedText style={styles.pinInstruction}>Input Pin to Convert</ThemedText>
                            <ThemedText style={styles.pinAmount}>
                                {sendCountryData?.currencySymbol}{sendAmount.replace(/,/g, '')}
                            </ThemedText>
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
                            <TouchableOpacity 
                                style={[
                                    styles.fingerprintButton,
                                    (!isBiometricAvailable || isScanning) && styles.fingerprintButtonDisabled
                                ]}
                                onPress={handleBiometricAuth}
                                disabled={!isBiometricAvailable || isScanning || confirmMutation.isPending}
                            >
                                {isScanning ? (
                                    <ActivityIndicator size="small" color="#A9EF45" />
                                ) : (
                                    <MaterialCommunityIcons 
                                        name="fingerprint" 
                                        size={24 * SCALE} 
                                        color={isBiometricAvailable ? "#A9EF45" : "rgba(169, 239, 69, 0.5)"} 
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        {confirmMutation.isPending && (
                            <View style={{ alignItems: 'center', marginTop: 20 }}>
                                <ActivityIndicator size="small" color="#A9EF45" />
                                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginTop: 8 }}>
                                    Verifying PIN...
                                </ThemedText>
                            </View>
                        )}
                        
                        {confirmMutation.isError && (
                            <View style={{ alignItems: 'center', marginTop: 20 }}>
                                <ThemedText style={{ color: '#ff0000', fontSize: 12 }}>
                                    {confirmMutation.error?.message || 'Invalid PIN. Please try again.'}
                                </ThemedText>
                            </View>
                        )}

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
                            style={[styles.securityProceedButton, (!emailCode || !authenticatorCode) && styles.securityProceedButtonDisabled]}
                            onPress={handleSecurityComplete}
                            disabled={!emailCode || !authenticatorCode}
                        >
                            <ThemedText style={styles.securityProceedButtonText}>Proceed</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <TransactionSuccessModal
                visible={showSuccessModal}
                transaction={{
                    amount: `${sendCountryData?.currencySymbol}${sendAmount.replace(/,/g, '')}`,
                    fee: `500 ${sendCountryData?.currency}`,
                }}
                onViewTransaction={handleViewTransaction}
                onCancel={handleSuccessCancel}
            />

            {/* Receipt Modal */}
            <TransactionReceiptModal
                visible={showReceiptModal}
                transaction={
                    isLoadingReceipt ? {
                        transactionType: 'fund',
                        transactionTitle: 'Currency Conversion',
                        transferAmount: `${sendCountryData?.currencySymbol}${sendAmount.replace(/,/g, '')}`,
                        fee: `${fee} ${feeCurrency}`,
                        paymentAmount: `${receiveCountryData?.currencySymbol}${receiveAmount.replace(/,/g, '')}`,
                        country: receiveCountryData?.name || '',
                        recipientName: 'Currency Conversion',
                        transactionId: conversionReference || `CV${Date.now().toString().slice(-10)}`,
                        dateTime: new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        paymentMethod: 'Conversion',
                    } : receiptData?.data ? {
                        transactionType: 'fund',
                        transactionTitle: 'Currency Conversion',
                        transferAmount: `${sendCountryData?.currencySymbol}${sendAmount.replace(/,/g, '')}`,
                        fee: receiptData.data.fee ? `${receiptData.data.fee} ${receiptData.data.feeCurrency || feeCurrency}` : `${fee} ${feeCurrency}`,
                        paymentAmount: `${receiveCountryData?.currencySymbol}${receiveAmount.replace(/,/g, '')}`,
                        country: receiveCountryData?.name || '',
                        recipientName: 'Currency Conversion',
                        transactionId: receiptData.data.conversionReference || conversionReference || `CV${Date.now().toString().slice(-10)}`,
                        dateTime: receiptData.data.toTransaction?.createdAt 
                            ? new Date(receiptData.data.toTransaction.createdAt).toLocaleString('en-US', {
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
                        paymentMethod: receiptData.data.paymentMethod || 'Conversion',
                    } : {
                        transactionType: 'fund',
                        transactionTitle: 'Currency Conversion',
                        transferAmount: `${sendCountryData?.currencySymbol}${sendAmount.replace(/,/g, '')}`,
                        fee: `${fee} ${feeCurrency}`,
                        paymentAmount: `${receiveCountryData?.currencySymbol}${receiveAmount.replace(/,/g, '')}`,
                        country: receiveCountryData?.name || '',
                        recipientName: 'Currency Conversion',
                        transactionId: conversionReference || `CV${Date.now().toString().slice(-10)}`,
                        dateTime: new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        paymentMethod: 'Conversion',
                    }
                }
                onClose={handleReceiptClose}
            />
        </KeyboardAvoidingView>
    );
};

export default Conversion;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020c19',
    },
    scrollContent: {
        paddingBottom: 120 * SCALE,
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
    exchangeRateSection: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
    },
    exchangeRateLabel: {
        fontSize: 16 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8 * SCALE,
    },
    exchangeRateValue: {
        fontSize: 40 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    sendCard: {
        backgroundColor: '#2965a9',
        borderRadius: 15 * SCALE,
        padding: 20 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
    },
    receiveCard: {
        backgroundColor: '#020C19',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15 * SCALE,
        paddingHorizontal: 20 * SCALE,
        paddingVertical: 20 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
        marginTop: -20 * SCALE,
    },
    cardLabel: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 8 * SCALE,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8 * SCALE,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100 * SCALE,
        backgroundColor: '#FFFFFF0D',
        padding: 10 * SCALE,
    },
    countryFlagImage: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 12 * SCALE,
    },
    countryNameText: {
        fontSize: 14 *1  ,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    amountText: {
        fontSize: 20 * 1,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
    },
    walletIcon: {
        width: 9 * SCALE,
        height: 9 * SCALE,
    },
    balanceText: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    swapButtonContainer: {
        alignItems: 'center',
        marginVertical: -10 * SCALE,
        zIndex: 10,
    },
    swapButton: {
        width: 50 * SCALE,
        height: 50 * SCALE,
        borderRadius: 25 * SCALE,
        backgroundColor: '#A9EF45',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keypad: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginTop: 20 * SCALE,
        backgroundColor: '#020C19',
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20 * SCALE,
    },
    keypadButton: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5 * SCALE,
    },
    keypadCircle: {
        width: 60 * SCALE,
        height: 60 * SCALE,
        borderRadius: 30 * SCALE,
        backgroundColor: '#000914',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keypadCirclePressed: {
        backgroundColor: '#A9EF45',
    },
    keypadText: {
        fontSize: 20 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    keypadTextPressed: {
        color: '#000000',
    },
    backspaceSquare: {
        width: 60 * SCALE,
        height: 60 * SCALE,
        borderRadius: 30 * SCALE,
        backgroundColor: '#000914',
        alignItems: 'center',
        justifyContent: 'center',
    },
    convertButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#020c19',
        paddingTop: 10 * SCALE,
        paddingBottom: 30 * SCALE,
        paddingHorizontal: SCREEN_WIDTH * 0.047,
    },
    convertButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 18 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    convertButtonDisabled: {
        backgroundColor: 'rgba(169, 239, 69, 0.5)',
    },
    convertButtonText: {
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
    countryFlagImageModal: {
        width: 36 * SCALE,
        height: 38 * SCALE,
        borderRadius: 18 * SCALE,
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
    // Summary Modal Styles
    summaryModalContent: {
        backgroundColor: '#020C19',
        borderTopLeftRadius: 30 * SCALE,
        borderTopRightRadius: 30 * SCALE,
        paddingBottom: 20 * SCALE,
        maxHeight: '90%',
    },
    summaryModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * SCALE,
        paddingTop: 20 * SCALE,
        paddingBottom: 15 * SCALE,
        borderBottomWidth: 0.3,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryModalTitle: {
        fontSize: 16 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryCloseCircle: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 16 * SCALE,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryScrollContent: {
        paddingHorizontal: 20 * SCALE,
        paddingTop: 20 * SCALE,
    },
    summaryTransferCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 15 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        padding: 14 * SCALE,
        marginBottom: 20 * SCALE,
    },
    summarySectionLabel: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8 * SCALE,
    },
    summaryConvertedSection: {
        marginBottom: 20 * SCALE,
    },
    summaryCountryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
        marginBottom: 12 * SCALE,
    },
    summaryCountryFlag: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 12 * SCALE,
    },
    summaryCountryName: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryConvertedAmount: {
        fontSize: 20 * SCALE,
        fontWeight: '500',
        color: '#FFFFFF',
        textAlign: 'right',
    },
    conversionIndicator: {
        alignItems: 'center',
        marginVertical: 20 * SCALE,
    },
    conversionIndicatorCircle: {
        width: 50 * SCALE,
        height: 50 * SCALE,
        borderRadius: 25 * SCALE,
        backgroundColor: '#A9EF45',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryReceivedSection: {
        marginBottom: 30 * SCALE,
    },
    summaryReceivedAmount: {
        fontSize: 28 * SCALE,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'right',
    },
    sendFundsIcon: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        tintColor: '#000000',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15 * SCALE,
    },
    summaryRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 10 * SCALE,
        borderRadius: 100 * SCALE,
    },
    summaryFlag: {
        width: 36 * SCALE,
        height: 38 * SCALE,
        borderRadius: 12 * SCALE,
    },
    summaryCountryText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryAmount: {
        fontSize: 20 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryDividerLine: {
        flex: 1,
        height: 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryTransferCircle: {
        width: 40 * SCALE,
        height: 40 * SCALE,
        borderRadius: 20 * SCALE,
        backgroundColor: '#A9EF45',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12 * SCALE,
    },
    summaryDetailsCard: {
        borderRadius: 15 * SCALE,
        marginBottom: 20 * SCALE,
    },
    summaryDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: '#FFFFFF0D',
        padding: 15 * SCALE,
    },
    summaryDetailLabel: {
        fontSize: 12 * 1,
        fontWeight: '400',
        color: '#FFFFFF80',
    },
    summaryDetailValue: {
        fontSize: 12 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    summaryProceedButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100,
        paddingVertical: 22 * SCALE,
        marginHorizontal: 20 * SCALE,
        marginTop: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryProceedButtonDisabled: {
        backgroundColor: 'rgba(169, 239, 69, 0.5)',
    },
    summaryProceedButtonText: {
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
    fingerprintButtonDisabled: {
        opacity: 0.5,
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

