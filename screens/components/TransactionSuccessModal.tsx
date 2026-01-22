import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface TransactionSuccessModalProps {
  visible: boolean;
  transaction: {
    amount?: string;
    fee?: string;
    mobileNumber?: string;
    networkProvider?: string;
    country?: string;
    transactionType?: 'airtime' | 'billPayment' | 'send' | 'deposit';
  };
  onViewTransaction: () => void;
  onCancel: () => void;
}

const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  visible,
  transaction,
  onViewTransaction,
  onCancel,
}) => {
  // Format success message based on transaction type
  const getSuccessMessage = () => {
    if (transaction.transactionType === 'deposit') {
      const amount = transaction.amount || 'N2,000';
      const country = transaction.country || 'Nigeria';
      return `Congratulations, You have successfully deposited ${amount} to your ${country} Wallet`;
    }
    if (transaction.transactionType === 'airtime' || transaction.transactionType === 'billPayment') {
      const amount = transaction.amount || 'N2,000';
      const network = transaction.networkProvider || 'MTN';
      const mobile = transaction.mobileNumber || '081234578';
      return `Congratulations, you have successfully recharged ${amount} ${network} on ${mobile}`;
    }
    if (transaction.transactionType === 'send') {
      const amount = transaction.amount || 'N2,000';
      return `You have successfully sent ${amount} from your Rhinoxpay NGN wallet`;
    }
    return 'Transaction completed successfully';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
              <Image
                source={require('../../assets/Vector (32).png')}
                style={styles.successIconImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Success Title */}
          <ThemedText style={styles.successTitle}>Complete</ThemedText>

          {/* Success Message */}
          <ThemedText style={styles.successMessage}>
            {getSuccessMessage()}
          </ThemedText>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.viewTransactionButton} onPress={onViewTransaction}>
              <ThemedText style={styles.viewTransactionButtonText}>View Transaction</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#020C19',
    borderRadius: 20 * SCALE,
    paddingTop: 40 * SCALE,
    alignItems: 'center',
    borderWidth: 0.3,
    maxWidth: 390 * SCALE,
  },
  successIconContainer: {
    marginBottom: 20 * SCALE,
  },
  successIconCircle: {
    width: 84 * SCALE,
    height: 84 * SCALE,
    borderRadius: 42 * SCALE,
    backgroundColor: '#008000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconImage: {
    width: 26,
    height: 26,
  },
  successTitle: {
    fontSize: 20 * SCALE,
    fontWeight: '700',
    color: '#008000',
    textAlign: 'center',
    marginBottom: 12 * SCALE,
    marginTop: 8 * SCALE,
  },
  successMessage: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18 * SCALE,
    marginBottom: 40 * SCALE,
    paddingHorizontal: 20 * SCALE,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  viewTransactionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 50 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderColor: '#FFFFFF33',
  },
  viewTransactionButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#A9EF45',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 50 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: '#FFFFFF33',
  },
  cancelButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
});

export default TransactionSuccessModal;

