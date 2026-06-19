import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

// Font family names mapping
export const FontFamilies = {
  // SF Pro Display variants
  SFProRegular: 'SFPRODISPLAYREGULAR',
  SFProBold: 'SFPRODISPLAYBOLD',
  SFProMedium: 'SFPRODISPLAYMEDIUM',
  SFProBlackItalic: 'SFPRODISPLAYBLACKITALIC',
  SFProHeavyItalic: 'SFPRODISPLAYHEAVYITALIC',
  SFProLightItalic: 'SFPRODISPLAYLIGHTITALIC',
  SFProSemiboldItalic: 'SFPRODISPLAYSEMIBOLDITALIC',
  SFProThinItalic: 'SFPRODISPLAYTHINITALIC',
  SFProUltraLightItalic: 'SFPRODISPLAYULTRALIGHTITALIC',
  // Agbalumo
  AgbalumoRegular: 'Agbalumo-Regular',
} as const;

export type FontFamily = typeof FontFamilies[keyof typeof FontFamilies];

import { TYPOGRAPHY, TypographyVariant } from '../constants/typography';

interface ThemedTextProps extends TextProps {
  fontFamily?: FontFamily;
  variant?: TypographyVariant;
}

/**
 * ThemedText component that applies custom fonts from assets/fonts
 * Default font: SFPRODISPLAYREGULAR (SFProRegular)
 */
const ThemedText: React.FC<ThemedTextProps> = ({
  fontFamily = FontFamilies.SFProRegular,
  variant = 'body',
  style,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.defaultText,
        { fontFamily, fontSize: TYPOGRAPHY[variant] },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  defaultText: {
    // Default styles can be added here if needed
  },
});

export default ThemedText;

