import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  NativeSyntheticEvent,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCROLL_ABOVE_KEYBOARD = Platform.OS === 'ios' ? 80 : 100;

type ScrollToInputFn = (
  event: NativeSyntheticEvent<TextInputFocusEventData>,
  extraOffset?: number
) => void;

interface KeyboardSafeModalContextValue {
  scrollToFocusedInput: ScrollToInputFn;
}

const KeyboardSafeModalContext = createContext<KeyboardSafeModalContextValue | null>(null);

export function useKeyboardSafeModalInput(extraOffset = 0) {
  const ctx = useContext(KeyboardSafeModalContext);

  const onFocus = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      ctx?.scrollToFocusedInput(event, extraOffset);
    },
    [ctx, extraOffset]
  );

  return { onFocus };
}

/** TextInput for modals — auto-scrolls above keyboard (must be inside KeyboardSafeModal). */
export function KeyboardAwareModalTextInput({
  extraOffset = 0,
  onFocus,
  ...props
}: TextInputProps & { extraOffset?: number }) {
  const { onFocus: scrollOnFocus } = useKeyboardSafeModalInput(extraOffset);

  return (
    <TextInput
      {...props}
      onFocus={(event) => {
        scrollOnFocus(event);
        onFocus?.(event);
      }}
    />
  );
}

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const scrollToFocusedInput = useCallback<ScrollToInputFn>((event, extraOffset = 0) => {
    const scrollView = scrollRef.current as ScrollView & {
      scrollResponderScrollNativeHandleToKeyboard?: (
        nodeHandle: number,
        additionalOffset?: number,
        preventNegativeScrollOffset?: boolean
      ) => void;
    };

    const nodeHandle = event.nativeEvent.target;
    if (!scrollView || !nodeHandle) {
      return;
    }

    const offset = SCROLL_ABOVE_KEYBOARD + extraOffset;
    const delay = Platform.OS === 'android' ? 200 : 80;

    setTimeout(() => {
      if (typeof scrollView.scrollResponderScrollNativeHandleToKeyboard === 'function') {
        scrollView.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset, true);
        return;
      }

      scrollView.scrollTo({ y: 120 + extraOffset, animated: true });
    }, delay);
  }, []);

  const contextValue = React.useMemo(
    () => ({ scrollToFocusedInput }),
    [scrollToFocusedInput]
  );

  const bottomPad = keyboardHeight > 0 ? keyboardHeight + 16 : Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <KeyboardSafeModalContext.Provider value={contextValue}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: bottomPad,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            <View style={[styles.content, contentStyle]}>{children}</View>
          </ScrollView>
        </KeyboardSafeModalContext.Provider>
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
