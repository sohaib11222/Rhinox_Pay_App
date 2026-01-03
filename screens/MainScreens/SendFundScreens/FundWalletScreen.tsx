import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

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

const FundWalletScreen = () => {
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

    const [balance, setBalance] = useState('200,000');
    const [amount, setAmount] = useState('2,000,000');
    const [selectedCountry, setSelectedCountry] = useState<number | null>(1);
    const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countdown, setCountdown] = useState(105); // 1 minute 45 seconds in seconds
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [pin, setPin] = useState('');
    const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
    const [emailCode, setEmailCode] = useState('');
    const [authenticatorCode, setAuthenticatorCode] = useState('');

    // Bank details
    const bankDetails = {
        bankName: 'Gratuity Bank',
        accountNumber: '1359131270',
        accountName: 'Yellow card financial',
        reference: '02443382711',
    };

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
    };

    const handlePaymentMade = () => {
        setShowPinModal(true);
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
        if (emailCode && authenticatorCode) {
            setShowSecurityModal(false);
            setShowSuccessModal(true);
        }
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

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('Refreshing fund wallet data...');
                resolve();
            }, 1000);
        });
    };

    const { refreshing, onRefresh } = usePullToRefresh({
        onRefresh: handleRefresh,
        refreshDelay: 2000,
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            // Navigate back to Home tab instead of Settings tab
                            (navigation as any).navigate('Home', { screen: 'HomeMain' });
                        }}
                    >
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitle}>Fund Wallet</ThemedText>
                    </View>
                </View>

                {/* Balance Section with Linear Gradient */}
                <View style={styles.balanceSectionContainer}>
                    <LinearGradient
                        colors={['#A9EF4533', '#FFFFFF0D']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceCardContent}>
                            <ThemedText style={styles.balanceLabel}>My Balance</ThemedText>
                            <View style={styles.balanceRow}>
                                <Image
                                    source={require('../../../assets/Vector (34).png')}
                                    style={styles.walletIcon}
                                    resizeMode="cover"
                                />
                                <ThemedText style={styles.balanceAmount}>N{balance}</ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.countrySelector}
                            onPress={() => setShowCountryModal(true)}
                        >
                            <Image
                                source={require('../../../assets/login/nigeria-flag.png')}
                                style={styles.countryFlagImage}
                                resizeMode="cover"
                            />
                            <ThemedText style={styles.countryNameText}>{selectedCountryName}</ThemedText>
                            <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Main Card */}
                <View style={styles.mainCard}>
                    {/* Amount Input Section */}
                    <View style={styles.amountSection}>
                        <ThemedText style={styles.amountLabel}>Enter Amount</ThemedText>
                        <View style={styles.amountInputLabelContainer}>
                            <ThemedText style={styles.amountInputLabel}>₦</ThemedText>
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
                        </View>
                    </View>
                    <View style={styles.bankDetailsCard}>
                        <View style={[styles.bankDetailRow, { borderTopRightRadius: 10 * SCALE, borderTopLeftRadius: 10 * SCALE, borderWidth: 0.5 }]}>
                            <ThemedText style={styles.bankDetailLabel}>Bank Name</ThemedText>
                            <View style={styles.bankDetailValueRow}>
                                <ThemedText style={styles.bankDetailValue}>{bankDetails.bankName}</ThemedText>
                                <TouchableOpacity onPress={() => copyToClipboard(bankDetails.bankName)}>
                                    <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.bankDetailRow}>
                            <ThemedText style={styles.bankDetailLabel}>Account Number</ThemedText>
                            <View style={styles.bankDetailValueRow}>
                                <ThemedText style={styles.bankDetailValue}>{bankDetails.accountNumber}</ThemedText>
                                <TouchableOpacity onPress={() => copyToClipboard(bankDetails.accountNumber)}>
                                    <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.bankDetailRow}>
                            <ThemedText style={styles.bankDetailLabel}>Account Name</ThemedText>
                            <View style={styles.bankDetailValueRow}>
                                <ThemedText style={styles.bankDetailValue}>{bankDetails.accountName}</ThemedText>
                                <TouchableOpacity onPress={() => copyToClipboard(bankDetails.accountName)}>
                                    <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.bankDetailRow, { borderBottomRightRadius: 10 * SCALE, borderBottomLeftRadius: 10 * SCALE, borderWidth: 0.5 }]}>
                            <ThemedText style={styles.bankDetailLabel}>Reference</ThemedText>
                            <View style={styles.bankDetailValueRow}>
                                <ThemedText style={styles.bankDetailValue}>{bankDetails.reference}</ThemedText>
                                <TouchableOpacity onPress={() => copyToClipboard(bankDetails.reference)}>
                                    <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bank Details Section */}

                {/* Important Notes */}
                <View style={styles.notesSection}>
                    <View style={styles.noteRow}>
                        <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                        <ThemedText style={styles.noteText}>You are to deposit to this account number to prevent loss of funds</ThemedText>
                    </View>
                    <View style={styles.noteRow}>
                        <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
                        <ThemedText style={styles.noteText}>Payment will take a few minutes to reflect</ThemedText>
                    </View>
                </View>

                {/* Transaction Fee */}
                <View style={styles.feeSection}>
                    <Image
                        source={require('../../../assets/CoinVertical.png')}
                        style={[{ marginBottom: -1, width: 14, height: 14 }]}
                        resizeMode="cover"
                    />
                    <ThemedText style={styles.feeText}>Fee : N200</ThemedText>
                </View>

                {/* Payment Made Button */}
                <View style={styles.proceedButtonContainer}>
                    <TouchableOpacity
                        style={styles.proceedButton}
                        onPress={handlePaymentMade}
                    >
                        <ThemedText style={styles.proceedButtonText}>I have made payment ({formatTime(countdown)})</ThemedText>
                    </TouchableOpacity>
                </View>
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
                        <ScrollView style={styles.modalList}>
                            {COUNTRIES.map((c) => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={styles.countryItem}
                                    onPress={() => {
                                        setSelectedCountry(c.id);
                                        setSelectedCountryName(c.name);
                                    }}
                                >
                                    <ThemedText style={styles.countryFlag}>{c.flag}</ThemedText>
                                    <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                                    <MaterialCommunityIcons
                                        name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={24}
                                        color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowCountryModal(false)}
                        >
                            <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
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
                            <ThemedText style={styles.pinAmount}>₦{amount}</ThemedText>
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
                            style={[styles.securityProceedButton, (!emailCode || !authenticatorCode) && styles.securityProceedButtonDisabled]}
                            onPress={handleSecurityComplete}
                            disabled={!emailCode || !authenticatorCode}
                        >
                            <ThemedText style={styles.securityProceedButtonText}>Proceed</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Transaction Success Modal */}
            <TransactionSuccessModal
                visible={showSuccessModal}
                transaction={{
                    amount: `N${amount.replace(/,/g, '')}`,
                    fee: 'N200',
                    transactionType: 'send',
                }}
                onViewTransaction={handleViewTransaction}
                onCancel={handleSuccessCancel}
            />

            {/* Transaction Receipt Modal */}
            <TransactionReceiptModal
                visible={showReceiptModal}
                transaction={{
                    transactionType: 'send',
                    transactionTitle: 'Fund Wallet - Bank Transfer',
                    transferAmount: `N${amount.replace(/,/g, '')}`,
                    fee: 'N200',
                    paymentAmount: `N${amount.replace(/,/g, '')}`,
                    country: selectedCountryName,
                    recipientName: bankDetails.accountName,
                    transactionId: `FW${Date.now().toString().slice(-10)}`,
                    dateTime: new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    paymentMethod: 'Bank Transfer',
                }}
                onClose={handleReceiptClose}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020C19',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 0.3,
        borderColor: '#FFFFFF33',
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
    balanceSectionContainer: {
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
        borderRadius: 10 * 1,
        padding: 14 * SCALE,
    },
    amountLabel: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 12 * SCALE,
        alignSelf: 'center',
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
        textAlign: 'center',
        paddingTop: 80,
        paddingBottom: 80 * 1,
        padding: 0,
        margin: 0,
        fontFamily: 'Agbalumo-Regular',
    },
    bankDetailsCard: {
        borderRadius: 15 * SCALE,
        // marginHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
    },
    bankDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: 15 * SCALE,
        backgroundColor: '#FFFFFF08',
        // borderRadius: 10 * SCALE,
        paddingHorizontal: 10 * SCALE,
        paddingVertical: 22 * SCALE,
        borderWidth: 0.3,
        borderColor: '#FFFFFF33',
    },
    bankDetailLabel: {
        fontSize: 12 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    bankDetailValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
        flex: 1,
        justifyContent: 'flex-end',
    },
    bankDetailValue: {
        fontSize: 12 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    notesSection: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 15 * SCALE,
        backgroundColor: '#CE56001A',
        borderRadius: 10 * SCALE,
        padding: 10 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
    },
    noteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10 * SCALE,
        marginBottom: 10 * SCALE,
    },
    noteText: {
        flex: 1,
        fontSize: 10 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        lineHeight: 14 * SCALE,
    },
    feeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * SCALE,
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginBottom: 20 * SCALE,
        backgroundColor: '#CE56001A',
        borderRadius: 10 * SCALE,
        padding: 10 * SCALE,
        marginHorizontal: SCREEN_WIDTH * 0.047,
    },
    feeText: {
        fontSize: 12 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    proceedButtonContainer: {
        paddingHorizontal: SCREEN_WIDTH * 0.047,
        marginTop: 20 * SCALE,
        marginBottom: 20 * SCALE,
    },
    proceedButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100 * SCALE,
        paddingVertical: 17 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60 * SCALE,
    },
    proceedButtonText: {
        fontSize: 14 * SCALE,
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
        paddingTop: 15 * SCALE,
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
    ghostCircle: {
        width: 53 * SCALE,
        height: 53 * SCALE,
        borderRadius: 26.5 * SCALE,
        backgroundColor: '#000914',
        alignItems: 'center',
        justifyContent: 'center',
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

export default FundWalletScreen;

