import React, { useState } from 'react';
import {
  View,
  Text,
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TransactionSuccessModal from '../../components/TransactionSuccessModal';
import TransactionReceiptModal from '../../components/TransactionReceiptModal';
import * as Clipboard from 'expo-clipboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface RecentTransaction {
  id: string;
  name: string;
  walletId: string;
  date: string;
  avatar: any;
}

const SendFundCrypto = () => {
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

  const [balance, setBalance] = useState('0.0001');
  const [amount, setAmount] = useState('0.0023');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<{ id: string; name: string } | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; balance: string; icon: any }>({
    id: '1',
    name: 'Bitcoin',
    balance: '0.0001',
    icon: require('../../../assets/CurrencyBtc.png'),
  });
  const [amountType, setAmountType] = useState<'BTC' | 'USD'>('USD');
  const [selectedPercentage, setSelectedPercentage] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');

  const recentTransactions: RecentTransaction[] = [
    { id: '1', name: 'Adebisi Lateefat', walletId: 'BTC12345', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
    { id: '2', name: 'Akor Samuel', walletId: 'ETH12345', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
    { id: '3', name: 'Teslim Olamide', walletId: 'BTC12345', date: 'Oct 16, 2025', avatar: require('../../../assets/Frame 2398.png') },
  ];

  const networks = [
    { id: '1', name: 'Ethereum' },
    { id: '2', name: 'Arbitrum' },
    { id: '3', name: 'Polygon' },
    { id: '4', name: 'Matic' },
  ];

  const assets = [
    { id: '1', name: 'Bitcoin', balance: '0.0001', icon: require('../../../assets/CurrencyBtc.png') },
    { id: '2', name: 'Ethereum', balance: '10', icon: require('../../../assets/CurrencyBtc.png') },
    { id: '3', name: 'Solana', balance: '100', icon: require('../../../assets/CurrencyBtc.png') },
  ];

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const quickAmounts = ['20%', '50%', '75%', '100%'];

  const handleAmountSelect = (quickAmount: string) => {
    const numericValue = quickAmount.replace('%', '');
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const calculatedAmount = (balanceNum * parseFloat(numericValue)) / 100;
    setAmount(calculatedAmount.toFixed(8));
    setSelectedPercentage(quickAmount);
  };

  const handleProceed = () => {
    if (walletAddress && selectedNetwork) {
      setShowSummaryModal(true);
    }
  };

  const handleSummaryComplete = () => {
    setShowSummaryModal(false);
    setShowPinModal(true);
  };

  const handlePinPress = (num: string) => {
    setLastPressedButton(num);
    setTimeout(() => {
      setLastPressedButton(null);
    }, 200);

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
      // TODO: Verify and complete transaction
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

  const getSelectedNetworkData = () => {
    return selectedNetwork || { id: '', name: 'Choose Network' };
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Text style={styles.headerTitle}>Send Funds</Text>
          </View>
        </View>

        {/* Balance Section with Linear Gradient */}
        <View style={styles.balanceSectionContainer}>
          {/* <Text style={styles.balanceSectionTitle}>Bitcoin Balance</Text> */}
          <LinearGradient
            colors={['#A9EF4533', '#FFFFFF0D']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardContent}>
              <Text style={styles.balanceLabel}>Bitcoin Balance</Text>
              <View style={styles.balanceRow}>
                <Image
                  source={require('../../../assets/Vector (34).png')}
                  style={styles.walletIcon}
                  resizeMode="cover"
                />
                <Text style={styles.balanceAmount}>{balance} {selectedAsset.name}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.assetSelector}
              onPress={() => setShowAssetModal(true)}
            >
              <Image
                source={selectedAsset.icon}
                style={styles.assetSelectorIcon}
                resizeMode="cover"
              />
              <Text style={styles.assetSelectorText}>{selectedAsset.name}</Text>
              <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Card */}
      
        <View style={styles.mainCard}>
          {/* Amount Type Toggle - Separate Buttons */}
          <View style={{backgroundColor:'#FFFFFF08', borderRadius:12 * SCALE, borderWidth:0.3, borderColor:'#FFFFFF33', paddingHorizontal:11 * SCALE, paddingVertical:8 * SCALE, marginBottom:20 * SCALE}}>
          <View style={styles.amountTypeToggleContainer}>
            <TouchableOpacity
              style={[styles.amountTypeToggleButton, amountType === 'BTC' && styles.amountTypeToggleButtonActive]}
              onPress={() => setAmountType('BTC')}
            >
              <Text style={[styles.amountTypeToggleText, amountType === 'BTC' && styles.amountTypeToggleTextActive]}>BTC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.amountTypeToggleButton, amountType === 'USD' && styles.amountTypeToggleButtonActive]}
              onPress={() => setAmountType('USD')}
            >
              <Text style={[styles.amountTypeToggleText, amountType === 'USD' && styles.amountTypeToggleTextActive]}>USD</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputLabelContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => {
                  // Allow decimal input for crypto
                  setAmount(text);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.amountCurrencyLabel}>BTC</Text>
            </View>
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount) => {
                const isSelected = selectedPercentage === quickAmount;
                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[styles.quickAmountButton, isSelected && styles.quickAmountButtonSelected]}
                    onPress={() => handleAmountSelect(quickAmount)}
                  >
                    <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                      {quickAmount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Choose Network */}
            <TouchableOpacity
              style={styles.networkField}
              onPress={() => setShowNetworkModal(true)}
            >
              <Text style={[styles.networkFieldText, !selectedNetwork && styles.placeholder]}>
                {getSelectedNetworkData().name}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Paste wallet address */}
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste wallet address"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={walletAddress}
                onChangeText={setWalletAddress}
              />
            </View>
          </View>
        </View>

        {/* Proceed Button - Outside Main Card */}


        {/* Warning Messages */}
        <View style={styles.warningSection}>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <Text style={styles.warningText}>
              Make sure to send tokens in the Ethereum blockchain only            </Text>
          </View>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <Text style={styles.warningText}>Withdrawal take 10-15 mins</Text>
          </View>
          <View style={styles.warningRow}>
            <MaterialCommunityIcons name="alert-circle" size={14 * SCALE} color="#A9EF45" />
            <Text style={styles.warningText}>Incase of loss of funds contact support</Text>
          </View>
        </View>
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity
            style={[styles.proceedButton, (!walletAddress || !selectedNetwork) && styles.proceedButtonDisabled]}
            onPress={handleProceed}
            disabled={!walletAddress || !selectedNetwork}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <Text style={styles.modalTitle}>Select Asset</Text>
              <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <TouchableOpacity
                    key={asset.id}
                    style={styles.assetItem}
                    onPress={() => {
                      setSelectedAsset(asset);
                      setBalance(asset.balance);
                      setShowAssetModal(false);
                    }}
                  >
                    <Image
                      source={asset.icon}
                      style={styles.assetItemIcon}
                      resizeMode="cover"
                    />
                    <View style={styles.assetItemInfo}>
                      <Text style={styles.assetItemName}>{asset.name}</Text>
                      <Text style={styles.assetItemBalance}>Bal : {asset.balance}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowAssetModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Network Modal */}
      <Modal
        visible={showNetworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Network</Text>
              <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {networks.map((network) => {
                const isSelected = selectedNetwork?.id === network.id;
                return (
                  <TouchableOpacity
                    key={network.id}
                    style={styles.networkItem}
                    onPress={() => {
                      setSelectedNetwork(network);
                      setShowNetworkModal(false);
                    }}
                  >
                    <Text style={styles.networkItemName}>{network.name}</Text>
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowNetworkModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
              <Text style={styles.summaryModalTitle}>Summary</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <View style={styles.summaryCloseCircle}>
                  <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.summaryDetailsCard}>
                <View style={[styles.summaryDetailRow, styles.summaryDetailRowFirst]}>
                  <Text style={styles.summaryDetailLabel}>Crypto Sent</Text>
                  <Text style={styles.summaryDetailValue}>{selectedAsset.name}</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Network</Text>
                  <Text style={styles.summaryDetailValue}>{selectedNetwork?.name || 'Ethereum'}</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Quantity</Text>
                  <Text style={styles.summaryDetailValue}>{amount} {selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Amount</Text>
                  <Text style={styles.summaryDetailValue}>$2,550.50</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Fee</Text>
                  <Text style={styles.summaryDetailValue}>0.000001 {selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'} ($2.50)</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Receiving Address</Text>
                  <View style={styles.summaryAddressRow}>
                    <Text style={styles.summaryAddressText} numberOfLines={1} ellipsizeMode="middle">
                      {walletAddress || '0x123edfgtrwe457kslwltkwflelwlvld'}
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard(walletAddress || '0x123edfgtrwe457kslwltkwflelwlvld')}>
                      <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.summaryDetailRow, styles.summaryDetailRowLast]}>
                  <Text style={styles.summaryDetailLabel}>Sending Address</Text>
                  <View style={styles.summaryAddressRow}>
                    <Text style={styles.summaryAddressText} numberOfLines={1} ellipsizeMode="middle">
                      0x123edfgtrwe457kslwltkwflelwlvld
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard('0x123edfgtrwe457kslwltkwflelwlvld')}>
                      <MaterialCommunityIcons name="content-copy" size={16 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.summaryCompleteButton}
              onPress={handleSummaryComplete}
            >
              <Text style={styles.summaryCompleteButtonText}>Complete</Text>
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
              <Text style={styles.pinModalTitle}>Verification</Text>
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
              <Text style={styles.pinInstruction}>Input Pin to Complete Transaction</Text>
              <Text style={styles.pinAmount}>{amount} {selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}</Text>
            </View>

            <View style={styles.pinBar}>
              <View style={styles.pinBarInner}>
                {[0, 1, 2, 3, 4].map((index) => {
                  const hasValue = index < pin.length;
                  const digit = hasValue ? pin[index] : null;
                  return (
                    <View key={index} style={styles.pinSlot}>
                      {hasValue ? (
                        <Text style={styles.pinSlotText}>{digit}</Text>
                      ) : (
                        <Text style={styles.pinSlotAsterisk}>*</Text>
                      )}
                    </View>
                  );
                })}
              </View>
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
                      <Text
                        style={[
                          styles.numpadText,
                          lastPressedButton === num.toString() && styles.numpadTextPressed,
                        ]}
                      >
                        {num}
                      </Text>
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
                      <Text
                        style={[
                          styles.numpadText,
                          lastPressedButton === num.toString() && styles.numpadTextPressed,
                        ]}
                      >
                        {num}
                      </Text>
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
                      <Text
                        style={[
                          styles.numpadText,
                          lastPressedButton === num.toString() && styles.numpadTextPressed,
                        ]}
                      >
                        {num}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                <View style={styles.numpadButton}>
                  <View style={styles.ghostCircle}>
                    <MaterialCommunityIcons name="fingerprint" size={24 * SCALE} color="#A9EF45" />
                  </View>
                </View>
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
                    <Text
                      style={[
                        styles.numpadText,
                        lastPressedButton === '0' && styles.numpadTextPressed,
                      ]}
                    >
                      0
                    </Text>
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
              <Text style={styles.securityModalTitle}>Security Verification</Text>
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

            <Text style={styles.securityTitle}>Security Verification</Text>
            <Text style={styles.securitySubtitle}>Verify via email and your authenticator app</Text>

            <View style={styles.securityInputWrapper}>
              <Text style={styles.securityInputLabel}>Email Code</Text>
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
              <Text style={styles.securityInputLabel}>Authenticator App Code</Text>
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
              <Text style={styles.securityProceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        transaction={{
          amount: `${amount} ${selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}`,
          fee: `0.000001 ${selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}`,
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
          transactionTitle: `Send Crypto - ${selectedAsset.name}`,
          transferAmount: `${amount} ${selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}`,
          fee: `0.000001 ${selectedAsset.name === 'Bitcoin' ? 'BTC' : selectedAsset.name === 'Ethereum' ? 'ETH' : 'SOL'}`,
          paymentAmount: `$2,550.50`,
          country: selectedNetwork?.name || 'Ethereum',
          recipientName: walletAddress.substring(0, 10) + '...',
          transactionId: `SC${Date.now().toString().slice(-10)}`,
          dateTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: 'Wallet Address',
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
  balanceSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
    marginBottom: 12 * SCALE,
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
  assetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  assetSelectorIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  assetSelectorText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  mainCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  amountTypeToggleContainer: {
    flexDirection: 'row',
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
    width: SCREEN_WIDTH * 0.25,
    borderRadius: 100,
    marginTop:10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  amountTypeToggleButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,

    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100 * SCALE,
    paddingVertical: 8 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountTypeToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  amountTypeToggleText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  amountTypeToggleTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  amountSection: {
    marginBottom: 20 * SCALE,
  },
  amountInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 50 * SCALE,
    marginTop: 50,
    gap: 4 * SCALE,
  },
  amountInput: {
    fontSize: 50 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    minHeight: 50 * SCALE,
  },
  amountCurrencyLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * SCALE,
  },
  quickAmountButton: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 8 * SCALE,
    minWidth: 40 * SCALE,
    alignItems: 'center',
    borderWidth: 0,
  },
  quickAmountButtonSelected: {
    borderWidth: 1,
    borderColor: '#A9EF45',
  },
  quickAmountText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  quickAmountTextSelected: {
    color: '#A9EF45',
  },
  formFields: {
    gap: 14 * SCALE,
    marginBottom: 20 * SCALE,
  },
  inputField: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  networkField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    paddingHorizontal: 11 * SCALE,
    minHeight: 60 * SCALE,
  },
  networkFieldText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  proceedButtonContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 50 * SCALE,
    // marginBottom: 20 * SCALE,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 17 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60 * SCALE,
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  proceedButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#000000',
  },
  warningCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15 * SCALE,
    gap: 12 * SCALE,
  },
  // warningText: {
  //   flex: 1,
  //   fontSize: 12 * SCALE,
  //   fontWeight: '300',
  //   color: 'rgba(255, 255, 255, 0.7)',
  //   lineHeight: 18 * SCALE,
  // },
  warningHighlight: {
    color: '#A9EF45',
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
  assetItem: {
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
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  networkItemName: {
    flex: 1,
    fontSize: 14,
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
    fontSize: 14,
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
    fontWeight: '600',
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
  summaryDetailsCard: {
    borderRadius: 15 * SCALE,
    overflow: 'hidden',
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
  summaryDetailRowFirst: {
    borderTopLeftRadius: 10 * SCALE,
    borderTopRightRadius: 10 * SCALE,
  },
  summaryDetailRowLast: {
    borderBottomLeftRadius: 10 * SCALE,
    borderBottomRightRadius: 10 * SCALE,
    borderBottomWidth: 0.3,
  },
  summaryDetailLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF80',
  },
  summaryDetailValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  summaryAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    flex: 1,
    justifyContent: 'flex-end',
  },
  summaryAddressText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    maxWidth: 150 * SCALE,
  },
  summaryCompleteButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 22 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCompleteButtonText: {
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
    alignItems: 'center',
    marginTop: 22 * SCALE,
    marginBottom: 35 * SCALE,
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
  warningSection: {
    backgroundColor: '#CE56001A',
    borderRadius: 10 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 10 * SCALE,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 * SCALE,
    marginBottom: 10 * SCALE,
  },
  warningText: {
    flex: 1,
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 14 * SCALE,
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

export default SendFundCrypto;

