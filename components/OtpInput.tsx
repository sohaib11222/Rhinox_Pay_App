import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { OTP_LENGTH } from '../constants/otp';

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, onComplete, disabled }) => {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const applyCode = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || '');
      onChange(next);
      if (digits.length === OTP_LENGTH) {
        onComplete?.(digits.join(''));
      } else if (digits.length > 0) {
        refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      }
    },
    [onChange, onComplete]
  );

  useEffect(() => {
    const code = value.join('');
    if (code.length === OTP_LENGTH && /^\d+$/.test(code)) {
      onComplete?.(code);
    }
  }, [value, onComplete]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      applyCode(text);
      return;
    }
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleFocus = async (index: number) => {
    setFocusedIndex(index);
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip && /^\d{4,8}$/.test(clip.trim())) {
        applyCode(clip.trim());
      }
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          style={[styles.box, focusedIndex === index && styles.boxFocused]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? OTP_LENGTH : 1}
          editable={!disabled}
          selectTextOnFocus
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  boxFocused: {
    borderColor: '#A9EF45',
  },
});

export default OtpInput;
