import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'failed';

const FacialRegister = () => {
  const navigation = useNavigation();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleStartScan = () => {
    setScanStatus('scanning');
    // Simulate scanning process
    setTimeout(() => {
      setScanStatus('success');
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1000);
    }, 3000);
  };

  const handleRetry = () => {
    setScanStatus('idle');
  };

  const handleProceed = () => {
    if (scanStatus === 'success') {
      setShowSuccessModal(true);
    } else {
      handleStartScan();
    }
  };

  const handleHome = () => {
    // Navigate to home/dashboard
    console.log('Navigate to home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>KYC Registration</ThemedText>
      </View>

      {/* Shield Icon */}
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="shield-check" size={40} color="#A9EF45" />
      </View>

      {/* Title */}
      <ThemedText style={styles.title}>Facial Verification</ThemedText>
      <ThemedText style={styles.subtitle}>
        Complete your facial verifiction scan
      </ThemedText>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar1} />
        <View style={styles.progressBar2} />
      </View>

      <ThemedText style={styles.instruction}>
        Place your face in the center of the frame
      </ThemedText>

      {/* Face Scanner */}
      <View style={styles.scannerContainer}>
        <View style={styles.scannerOuter}>
          <View style={styles.scannerInner}>
            {scanStatus === 'idle' && (
              <TouchableOpacity onPress={handleStartScan}>
                <MaterialCommunityIcons name="face-recognition" size={100} color="rgba(255, 255, 255, 0.3)" />
              </TouchableOpacity>
            )}
            
            {scanStatus === 'scanning' && (
              <View style={styles.scanningContainer}>
                <MaterialCommunityIcons name="face-recognition" size={100} color="#A9EF45" />
                <View style={styles.scanLine} />
              </View>
            )}
            
            {scanStatus === 'success' && (
              <MaterialCommunityIcons name="check-circle" size={62} color="#A9EF45" />
            )}
            
            {scanStatus === 'failed' && (
              <MaterialCommunityIcons name="close-circle" size={62} color="#FF4444" />
            )}
          </View>
        </View>
      </View>

      {/* Audio Visualizer */}
      {scanStatus === 'scanning' && (
        <View style={styles.audioVisualizer}>
          {[...Array(12)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.audioBar,
                {
                  height: Math.random() * 34,
                  backgroundColor: '#A9EF45',
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Status Text */}
      <View style={styles.statusContainer}>
        {scanStatus === 'idle' && (
          <ThemedText style={styles.statusText}>Tap to start face scan</ThemedText>
        )}
        
        {scanStatus === 'scanning' && (
          <>
            <ThemedText style={styles.statusText}>Face scanning in progress</ThemedText>
            <ThemedText style={styles.statusSubtext}>
              Do not move your head unitl scan is complete
            </ThemedText>
          </>
        )}
        
        {scanStatus === 'success' && (
          <>
            <ThemedText style={styles.statusText}>Verification Successful</ThemedText>
            <ThemedText style={styles.statusSubtext}>
              Your facial verification has been completed successfully
            </ThemedText>
          </>
        )}
        
        {scanStatus === 'failed' && (
          <>
            <ThemedText style={styles.statusText}>Verification Failed</ThemedText>
            <ThemedText style={styles.statusSubtext}>
              Your facial verification failed, kindly retry it
            </ThemedText>
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={scanStatus === 'failed' ? handleRetry : handleProceed}
        >
          <ThemedText style={styles.proceedButtonText}>
            {scanStatus === 'failed' ? 'Retry' : 'Proceed'}
          </ThemedText>
        </TouchableOpacity>
        
        {scanStatus === 'failed' && (
          <>
            <TouchableOpacity style={styles.continueButton}>
              <ThemedText style={styles.continueButtonText}>Continue Later</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.contactSupport}>Contact Support</ThemedText>
          </>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="check-circle" size={90} color="#A9EF45" />
              </View>
            </View>
            <ThemedText style={styles.successMessage}>
              Your verification request has been submitted successfully and will be reviewed soon.
            </ThemedText>
            <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
              <ThemedText style={styles.homeButtonText}>Home</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.decorativeCircle, styles.circleTop]} />
      <View style={[styles.decorativeCircle, styles.circleBottom]} />
    </View>
  );
};

export default FacialRegister;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15.2, // 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
  },
  iconContainer: {
    position: 'absolute',
    right: 20,
    top: 57,
  },
  title: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9.6, // 12 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  progressBar1: {
    flex: 1,
    height: 8,
    backgroundColor: '#A9EF45',
    borderRadius: 4,
  },
  progressBar2: {
    flex: 1,
    height: 8,
    backgroundColor: '#A9EF45',
    borderRadius: 4,
  },
  instruction: {
    fontSize: 9.6,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 40,
  },
  scannerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scannerOuter: {
    width: 257,
    height: 317,
    borderRadius: 257,
    borderWidth: 3,
    borderColor: 'rgba(169, 239, 69, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerInner: {
    width: 257,
    height: 317,
    borderRadius: 257,
    borderWidth: 3,
    borderColor: 'rgba(169, 239, 69, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: '#A9EF45',
    opacity: 0.8,
  },
  audioVisualizer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
    height: 52,
    marginBottom: 20,
  },
  audioBar: {
    width: 4,
    borderRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  statusText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 9.6,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  proceedButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
  continueButton: {
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  contactSupport: {
    fontSize: 9.6,
    fontWeight: '300',
    color: '#A9EF45',
    marginTop: 8,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    opacity: 0.5,
  },
  circleTop: {
    top: 119,
    right: -72,
  },
  circleBottom: {
    bottom: -50,
    left: -14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#020c19',
    borderRadius: 20,
    padding: 40,
    width: '90%',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successCircle: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessage: {
    fontSize: 11.2,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  homeButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  homeButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
});

