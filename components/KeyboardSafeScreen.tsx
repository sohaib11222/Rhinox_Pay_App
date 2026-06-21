import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCROLL_ABOVE_KEYBOARD = Platform.OS === 'ios' ? 90 : 120;

type ScrollToInputFn = (
  event: NativeSyntheticEvent<TextInputFocusEventData>,
  extraOffset?: number
) => void;

interface KeyboardSafeContextValue {
  scrollToFocusedInput: ScrollToInputFn;
}

const KeyboardSafeContext = createContext<KeyboardSafeContextValue | null>(null);

/**
 * Spread onto TextInput so the parent KeyboardSafeScreen scrolls the field above the keyboard.
 */
export function useKeyboardSafeInput(extraOffset = 0) {
  const ctx = useContext(KeyboardSafeContext);

  const onFocus = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      ctx?.scrollToFocusedInput(event, extraOffset);
    },
    [ctx, extraOffset]
  );

  return { onFocus };
}

/** TextInput that auto-scrolls into view when focused (must be inside KeyboardSafeScreen). */
export function KeyboardAwareTextInput({
  extraOffset = 0,
  onFocus,
  ...props
}: TextInputProps & { extraOffset?: number }) {
  const { onFocus: scrollOnFocus } = useKeyboardSafeInput(extraOffset);

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

interface KeyboardSafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
}

const KeyboardSafeScreen: React.FC<KeyboardSafeScreenProps> = ({
  children,
  backgroundColor = '#020c19',
  contentContainerStyle,
  scrollViewProps,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
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
  }, []);

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

      const screenHeight = Dimensions.get('window').height;
      scrollView.scrollTo({
        y: Math.max(0, screenHeight * 0.35 + extraOffset),
        animated: true,
      });
    }, delay);
  }, []);

  const contextValue = React.useMemo(
    () => ({ scrollToFocusedInput }),
    [scrollToFocusedInput]
  );

  const bottomPad = keyboardHeight > 0 ? keyboardHeight + 16 : Math.max(insets.bottom, 24);

  return (
    <KeyboardSafeContext.Provider value={contextValue}>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardSafeContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardSafeScreen;
