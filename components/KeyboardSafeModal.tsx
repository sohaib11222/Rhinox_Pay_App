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

const KeyboardSafeModalContext = createContext<KeyboardSafeContextValue | null>(null);

interface KeyboardSafeContextValue {
  scrollToFocusedInput: ScrollToInputFn;
}

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
  /** `sheet` = bottom sheet (auth OTP). `center` = centered card (default). */
  presentation?: 'center' | 'sheet';
}

const KeyboardSafeModal: React.FC<KeyboardSafeModalProps> = ({
  visible,
  onRequestClose,
  children,
  contentStyle,
  presentation = 'center',
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isSheet = presentation === 'sheet';

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
    const delay = Platform.OS === 'android' ? 150 : 50;

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

  const bottomPad = isSheet
    ? Math.max(insets.bottom, keyboardHeight > 0 ? 12 : 20)
    : keyboardHeight > 0
      ? keyboardHeight
      : Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={[styles.overlay, isSheet && styles.overlaySheet]}>
        <KeyboardSafeModalContext.Provider value={contextValue}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[
              isSheet ? styles.scrollContentSheet : styles.scrollContentCenter,
              {
                paddingTop: isSheet ? 0 : Math.max(insets.top, 16),
                paddingBottom: bottomPad,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled
          >
            <View
              style={[
                isSheet ? styles.contentSheet : styles.contentCenter,
                contentStyle,
              ]}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardSafeModalContext.Provider>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlaySheet: {
    justifyContent: 'flex-end',
  },
  flex: {
    flex: 1,
  },
  scrollContentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrollContentSheet: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  contentCenter: {
    backgroundColor: '#0F1825',
    borderRadius: 16,
    padding: 20,
  },
  contentSheet: {
    width: '100%',
    backgroundColor: '#020c19',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0.3,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 8,
    overflow: 'hidden',
  },
});

export default KeyboardSafeModal;
