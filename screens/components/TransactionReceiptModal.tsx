import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const shareReceipt = () => {
    // TODO: Implement share functionality
    Alert.alert('Share Receipt', 'Share functionality to be implemented');
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
    if (transaction.transactionTitle.includes('Deposited') || transaction.paymentMethod === 'Mobile Money') {
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
  const amount = transaction.transferAmount || transaction.amountNGN || 'N200,000';
  
  // Get title text based on transaction type
  const getTitleText = () => {
    switch (transactionType) {
      case 'convert':
        return `${amount} Converted`;
      case 'deposit':
        return `${amount} Deposited`;
      case 'fund':
        return `${amount} Received`;
      case 'withdrawal':
        return `Withdrawal Successful`;
      case 'billPayment':
        return `Success`;
      case 'p2p':
        // Format: "20 USDT Sold" or "20 USDT Bought"
        const cryptoAmount = transaction.totalQty || '20 USDT';
        const p2pAction = transaction.p2pType === 'Crypto Sell' ? 'Sold' : 'Bought';
        return `${cryptoAmount} ${p2pAction}`;
      case 'cryptoDeposit':
        // Format: "0.25 ETH Received"
        const depositQuantity = transaction.quantity || '0.25 ETH';
        return `${depositQuantity} Received`;
      case 'cryptoWithdrawal':
        // Format: "0.25 ETH Sent"
        const withdrawalQuantity = transaction.quantity || '0.25 ETH';
        return `${withdrawalQuantity} Sent`;
      default:
        return `${amount} Sent`;
    }
  };

  // Get message text based on transaction type
  const getMessageText = () => {
    switch (transactionType) {
      case 'convert':
        return `Congratulations, You have successfully Converted ${amount} to Kenya Shiilings`;
      case 'deposit':
        return `Congratulations, You have successfully deposited ${amount} to your ${transaction.country || 'Kenya'} Wallet`;
      case 'fund':
        return `Congratulations, You have successfully sent ${amount} from ${transaction.route || 'Yellow Card'}`;
      case 'withdrawal':
        return `Congratulations, You have successfully withdrawn ${amount} to ${transaction.accountName || transaction.recipientName || 'Opay'}`;
      case 'billPayment':
        // Format: "Congratulations, You have successfully Recharged 1.5 GB Data to 081245789"
        const billType = transaction.recipientName?.includes('Data') ? 'Recharged' : 
                        transaction.recipientName?.includes('Airtime') ? 'Recharged' :
                        transaction.recipientName?.includes('Electricity') ? 'Paid' :
                        transaction.recipientName?.includes('Cable') ? 'Paid' :
                        transaction.recipientName?.includes('Internet') ? 'Paid' : 'Paid';
        const planText = transaction.plan || '1.5 GB Data';
        const mobileText = transaction.mobileNumber || '081245789';
        // For Data and Airtime: "Recharged {plan} to {mobile}"
        // For others: "Paid {plan} to {mobile}"
        if (billType === 'Recharged') {
          return `Congratulations, You have successfully ${billType} ${planText} to ${mobileText}`;
        } else {
          return `Congratulations, You have successfully ${billType} ${planText} to ${mobileText}`;
        }
      case 'p2p':
        // Format: "Congratulations, You have successfully Sold N20 USDT"
        const p2pAction = transaction.p2pType === 'Crypto Sell' ? 'Sold' : 'Bought';
        const p2pAmount = transaction.totalQty || '20 USDT';
        const p2pAmountNGN = transaction.transferAmount || transaction.amountNGN || 'N20';
        return `Congratulations, You have successfully ${p2pAction} ${p2pAmountNGN} ${p2pAmount}`;
      case 'cryptoDeposit':
        // Format: "Congratulations, You have successfully received 0.25 ETH from Ox.....123fcj2ifk3edw"
        const depositQty = transaction.quantity || '0.25 ETH';
        const senderAddress = transaction.sendingAddress || transaction.recipientName || '0x...123fcj2ifk3edw';
        // Truncate address if too long
        const truncatedAddress = senderAddress.length > 20 
          ? `${senderAddress.substring(0, 3)}.....${senderAddress.substring(senderAddress.length - 11)}`
          : senderAddress;
        return `Congratulations, You have successfully received ${depositQty} from ${truncatedAddress}`;
      case 'cryptoWithdrawal':
        // Format: "Congratulations, You have successfully sent 0.25 ETH to Ox.....123fcj2ifk3edw"
        const withdrawalQty = transaction.quantity || '0.25 ETH';
        const recipientAddress = transaction.receivingAddress || transaction.recipientName || '0x...123fcj2ifk3edw';
        // Truncate address if too long
        const truncatedRecipientAddress = recipientAddress.length > 20 
          ? `${recipientAddress.substring(0, 3)}.....${recipientAddress.substring(recipientAddress.length - 11)}`
          : recipientAddress;
        return `Congratulations, You have successfully sent ${withdrawalQty} to ${truncatedRecipientAddress}`;
      default:
        return `Congratulations, You have successfully sent ${amount} to ${transaction.recipientName || 'Adebisi Lateefat'}`;
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

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
            <Image
                source={require('../../assets/Vector (32).png')}
                style={[{ marginBottom: -1, width: 26, height: 26 }]}
                resizeMode="cover"
              />   
                       </View>
          </View>

          {/* Success Message */}
          <ThemedText style={styles.successTitle}>
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
                    <ThemedText style={styles.detailValue}>{transaction.fee || 'Ksh20'}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Credited Amount</ThemedText>
                    <ThemedText style={styles.detailValue}>{amount}</ThemedText>
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
                <ThemedText style={styles.detailValue}>{transaction.fee || 'N20'}</ThemedText>
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
                <ThemedText style={styles.detailValue}>{transaction.fee || 'N0'}</ThemedText>
              </View>
            </View>
          )}

          {/* Merchant Details Card - P2P Transactions */}
          {transactionType === 'p2p' && (
            <View style={styles.detailsCard}>
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Merchant Name</ThemedText>
                <ThemedText style={styles.detailValue}>{transaction.merchantName || transaction.recipientName || 'Qamar Malik'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Contact</ThemedText>
                <TouchableOpacity style={styles.chatButton}>
                  <ThemedText style={styles.chatButtonText}>Chat</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transaction Details Card */}
          <View style={styles.detailsCard}>
            {(transactionType === 'cryptoDeposit' || transactionType === 'cryptoWithdrawal') ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Crypto Sent</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.cryptoType || 'Ethereum'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Network</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.network || 'Ethereum'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Quantity</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.quantity || '0.25 ETH'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Amount</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.amountUSDValue || '$2,550.50'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Fee</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {transaction.feeCrypto || '0.000001 ETH'} ({transaction.feeUSD || '$2.50'})
                  </ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Receiving Address</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {transaction.receivingAddress || '0x123edfgtrwe457kslwltkwflelwlvld'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.receivingAddress || '0x123edfgtrwe457kslwltkwflelwlvld', 'Receiving Address')}
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
                      {transaction.sendingAddress || '0x123edfgtrwe457kslwltkwflelwlvld'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.sendingAddress || '0x123edfgtrwe457kslwltkwflelwlvld', 'Sending Address')}
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
                      {transaction.txHash || '13ijksm219ef23e9fi3295h2nfi923rf9n92f9'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.txHash || '13ijksm219ef23e9fi3295h2nfi923rf9n92f9', 'Transaction Hash')}
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
                      {transaction.transactionId || '12dwerkxywurcksc'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.transactionId || '12dwerkxywurcksc', 'Transaction ID')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Date</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.dateTime || 'Oct 16, 2025 - 07:22 AM'}</ThemedText>
                </View>
              </>
            ) : transactionType === 'p2p' ? (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>P2P Type</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.p2pType || 'Crypto Sell'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Amount</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.transferAmount || transaction.amountNGN || '10,000 NGN'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Price</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.price || '1,500 NGN'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Total Qty</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.totalQty || '5.2 USDT'}</ThemedText>
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
                  <ThemedText style={styles.detailValue}>{transaction.billerType || 'MTN'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Mobile Number</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.mobileNumber || '08012456789'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Plan</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.plan || '1.5 GB for 30 Days'}</ThemedText>
                </View>
              </>
            ) : (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <ThemedText style={styles.detailLabel}>Country</ThemedText>
                <ThemedText style={styles.detailValue}>{transaction.country || 'Nigeria'}</ThemedText>
              </View>
            )}
            {(transactionType === 'send' || transactionType === 'withdrawal') && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Bank</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.bank || 'Wema Bank'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>
                      {transaction.accountNumber || '0123456789'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.accountNumber || '0123456789', 'Account Number')}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Account Name</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.accountName || 'Opay'}</ThemedText>
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
                  <ThemedText style={styles.detailValue}>{transaction.fundingRoute || 'Bank Transfer'}</ThemedText>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Route</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.route || 'Yellow Card'}</ThemedText>
                </View>
              </>
            )}
            {transactionType === 'deposit' && (
              <>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Provider</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.provider || 'MTN'}</ThemedText>
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
                      {transaction.transactionId || '128DJ2I31IDJKQKCM'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.transactionId || '128DJ2I31IDJKQKCM', 'Transaction ID')}
                      style={{ marginLeft: 8 * SCALE }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={12 * SCALE} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <ThemedText style={styles.detailLabel}>Payment method</ThemedText>
                  <View style={styles.detailValueRow}>
                    <ThemedText style={styles.detailValue}>{transaction.paymentMethod || 'Bank Transfer'}</ThemedText>
                    <TouchableOpacity style={{ marginLeft: 8 * SCALE }}>
                      <ThemedText style={styles.viewAccountLink}>View Account</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Order time</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.dateTime || 'Oct 16, 2025 - 07:22AM'}</ThemedText>
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
                      {transaction.transactionId || '12dwerkxywurcksc'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transaction.transactionId || '12dwerkxywurcksc', 'Transaction ID')}
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
                    <ThemedText style={styles.detailValue}>{transaction.paymentMethod || 'Bank Transfer'}</ThemedText>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Date</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.dateTime || 'Oct 16, 2025 - 07:22AM'}</ThemedText>
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
              />                <ThemedText style={styles.likeButtonText}>You gave this order a like</ThemedText>
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
          <TouchableOpacity style={styles.shareButton} onPress={shareReceipt}>
            <ThemedText style={styles.shareButtonText}>Share Receipt</ThemedText>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  successTitle: {
    fontSize: 20 * 1,
    fontWeight: '700',
    color: '#008000',
    textAlign: 'center',
    marginBottom: 10 * SCALE,
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

