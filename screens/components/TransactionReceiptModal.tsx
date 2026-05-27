import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
import { showSuccessAlert, showErrorAlert, showInfoAlert, showConfirmAlert } from '../../utils/customAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCALE = 1;

interface TransactionReceiptModalProps {
  visible: boolean;
  transaction: {
    recipientName?: string;
    transferAmount?: string;
    fee?: string;
    paymentAmount?: string;
    country?: string;
    bank?: string;
    accountNumber?: string;
    accountName?: string;
    transactionId?: string;
    paymentMethod?: string;
    dateTime?: string;
    amountNGN?: string;
    // Transaction status
    status?: 'Successful' | 'Pending' | 'Failed' | 'Cancelled' | 'successful' | 'pending' | 'failed' | 'cancelled' | 'canceled' | 'Completed' | 'completed';
    // Fund transaction fields
    fundingRoute?: string;
    route?: string;
    provider?: string;
    transactionTitle?: string;
    // Withdrawal detection
    transactionType?: 'send' | 'withdrawal' | 'fund' | 'deposit' | 'convert' | 'billPayment' | 'p2p' | 'cryptoDeposit' | 'cryptoWithdrawal';
    // Bill payment specific fields
    billerType?: string;
    mobileNumber?: string;
    plan?: string;
    // P2P specific fields
    p2pType?: 'Crypto Sell' | 'Crypto Buy';
    price?: string;
    totalQty?: string;
    txFee?: string;
    merchantName?: string;
    merchantContact?: string;
    orderId?: string | number;
    chatName?: string;
    chatEmail?: string;
    reviewText?: string;
    hasLiked?: boolean;
    // Crypto deposit specific fields
    cryptoType?: string; // e.g., 'Ethereum', 'Bitcoin', 'USDT'
    network?: string; // e.g., 'Ethereum', 'Bitcoin'
    quantity?: string; // e.g., '0.25 ETH'
    amountUSDValue?: string; // e.g., '$2,550.50'
    feeCrypto?: string; // e.g., '0.000001 ETH'
    feeUSD?: string; // e.g., '$2.50'
    receivingAddress?: string; // Wallet address
    sendingAddress?: string; // Sender address
    txHash?: string; // Transaction hash
  };
  onClose: () => void;
}

