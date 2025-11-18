import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ThemedText } from '../../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCALE = 0.9;

interface TransactionErrorModalProps {
  visible: boolean;
  transaction: {
    amountNGN?: string;
    recipientName?: string;
    errorMessage?: string;
    transactionType?: 'send' | 'withdrawal' | 'fund' | 'deposit' | 'convert';
    transferAmount?: string;
  };
  onRetry: () => void;
  onCancel: () => void;
}

const TransactionErrorModal: React.FC<TransactionErrorModalProps> = ({
  visible,
  transaction,
  onRetry,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Error Icon */}
          <View style={styles.errorIconContainer}>
            <View style={styles.errorIconCircle}>
              <MaterialCommunityIcons name="close" size={46 * SCALE} color="#FFFFFF" />
            </View>
          </View>

          {/* Error Message */}
          <ThemedText style={styles.errorTitle}>
            {transaction.transactionType === 'withdrawal' 
              ? 'Withdrawal Failed'
              : `${transaction.transferAmount || transaction.amountNGN || 'N200,000'} Not Sent`}
          </ThemedText>
          <ThemedText style={styles.errorMessage}>
            {transaction.transactionType === 'withdrawal'
              ? `Your withdrawal of ${transaction.transferAmount || transaction.amountNGN || 'N200,000'} could not be completed`
              : `Your transfer of ${transaction.transferAmount || transaction.amountNGN || 'N200,000'} could not be completed due to netwrok error`}
          </ThemedText>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
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
    // padding: 30 * SCALE,
    paddingTop: 40 * SCALE,
    // paddingBottom: 40 * SCALE,
    alignItems: 'center',
    borderWidth: 0.3,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: 390 * SCALE,
  },
  errorIconContainer: {
    marginBottom: 20 * SCALE,
  },
  errorIconCircle: {
    width: 84 * SCALE,
    height: 84 * SCALE,
    borderRadius: 42 * SCALE,
    backgroundColor: '#ff0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 20 * SCALE,
    fontWeight: '700',
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 12 * SCALE,
    marginTop: 8 * SCALE,
  },
  errorMessage: {
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
    // gap: 12 * SCALE,
    width: '100%',
    justifyContent: 'center',
  },
  retryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    // borderRadius: 100,
    
    height: 50 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderColor: '#FFFFFF33',
  },
  retryButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#A9EF45',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    // borderRadius: 100,
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

export default TransactionErrorModal;

