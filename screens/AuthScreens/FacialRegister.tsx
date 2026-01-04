import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ThemedText } from '../../components';

// Face detector is not available in Expo Go - using simulation mode
// To enable real face detection, create a development build:
// 1. npm install expo-face-detector
// 2. npx expo prebuild
// 3. npx expo run:android (or run:ios)
const faceDetectorAvailable = false;

type ScanStatus = 'idle' | 'scanning' | 'success' | 'failed';

const FacialRegister = () => {
  const navigation = useNavigation();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionCount, setFaceDetectionCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanStatusRef = useRef<ScanStatus>('idle');

  // Request camera permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Update scanStatusRef whenever scanStatus changes
  useEffect(() => {
    scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (noFaceTimeoutRef.current) {
        clearTimeout(noFaceTimeoutRef.current);
      }
    };
  }, []);

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to use face recognition.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setScanStatus('scanning');
    setFaceDetected(false);
    setFaceDetectionCount(0);
    setScanProgress(0);
    
    // If face detector is not available, use simulation
    if (!faceDetectorAvailable) {
      simulateFaceDetection();
    }
    
    // Set timeout for when no face is detected after 10 seconds
    if (noFaceTimeoutRef.current) {
      clearTimeout(noFaceTimeoutRef.current);
    }
    noFaceTimeoutRef.current = setTimeout(() => {
      if (scanStatusRef.current === 'scanning') {
        setScanStatus('failed');
        Alert.alert(
          'Face Not Detected',
          'Please ensure your face is clearly visible in the frame and try again.',
          [{ text: 'OK', onPress: handleRetry }]
        );
      }
    }, 10000);
  };

  // Simulated face detection for when native module is not available
  const simulateFaceDetection = () => {
    // Simulate face detection after a short delay (user positions face)
    const detectionDelay = setTimeout(() => {
      if (scanStatusRef.current === 'scanning') {
        setFaceDetected(true);
        
        // Simulate scanning progress
        const progressInterval = setInterval(() => {
          if (scanStatusRef.current !== 'scanning') {
            clearInterval(progressInterval);
            return;
          }
          
          setFaceDetectionCount((prev) => {
            const newCount = prev + 1;
            const requiredFrames = 45; // ~1.5 seconds at 30fps
            const progress = Math.min((newCount / requiredFrames) * 100, 100);
            setScanProgress(progress);
            
            if (newCount >= requiredFrames) {
              clearInterval(progressInterval);
              if (noFaceTimeoutRef.current) {
                clearTimeout(noFaceTimeoutRef.current);
                noFaceTimeoutRef.current = null;
              }
              setScanStatus('success');
              setScanProgress(100);
              setTimeout(() => {
                setShowSuccessModal(true);
              }, 1000);
            }
            return newCount;
          });
        }, 33); // Update every 33ms to simulate ~30fps
        
        // Store interval for cleanup
        scanTimeoutRef.current = progressInterval as any;
      }
    }, 1000); // Wait 1 second before detecting face
    
    // Store timeout for cleanup
    if (scanTimeoutRef.current && typeof scanTimeoutRef.current === 'number') {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = detectionDelay as any;
  };

  // Real face detection handler (only used when native module is available)
  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (!faceDetectorAvailable || scanStatusRef.current !== 'scanning') return;

    if (faces.length > 0) {
      const face = faces[0];
      
      // Enhanced face validation checks
      const faceWidth = face.bounds.size.width;
      const faceHeight = face.bounds.size.height;
      
      // Check if face is properly positioned and of adequate size
      const isFaceSizeValid = 
        faceWidth > 80 && 
        faceWidth < 400 && 
        faceHeight > 80 && 
        faceHeight < 400;
      
      // Check if face is centered (roughly in the middle 60% of the frame)
      const faceCenterX = face.bounds.origin.x + faceWidth / 2;
      const faceCenterY = face.bounds.origin.y + faceHeight / 2;
      // Assuming camera view is roughly 300x400, adjust based on actual dimensions
      const isFaceCentered = 
        faceCenterX > 60 && faceCenterX < 240 && 
        faceCenterY > 80 && faceCenterY < 320;
      
      // Check for face landmarks (eyes, nose, mouth) - these indicate a real face
      const hasLandmarks = 
        face.leftEyePosition !== undefined &&
        face.rightEyePosition !== undefined &&
        face.noseBasePosition !== undefined;
      
      // Check eye openness (both eyes should be open for verification)
      const eyesOpen = 
        face.leftEyeOpenProbability !== undefined &&
        face.rightEyeOpenProbability !== undefined &&
        face.leftEyeOpenProbability > 0.5 &&
        face.rightEyeOpenProbability > 0.5;
      
      const isFaceValid = 
        isFaceSizeValid && 
        isFaceCentered && 
        hasLandmarks && 
        eyesOpen;

      if (isFaceValid) {
        // Clear the no-face timeout since we detected a face
        if (noFaceTimeoutRef.current) {
          clearTimeout(noFaceTimeoutRef.current);
          noFaceTimeoutRef.current = null;
        }
        
        setFaceDetected(true);
        setFaceDetectionCount((prev) => {
          const newCount = prev + 1;
          // Require face to be detected for at least 1.5 seconds (45 frames at ~30fps)
          const requiredFrames = 45;
          const progress = Math.min((newCount / requiredFrames) * 100, 100);
          setScanProgress(progress);
          
          if (newCount >= requiredFrames) {
            if (noFaceTimeoutRef.current) {
              clearTimeout(noFaceTimeoutRef.current);
              noFaceTimeoutRef.current = null;
            }
            // Face detected successfully
            setScanStatus('success');
            setScanProgress(100);
            setTimeout(() => {
              setShowSuccessModal(true);
            }, 1000);
          }
          return newCount;
        });
      } else {
        // Face detected but not valid - reset count but don't completely reset
        if (faceDetectionCount > 0) {
          setFaceDetectionCount((prev) => Math.max(0, prev - 1));
          setScanProgress((prev) => Math.max(0, prev - 2));
        } else {
          setFaceDetected(false);
        }
      }
    } else {
      // No face detected - gradually decrease count
      if (faceDetectionCount > 0) {
        setFaceDetectionCount((prev) => Math.max(0, prev - 2));
        setScanProgress((prev) => Math.max(0, prev - 2));
      } else {
        setFaceDetected(false);
      }
    }
  };

  const handleRetry = () => {
    setScanStatus('idle');
    setFaceDetected(false);
    setFaceDetectionCount(0);
    setScanProgress(0);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (noFaceTimeoutRef.current) {
      clearTimeout(noFaceTimeoutRef.current);
      noFaceTimeoutRef.current = null;
    }
  };

  const handleProceed = () => {
    if (scanStatus === 'success') {
      setShowSuccessModal(true);
    } else {
      handleStartScan();
    }
  };

  const handleHome = () => {
    // Close the success modal first
    setShowSuccessModal(false);
    
    // Get the root navigator to navigate to Main
    // FacialRegister is in AuthNavigator, which is a child of RootNavigator
    const rootNavigation = navigation.getParent()?.getParent();
    
    if (rootNavigation) {
      // Navigate to Main navigator, which will show the Home tab by default
      rootNavigation.navigate('Main' as never);
    } else {
      // Fallback: use CommonActions to reset navigation stack to Main
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        })
      );
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#A9EF45" />
        <ThemedText style={styles.statusText}>Requesting camera permission...</ThemedText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="camera-off" size={80} color="rgba(255, 255, 255, 0.5)" />
        <ThemedText style={styles.statusText}>Camera permission is required</ThemedText>
        <TouchableOpacity style={styles.proceedButton} onPress={requestPermission}>
          <ThemedText style={styles.proceedButtonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

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
        {scanStatus === 'scanning' ? (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerOuter}>
                  <View style={styles.scannerInner}>
                    {faceDetected ? (
                      <>
                        <MaterialCommunityIcons name="face-recognition" size={100} color="#A9EF45" />
                        <View style={styles.progressContainerInner}>
                          <ThemedText style={styles.progressText}>{Math.round(scanProgress)}%</ThemedText>
                        </View>
                      </>
                    ) : (
                      <MaterialCommunityIcons name="face-recognition" size={100} color="rgba(255, 255, 255, 0.3)" />
                    )}
                    {faceDetected && <View style={styles.scanLine} />}
                  </View>
                </View>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.scannerOuter}>
            <View style={styles.scannerInner}>
              {scanStatus === 'idle' && (
                <TouchableOpacity onPress={handleStartScan}>
                  <MaterialCommunityIcons name="face-recognition" size={100} color="rgba(255, 255, 255, 0.3)" />
                </TouchableOpacity>
              )}
              
              {scanStatus === 'success' && (
                <MaterialCommunityIcons name="check-circle" size={62} color="#A9EF45" />
              )}
              
              {scanStatus === 'failed' && (
                <MaterialCommunityIcons name="close-circle" size={62} color="#FF4444" />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Audio Visualizer */}
      {scanStatus === 'scanning' && (
        <View style={styles.audioVisualizer}>
          {[...Array(12)].map((_, index) => {
            const isActive = faceDetected && index % 2 === 0;
            return (
              <View
                key={index}
                style={[
                  styles.audioBar,
                  {
                    height: isActive ? 34 : 10,
                    backgroundColor: isActive ? '#A9EF45' : 'rgba(169, 239, 69, 0.3)',
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Status Text */}
      <View style={styles.statusContainer}>
        {scanStatus === 'idle' && (
          <ThemedText style={styles.statusText}>Tap to start face scan</ThemedText>
        )}
        
        {scanStatus === 'scanning' && (
          <>
            <ThemedText style={styles.statusText}>
              {faceDetected
                ? 'Face detected - Keep still...'
                : 'Position your face in the frame'}
            </ThemedText>
            <ThemedText style={styles.statusSubtext}>
              {faceDetected
                ? 'Do not move your head until scan is complete'
                : 'Make sure your face is clearly visible and well-lit'}
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
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  cameraContainer: {
    width: 257,
    height: 317,
    borderRadius: 257,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: 257,
    height: 317,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scannerOuter: {
    width: 257,
    height: 317,
    borderRadius: 257,
    borderWidth: 3,
    borderColor: 'rgba(169, 239, 69, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scannerInner: {
    width: 257,
    height: 317,
    borderRadius: 257,
    borderWidth: 3,
    borderColor: 'rgba(169, 239, 69, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
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
    top: '50%',
  },
  progressContainerInner: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A9EF45',
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

