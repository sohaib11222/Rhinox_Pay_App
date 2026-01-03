import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * Reusable loading indicator component
 * Can be used as a standalone component or as a refresh indicator
 * 
 * @param size - Size of the activity indicator (default: 'small')
 * @param color - Color of the activity indicator (default: '#A9EF45')
 * @param text - Optional text to display below the indicator
 * @param fullScreen - Whether to show as full screen overlay (default: false)
 * 
 * @example
 * ```tsx
 * <LoadingIndicator size="large" text="Loading..." />
 * ```
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'small',
  color = '#A9EF45',
  text,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen
    ? [styles.container, styles.fullScreen]
    : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <ThemedText style={[styles.text, { color }]}>{text}</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 12, 25, 0.8)',
    zIndex: 1000,
  },
  text: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '300',
  },
});

