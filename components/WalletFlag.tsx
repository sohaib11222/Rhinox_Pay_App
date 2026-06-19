import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import ThemedText from './ThemedText';
import {
  COUNTRY_FLAG_EMOJI,
  CountryFlagRef,
  getFiatWalletFlagDisplay,
  resolveFlagUri,
} from '../utils/walletFlags';

type WalletFlagProps = {
  currency: string;
  apiFlag?: string | null;
  countries?: CountryFlagRef[];
  size?: number;
  style?: ViewStyle;
};

export function WalletFlag({
  currency,
  apiFlag,
  countries = [],
  size = 36,
  style,
}: WalletFlagProps) {
  const display = getFiatWalletFlagDisplay(currency, apiFlag, countries);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      {display.kind === 'image' ? (
        <Image source={display.source} style={styles.image} resizeMode="contain" />
      ) : (
        <ThemedText style={[styles.emoji, { fontSize: Math.round(size * 0.58) }]}>
          {display.emoji}
        </ThemedText>
      )}
    </View>
  );
}

type CountryFlagProps = {
  flag?: string | null;
  countryCode?: string | null;
  size?: number;
  style?: ViewStyle;
};

export function CountryFlag({ flag, countryCode, size = 30, style }: CountryFlagProps) {
  const flagUri = resolveFlagUri(flag);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      {flagUri ? (
        <Image source={{ uri: flagUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <ThemedText style={[styles.emoji, { fontSize: Math.round(size * 0.58) }]}>
          {countryCode && COUNTRY_FLAG_EMOJI[countryCode.toUpperCase()]
            ? COUNTRY_FLAG_EMOJI[countryCode.toUpperCase()]
            : '🏳️'}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    textAlign: 'center',
  },
});
