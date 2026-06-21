import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardSafeModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

const KeyboardSafeModal: React.FC<KeyboardSafeModalProps> = ({
  visible,
  onRequestClose,
  children,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.content, contentStyle]}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: '#0F1825',
    borderRadius: 16,
    padding: 20,
  },
});

export default KeyboardSafeModal;
