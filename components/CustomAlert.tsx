import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

export interface CustomAlertOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onDismiss?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  options: CustomAlertOptions | null;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, options, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!options) return null;

  const { title, message, type = 'info', buttons = [{ text: 'OK' }] } = options;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#A9EF45' };
      case 'error':
        return { name: 'alert-circle', color: '#ff0000' };
      case 'warning':
        return { name: 'alert', color: '#FFA500' };
      default:
        return { name: 'information', color: '#A9EF45' };
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(169, 239, 69, 0.1)';
      case 'error':
        return 'rgba(255, 0, 0, 0.1)';
      case 'warning':
        return 'rgba(255, 165, 0, 0.1)';
      default:
        return 'rgba(169, 239, 69, 0.1)';
    }
  };

  const icon = getIcon();

  type ButtonType = NonNullable<CustomAlertOptions['buttons']>[number];

  const handleButtonPress = (button: ButtonType) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.8)" />
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.alertContent}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
                  <MaterialCommunityIcons name={icon.name as any} size={40 * SCALE} color={icon.color} />
                </View>

                {/* Title */}
                <ThemedText style={styles.title}>{title}</ThemedText>

                {/* Message */}
                {message && <ThemedText style={styles.message}>{message}</ThemedText>}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  {buttons.map((button, index) => {
                    const isPrimary = button.style !== 'cancel' && button.style !== 'destructive';
                    const isDestructive = button.style === 'destructive';
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          isPrimary && styles.buttonPrimary,
                          button.style === 'cancel' && styles.buttonCancel,
                          isDestructive && styles.buttonDestructive,
                          buttons.length > 1 && index < buttons.length - 1 && styles.buttonMargin,
                        ]}
                        onPress={() => handleButtonPress(button)}
                      >
                        <ThemedText
                          style={[
                            styles.buttonText,
                            isPrimary && styles.buttonTextPrimary,
                            button.style === 'cancel' && styles.buttonTextCancel,
                            isDestructive && styles.buttonTextDestructive,
                          ]}
                        >
                          {button.text}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  alertContainer: {
    width: '100%',
    maxHeight: '50%',
  },
  alertContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 20 * SCALE,
    borderTopRightRadius: 20 * SCALE,
    padding: 24 * SCALE,
    paddingBottom: 40 * SCALE,
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 60 * SCALE,
    height: 60 * SCALE,
    borderRadius: 30 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16 * SCALE,
    marginTop: 10 * SCALE,
  },
  title: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12 * SCALE,
  },
  message: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24 * SCALE,
    lineHeight: 20 * SCALE,
    paddingHorizontal: 10 * SCALE,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 17 * SCALE,
    paddingHorizontal: 20 * SCALE,
    borderRadius: 100 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60 * SCALE,
  },
  buttonPrimary: {
    backgroundColor: '#A9EF45',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: '#b7b7b7',
  },
  buttonDestructive: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  buttonMargin: {
    marginRight: 12 * SCALE,
  },
  buttonText: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
  },
  buttonTextPrimary: {
    color: '#000000',
  },
  buttonTextCancel: {
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#ff0000',
  },
});

export default CustomAlert;

