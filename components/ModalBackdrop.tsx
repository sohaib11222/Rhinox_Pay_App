import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type ModalBackdropProps = {
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  children: React.ReactNode;
};

/**
 * expo-blur snapshots the view below using software rendering on Android,
 * which crashes when any hardware bitmap Image is visible underneath.
 */
export default function ModalBackdrop({
  style,
  intensity = 20,
  tint = 'dark',
  children,
}: ModalBackdropProps) {
  if (Platform.OS === 'android') {
    return <View style={[styles.androidOverlay, style]}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={style}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  androidOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
});
