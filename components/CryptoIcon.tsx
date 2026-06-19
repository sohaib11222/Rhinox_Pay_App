import React, { useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { getCryptoIconSource } from '../utils/cryptoIcons';

interface CryptoIconProps {
  currency?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const FALLBACK_ICON = require('../assets/CurrencyBtc.png');

export function CryptoIcon({
  currency,
  size = 40,
  style,
  resizeMode = 'cover',
}: CryptoIconProps) {
  const [source, setSource] = useState<ImageSourcePropType>(() => getCryptoIconSource(currency));

  React.useEffect(() => {
    setSource(getCryptoIconSource(currency));
  }, [currency]);

  return (
    <Image
      source={source}
      defaultSource={FALLBACK_ICON}
      onError={() => setSource(FALLBACK_ICON)}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      resizeMode={resizeMode}
    />
  );
}

export default CryptoIcon;
