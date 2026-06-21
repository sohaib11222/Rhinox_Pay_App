import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardSafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
}

/**
 * Scrollable screen wrapper that keeps inputs visible when the keyboard opens.
 * Uses automaticallyAdjustKeyboardInsets (RN) + safe-area padding; avoids the
 * Android "height" shrink that causes white gaps with edge-to-edge layouts.
 */
const KeyboardSafeScreen: React.FC<KeyboardSafeScreenProps> = ({
  children,
  backgroundColor = '#020c19',
  contentContainerStyle,
  scrollViewProps,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardSafeScreen;