const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  visible,
  transaction,
  onClose,
}) => {
  const navigation = useNavigation();
  const receiptRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccessAlert('Copied', `${label} copied to clipboard`);
    } catch (error) {
      showErrorAlert('Error', 'Failed to copy to clipboard');
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) {
      showErrorAlert('Error', 'Unable to capture receipt. Please try again.');
      return;
    }

    try {
      setIsCapturing(true);
      
      // Capture the receipt as an image
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 0.9,
        result: 'tmpfile', // Save to temporary file
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Use expo-sharing for better cross-platform file sharing
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Transaction Receipt',
        });
        console.log('Receipt shared successfully');
      } else {
        // Fallback to React Native Share API
        const result = await Share.share({
          message: Platform.OS === 'android' ? 'Transaction Receipt' : undefined,
          url: Platform.OS === 'ios' ? uri : `file://${uri}`,
          title: 'Transaction Receipt',
        });

        if (result.action === Share.sharedAction) {
          console.log('Receipt shared successfully');
        } else if (result.action === Share.dismissedAction) {
          console.log('Share dismissed');
        }
      }

      // Clean up the temporary file after a delay
      setTimeout(async () => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch (error) {
          console.warn('Error deleting temporary file:', error);
        }
      }, 5000);
    } catch (error: any) {
      console.error('Error sharing receipt:', error);
      showErrorAlert(
        'Error',
        error?.message || 'Failed to share receipt. Please try again.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // Determine if this is a fund transaction
  const isFundTransaction = transaction.transactionTitle?.includes('Fund Wallet') || 
                            transaction.fundingRoute !== undefined ||
                            transaction.route !== undefined;
  
  // Determine transaction type from title or transactionType prop
  const getTransactionType = (): 'send' | 'withdrawal' | 'fund' | 'deposit' | 'convert' | 'billPayment' | 'p2p' | 'cryptoDeposit' | 'cryptoWithdrawal' => {
    // First check if transactionType is explicitly set
    if (transaction.transactionType) {
      return transaction.transactionType;
    }
    
    if (!transaction.transactionTitle) {
      return 'send';
    }
    if (transaction.transactionTitle.includes('Converted') || transaction.transactionTitle.includes('NGN to')) {
      return 'convert';
    }
    if (transaction.transactionTitle.includes('Deposit') || transaction.transactionTitle.includes('Deposited') || transaction.paymentMethod === 'Mobile Money') {
      return 'deposit';
    }
    if (transaction.transactionTitle.includes('P2P') || transaction.p2pType) {
      return 'p2p';
    }
    if (transaction.transactionTitle.includes('Crypto Withdrawal') || (transaction.transactionTitle.includes('Crypto') && transaction.transactionTitle.includes('Withdrawal'))) {
      return 'cryptoWithdrawal';
    }
    if (transaction.transactionTitle.includes('Crypto Deposit') || (transaction.cryptoType || transaction.network)) {
      return 'cryptoDeposit';
    }
    if (transaction.transactionTitle.includes('Received') || transaction.transactionTitle.includes('Fund Wallet')) {
      return 'fund';
    }
    if (transaction.transactionTitle.includes('Withdrawal') || transaction.transactionTitle.includes('Withdrawn')) {
      return 'withdrawal';
    }
    return 'send';
  };

  const transactionType = getTransactionType();
  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
  };

  const copyIfAvailable = (value: string | undefined, label: string) => {
    if (!value) {
      showInfoAlert('Unavailable', `${label} is not available for this transaction`);
      return;
    }
    copyToClipboard(value, label);
  };

  const handleOpenP2PChat = () => {
    if (!transaction.orderId) {
      showInfoAlert('Unavailable', 'Chat is not available for this transaction yet');
      return;
    }

    onClose();
    (navigation as any).navigate('Settings', {
      screen: 'ChatScreen',
      params: {
        orderId: String(transaction.orderId),
        chatName: transaction.chatName || transaction.merchantName || transaction.recipientName,
        chatEmail: transaction.chatEmail || transaction.merchantContact,
        reason: 'P2P Transaction',
        isP2PChat: true,
      },
    });
  };

  const isBankTransferLike = () => {
    const method = transaction.paymentMethod?.toLowerCase();
    const route = (transaction.route || transaction.fundingRoute || '').toLowerCase();
    const title = transaction.transactionTitle?.toLowerCase() || '';
    return (
      method === 'bank transfer' ||
      route === 'bank transfer' ||
      route === 'bank_transfer' ||
      title.includes('bank transfer') ||
      title.includes('palmpay virtual')
    );
  };

  const displayPaymentMethod = (value?: string) => {
    const lowerValue = value?.toLowerCase();
    if (!lowerValue || ['failed', 'pending', 'processing', 'completed', 'successful', 'success'].includes(lowerValue)) {
      if (isBankTransferLike()) return 'Bank Transfer';
      return 'N/A';
    }
    return value;
  };

  const displayCountry = () => {
    if (transaction.country) {
      return transaction.country.toUpperCase() === 'NG' ? 'Nigeria' : transaction.country;
    }
    if (isBankTransferLike()) {
      return 'Nigeria';
    }
    return undefined;
  };

  const amount = transaction.transferAmount || transaction.amountNGN || '0';
  
  // Normalize status to receipt states.
  const normalizeStatus = (status?: string): 'Successful' | 'Pending' | 'Failed' | 'Cancelled' => {
    if (!status) return 'Pending';
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'successful' || statusLower === 'success') {
      return 'Successful';
    }
    if (statusLower === 'pending' || statusLower === 'processing') {
      return 'Pending';
    }
    if (statusLower === 'failed' || statusLower === 'fail') {
      return 'Failed';
    }
    if (statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'cancel') {
      return 'Cancelled';
    }
    return 'Pending';
  };

  const transactionStatus = normalizeStatus(transaction.status);
  
  // Get title text based on transaction type and status
  const getTitleText = () => {
    const statusText = transactionStatus === 'Successful' ? 'Successful' : 
                      transactionStatus === 'Pending' ? 'Pending' :
                      transactionStatus === 'Cancelled' ? 'Cancelled' : 'Failed';
    
    switch (transactionType) {
      case 'convert':
        return transactionStatus === 'Successful' ? `${amount} Converted` : 
               transactionStatus === 'Pending' ? `Conversion Pending` :
               transactionStatus === 'Cancelled' ? `Conversion Cancelled` : `Conversion Failed`;
      case 'deposit':
        return transactionStatus === 'Successful' ? `${amount} Deposited` : 
               transactionStatus === 'Pending' ? `Deposit Pending` :
               transactionStatus === 'Cancelled' ? `Deposit Cancelled` : `Deposit Failed`;
      case 'fund':
        return transactionStatus === 'Successful' ? `${amount} Received` : 
               transactionStatus === 'Pending' ? `Receipt Pending` :
               transactionStatus === 'Cancelled' ? `Receipt Cancelled` : `Receipt Failed`;
      case 'withdrawal':
        return transactionStatus === 'Successful' ? `Withdrawal Successful` : 
               transactionStatus === 'Pending' ? `Withdrawal Pending` :
               transactionStatus === 'Cancelled' ? `Withdrawal Cancelled` : `Withdrawal Failed`;
      case 'billPayment':
        return statusText;
      case 'p2p':
        const cryptoAmount = transaction.totalQty || amount;
        const p2pAction = transaction.p2pType === 'Crypto Sell' ? 'Sold' : 'Bought';
        return transactionStatus === 'Successful' ? `${cryptoAmount} ${p2pAction}` : 
               transactionStatus === 'Pending' ? `P2P Transaction Pending` :
               transactionStatus === 'Cancelled' ? `P2P Transaction Cancelled` : `P2P Transaction Failed`;
      case 'cryptoDeposit':
        const depositQuantity = transaction.quantity || amount;
        return transactionStatus === 'Successful' ? `${depositQuantity} Received` : 
               transactionStatus === 'Pending' ? `Crypto Deposit Pending` :
               transactionStatus === 'Cancelled' ? `Crypto Deposit Cancelled` : `Crypto Deposit Failed`;
      case 'cryptoWithdrawal':
        const withdrawalQuantity = transaction.quantity || amount;
        return transactionStatus === 'Successful' ? `${withdrawalQuantity} Sent` : 
               transactionStatus === 'Pending' ? `Crypto Withdrawal Pending` :
               transactionStatus === 'Cancelled' ? `Crypto Withdrawal Cancelled` : `Crypto Withdrawal Failed`;
      default:
        return transactionStatus === 'Successful' ? `${amount} Sent` : 
               transactionStatus === 'Pending' ? `Transaction Pending` :
               transactionStatus === 'Cancelled' ? `Transaction Cancelled` : `Transaction Failed`;
    }
  };

  // Get message text based on transaction type and status
  const getMessageText = () => {
    if (transactionStatus === 'Pending') {
      switch (transactionType) {
        case 'convert':
          return `Your conversion of ${amount} to Kenya Shiilings is being processed. Please wait for confirmation.`;
        case 'deposit':
          return `Your deposit of ${amount} to your ${displayCountry() || 'wallet'} is being processed.`;
        case 'fund':
          return `Your receipt of ${amount} is being processed.`;
        case 'withdrawal':
          return `Your withdrawal of ${amount} is being processed.`;
        case 'billPayment':
          return `Your bill payment is being processed. Please wait for confirmation.`;
        case 'p2p':
          return `Your P2P transaction is being processed. Please wait for confirmation.`;
        case 'cryptoDeposit':
          return `Your crypto deposit is being processed. Please wait for confirmation.`;
        case 'cryptoWithdrawal':
          return `Your crypto withdrawal is being processed. Please wait for confirmation.`;
        default:
          return `Your transaction is being processed. Please wait for confirmation.`;
      }
    }
    
    if (transactionStatus === 'Cancelled') {
      switch (transactionType) {
        case 'convert':
          return `Your conversion of ${amount} was cancelled.`;
        case 'deposit':
          return `Your deposit of ${amount} was cancelled.`;
        case 'fund':
          return `Your receipt of ${amount} was cancelled.`;
        case 'withdrawal':
          return `Your withdrawal of ${amount} was cancelled.`;
        case 'billPayment':
          return `Your bill payment was cancelled.`;
        case 'p2p':
          return `Your P2P transaction was cancelled.`;
        case 'cryptoDeposit':
          return `Your crypto deposit was cancelled.`;
        case 'cryptoWithdrawal':
          return `Your crypto withdrawal was cancelled.`;
        default:
          return `Your transaction was cancelled.`;
      }
    }

    if (transactionStatus === 'Failed') {
      switch (transactionType) {
        case 'convert':
          return `Your conversion of ${amount} to Kenya Shiilings has failed. Please try again or contact support.`;
        case 'deposit':
          return `Your deposit of ${amount} to your ${displayCountry() || 'wallet'} has failed. Please try again.`;
        case 'fund':
          return `Your receipt of ${amount} has failed. Please try again.`;
        case 'withdrawal':
          return `Your withdrawal of ${amount} has failed. Please try again.`;
        case 'billPayment':
          return `Your bill payment has failed. Please try again or contact support.`;
        case 'p2p':
          return `Your P2P transaction has failed. Please try again or contact support.`;
        case 'cryptoDeposit':
          return `Your crypto deposit has failed. Please try again or contact support.`;
        case 'cryptoWithdrawal':
          return `Your crypto withdrawal has failed. Please try again or contact support.`;
        default:
          return `Your transaction has failed. Please try again or contact support.`;
      }
    }
    
    // Successful status
    switch (transactionType) {
      case 'convert':
        return `Congratulations, You have successfully Converted ${amount} to Kenya Shiilings`;
      case 'deposit':
        return `Congratulations, you have successfully deposited ${amount} to your ${displayCountry() || 'wallet'}`;
      case 'fund':
        return `Congratulations, you have successfully received ${amount}.`;
      case 'withdrawal':
        return `Congratulations, you have successfully withdrawn ${amount}.`;
      case 'billPayment':
        // Format: "Congratulations, You have successfully Recharged 1.5 GB Data to 081245789"
        const billType = transaction.recipientName?.includes('Data') ? 'Recharged' : 
                        transaction.recipientName?.includes('Airtime') ? 'Recharged' :
                        transaction.recipientName?.includes('Electricity') ? 'Paid' :
                        transaction.recipientName?.includes('Cable') ? 'Paid' :
                        transaction.recipientName?.includes('Internet') ? 'Paid' : 'Paid';
        const planText = transaction.plan || 'bill';
        const mobileText = transaction.mobileNumber || transaction.accountNumber || 'recipient';
        // For Data and Airtime: "Recharged {plan} to {mobile}"
        // For others: "Paid {plan} to {mobile}"
        if (billType === 'Recharged') {
          return `Congratulations, You have successfully ${billType} ${planText} to ${mobileText}`;
        } else {
          return `Congratulations, You have successfully ${billType} ${planText} to ${mobileText}`;
        }
      case 'p2p':
        const p2pAction = transaction.p2pType === 'Crypto Sell' ? 'Sold' : 'Bought';
        const p2pAmount = transaction.totalQty || '';
        const p2pAmountNGN = transaction.transferAmount || transaction.amountNGN || '';
        return `Congratulations, You have successfully ${p2pAction} ${p2pAmountNGN} ${p2pAmount}`;
      case 'cryptoDeposit':
        const depositQty = transaction.quantity || amount;
        const senderAddress = transaction.sendingAddress || transaction.recipientName || '';
        // Truncate address if too long
        const truncatedAddress = senderAddress.length > 20 
          ? `${senderAddress.substring(0, 3)}.....${senderAddress.substring(senderAddress.length - 11)}`
          : senderAddress;
        return `Congratulations, You have successfully received ${depositQty} from ${truncatedAddress}`;
      case 'cryptoWithdrawal':
        const withdrawalQty = transaction.quantity || amount;
        const recipientAddress = transaction.receivingAddress || transaction.recipientName || '';
        // Truncate address if too long
        const truncatedRecipientAddress = recipientAddress.length > 20 
          ? `${recipientAddress.substring(0, 3)}.....${recipientAddress.substring(recipientAddress.length - 11)}`
          : recipientAddress;
        return `Congratulations, You have successfully sent ${withdrawalQty} to ${truncatedRecipientAddress}`;
      default:
        return transaction.recipientName
          ? `Congratulations, you have successfully sent ${amount} to ${transaction.recipientName}`
          : `Congratulations, your transaction of ${amount} was completed successfully`;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020c19" />
        <View ref={receiptRef} collapsable={false} style={styles.receiptContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Transaction Receipt</ThemedText>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => {
                onClose(); // Close the modal first
                (navigation as any).navigate('Settings', {
                  screen: 'Support',
                });
              }}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="headset" size={24 * SCALE} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Status Icon */}
          <View style={styles.successIconContainer}>
            <View style={[
              styles.successIconCircle,
              transactionStatus === 'Pending' && styles.pendingIconCircle,
              (transactionStatus === 'Failed' || transactionStatus === 'Cancelled') && styles.failedIconCircle,
            ]}>
              {transactionStatus === 'Successful' ? (
                <Image
                  source={require('../../assets/Vector (32).png')}
                  style={[{ marginBottom: -1, width: 26, height: 26 }]}
                  resizeMode="cover"
                />
              ) : transactionStatus === 'Pending' ? (
                <MaterialCommunityIcons name="clock-outline" size={32 * SCALE} color="#FFFFFF" />
              ) : transactionStatus === 'Cancelled' ? (
                <MaterialCommunityIcons name="cancel" size={32 * SCALE} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="close-circle" size={32 * SCALE} color="#FFFFFF" />
              )}
            </View>
          </View>

          {/* Status Message */}
          <ThemedText style={[
            styles.successTitle,
            transactionStatus === 'Pending' && styles.pendingTitle,
            (transactionStatus === 'Failed' || transactionStatus === 'Cancelled') && styles.failedTitle,
          ]}>
            {getTitleText()}
          </ThemedText>
          <ThemedText style={styles.successMessage}>
            {getMessageText()}
          </ThemedText>

          {/* Transfer Details Card - Show for deposit/convert transactions */}
          {(transactionType === 'deposit' || transactionType === 'convert') && (
            <View style={styles.detailsCard}>
              {transactionType === 'deposit' && (
                <>
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Deposit Amount</ThemedText>
                    <ThemedText style={styles.detailValue}>{amount}</ThemedText>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Fee</ThemedText>
                    <ThemedText style={styles.detailValue}>{displayValue(transaction.fee)}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Credited Amount</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {(() => {
                        // Calculate credited amount: deposit amount - fee
                        const depositAmount = parseFloat(amount.replace(/[^\d.]/g, '')) || 0;
                        const feeAmount = parseFloat((transaction.fee || '0').replace(/[^\d.]/g, '')) || 0;
                        const creditedAmount = depositAmount - feeAmount;
                        // Extract currency symbol from amount
                        const currencyMatch = amount.match(/[^\d.,]/g);
                        const currencySymbol = currencyMatch ? currencyMatch.join('') : '';
                        // Format the credited amount with currency
                        return creditedAmount > 0 
                          ? `${creditedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currencySymbol}`
                          : amount;
                      })()}
                    </ThemedText>
                  </View>
                </>
              )}
              {transactionType === 'convert' && (
                <>
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Transaction Fee</ThemedText>
                    <ThemedText style={styles.detailValue}>{transaction.fee || '500 NGN'}</ThemedText>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Exchange Rate</ThemedText>
                    <ThemedText style={styles.detailValue}>{transaction.route || 'N1 ~ Ksh1,110'}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Funding Route</ThemedText>
                    <ThemedText style={styles.detailValue}>{transaction.fundingRoute || 'Conversion'}</ThemedText>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Transfer Details Card - Show for send and withdrawal transactions */}
          {(transactionType === 'send' || transactionType === 'withdrawal') && (
            <View style={styles.detailsCard}>
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Transfer Amount</ThemedText>
                <ThemedText style={styles.detailValue}>{amount}</ThemedText>
              </View>
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Fee</ThemedText>
                <ThemedText style={styles.detailValue}>{displayValue(transaction.fee)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Payment Amount</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {transaction.paymentAmount || amount}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Bill Payment Details Card */}
          {transactionType === 'billPayment' && (
            <View style={styles.detailsCard}>
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Amount</ThemedText>
                <ThemedText style={styles.detailValue}>{amount}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Fee</ThemedText>
                <ThemedText style={styles.detailValue}>{displayValue(transaction.fee)}</ThemedText>
              </View>
            </View>
          )}

          {/* Merchant Details Card - P2P Transactions */}
          {transactionType === 'p2p' && (
            <View style={styles.detailsCard}>
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Merchant Name</ThemedText>
                <ThemedText style={styles.detailValue}>{displayValue(transaction.merchantName || transaction.recipientName)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Contact</ThemedText>
                <View style={styles.detailValueRow}>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.merchantContact)}</ThemedText>
                <TouchableOpacity style={[styles.chatButton, { marginLeft: 8 * SCALE }]} onPress={handleOpenP2PChat}>
                  <ThemedText style={styles.chatButtonText}>Chat</ThemedText>
                </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Transaction Details Card */}
          <View style={styles.detailsCard}>
            {(transactionType === 'cryptoDeposit' || transactionType === 'cryptoWithdrawal') ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Crypto Sent</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.cryptoType)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Network</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.network)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Quantity</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.quantity)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Amount</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.amountUSDValue)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Fee</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {displayValue(transaction.feeCrypto)} ({displayValue(transaction.feeUSD)})
                  </ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Receiving Address</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.receivingAddress)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.receivingAddress, 'Receiving Address')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Sending Address</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.sendingAddress)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.sendingAddress, 'Sending Address')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Tx Hash</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.txHash)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.txHash, 'Transaction Hash')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Transaction Id</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.transactionId)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.transactionId, 'Transaction ID')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Date</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.dateTime)}</ThemedText>
                </View>
              </>
            ) : transactionType === 'p2p' ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>P2P Type</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.p2pType)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Amount</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.transferAmount || transaction.amountNGN)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Price</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.price)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Total Qty</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.totalQty)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Tx Fee</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.txFee || transaction.fee || '0'}</ThemedText>
                </View>
              </>
            ) : transactionType === 'billPayment' ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Biller Type</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.billerType)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Mobile Number</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.mobileNumber)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Plan</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.plan)}</ThemedText>
                </View>
              </>
            ) : (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Country</ThemedText>
                <ThemedText style={styles.detailValue}>{displayValue(displayCountry())}</ThemedText>
              </View>
            )}
            {(transactionType === 'send' || transactionType === 'withdrawal' || ((transactionType === 'fund' || transactionType === 'deposit') && (transaction.bank || transaction.accountNumber || transaction.accountName))) && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Bank</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.bank)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.accountNumber)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.accountNumber, 'Account Number')}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.accountName)}</ThemedText>
                </View>
              </>
            )}
            {transactionType === 'fund' && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Amount Received</ThemedText>
                  <ThemedText style={styles.detailValue}>{amount}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Funding Route</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.fundingRoute)}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Route</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.route)}</ThemedText>
                </View>
              </>
            )}
            {transactionType === 'deposit' && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Provider</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.provider)}</ThemedText>
                </View>
              </>
            )}
            {transactionType === 'convert' && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Funding Route</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.fundingRoute || 'Conversion'}</ThemedText>
                </View>
              </>
            )}
            {transactionType === 'p2p' ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Tx id</ThemedText>
                  <View style={styles.detailValueRow}>
                    <MaterialCommunityIcons name="lock" size={12 * SCALE} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 4 * SCALE }} />
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.transactionId)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.transactionId, 'Transaction ID')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Payment method</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>{displayPaymentMethod(transaction.paymentMethod)}</ThemedText>
                    <TouchableOpacity style={{ marginLeft: 8 * SCALE }}>
                      <ThemedText style={styles.viewAccountLink}>View Account</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Order time</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.dateTime)}</ThemedText>
                </View>
              </>
            ) : (transactionType === 'cryptoDeposit' || transactionType === 'cryptoWithdrawal') ? (
              // Crypto deposit/withdrawal details are already shown above
              null
            ) : (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Transaction Id</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {displayValue(transaction.transactionId)}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyIfAvailable(transaction.transactionId, 'Transaction ID')}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                {transactionType === 'billPayment' && (
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Transaction type</ThemedText>
                    <ThemedText style={styles.detailValue}>Bill Payment</ThemedText>
                  </View>
                )}
                {(transactionType === 'send' || transactionType === 'deposit' || transactionType === 'withdrawal') && (
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <ThemedText style={styles.detailLabel}>Payment Method</ThemedText>
                    <ThemedText style={styles.detailValue}>{displayPaymentMethod(transaction.paymentMethod)}</ThemedText>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Date</ThemedText>
                  <ThemedText style={styles.detailValue}>{displayValue(transaction.dateTime)}</ThemedText>
                </View>
              </>
            )}
          </View>

          {/* My Review Section - P2P Transactions */}
          {transactionType === 'p2p' && (
            <View style={styles.reviewSection}>
              <ThemedText style={styles.reviewSectionTitle}>My Review</ThemedText>
              <TouchableOpacity style={styles.likeButton}>
              <Image
                source={require('../../assets/Group 41.png')}
                style={[{ marginBottom: -1, width: 26, height: 26 }]}
                resizeMode="cover"
              />
              <ThemedText style={styles.likeButtonText}>You gave this order a like</ThemedText>
              </TouchableOpacity>
              {transaction.reviewText && (
                <View style={styles.reviewCard}>
                  <ThemedText style={styles.reviewText}>{transaction.reviewText}</ThemedText>
                </View>
              )}
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.reviewActionButton}>
                  <MaterialCommunityIcons name="pencil" size={20 * SCALE} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.reviewActionButton}>
                  <MaterialCommunityIcons name="delete" size={20 * SCALE} color="#ff0000" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Share Receipt Button */}
          <TouchableOpacity 
            style={[styles.shareButton, isCapturing && styles.shareButtonDisabled]} 
            onPress={shareReceipt}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.shareButtonText}>Share Receipt</ThemedText>
            )}
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 40 * SCALE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 45 * SCALE,
    paddingBottom: 20 * SCALE,
    height: 65 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
  },
  helpButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 16 * SCALE,
  },
  successIconCircle: {
    width: 84 * SCALE,
    height: 84 * SCALE,
    borderRadius: 42 * SCALE,
    backgroundColor: '#008000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIconCircle: {
    backgroundColor: '#ffa500',
  },
  failedIconCircle: {
    backgroundColor: '#ff0000',
  },
  successTitle: {
    fontSize: 20 * 1,
    fontWeight: '700',
    color: '#008000',
    textAlign: 'center',
    marginBottom: 10 * SCALE,
  },
  pendingTitle: {
    color: '#ffa500',
  },
  failedTitle: {
    color: '#ff0000',
  },
  successMessage: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.15,
    lineHeight: 18 * SCALE,
    marginBottom: 30 * SCALE,
  },
  successMessageBold: {
    fontWeight: '500',
  },
  detailsCard: {
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 16 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailRowBorder: {
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  detailValue: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'right',
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  shareButton: {
    borderWidth: 0.5,
    borderColor: '#b7b7b7',
    borderRadius: 100,
    height: 60 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  chatButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 16 * SCALE,
    paddingVertical: 6 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: '#000000',
  },
  viewAccountLink: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#A9EF45',
  },
  reviewSection: {
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 5 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    padding: 12 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 12 * SCALE,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
    borderWidth: 1,
    width: '55%',
    borderColor: '#008000',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 10 * SCALE,
    marginBottom: 12 * SCALE,
  },
  likeButtonText: {
    fontSize: 11 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8 * SCALE,
    padding: 12 * SCALE,
    marginBottom: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  reviewText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12 * SCALE,
  },
  reviewActionButton: {
    padding: 8 * SCALE,
  },
  bottomSpacer: {
    height: 40 * SCALE,
  },
});

export default TransactionReceiptModal;

