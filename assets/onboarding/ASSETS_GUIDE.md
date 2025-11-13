# Onboarding Assets Guide

This folder contains all the assets needed for the onboarding screens.

## Required Assets from Figma

To complete the onboarding screens, please export the following assets from your Figma design:

### Main Illustrations (PNG)
1. **main-illustration-1.png** - The building/bank illustration for Screen 1 (Send and Receive Money)
2. **main-illustration-2.png** - The wallet/card illustration for Screen 2 (Crypto and Fiat Wallets)
3. **main-illustration-3.png** - The currency conversion illustration for Screen 3 (Convert Currencies)

### Welcome Screen Assets (PNG)
4. **welcome-coin-1.png** - First coin illustration
5. **welcome-coin-2.png** - Second coin illustration
6. **welcome-coin-3.png** - Third coin illustration
7. **welcome-coin-4.png** - Fourth coin illustration
8. **background-texture.png** - Background texture/pattern

## How to Export from Figma

1. Open your Figma file
2. Select each image asset you want to export
3. In the right panel, scroll to "Export"
4. Choose PNG format
5. Set the scale to 2x or 3x for better quality on high-DPI screens
6. Click "Export [asset name]"
7. Save the files to this `assets/onboarding/` folder

## Using Assets in Code

Once exported, update the placeholder components in the screen files:

### OnboardingScreen1.tsx
Replace:
```tsx
<View style={styles.illustrationPlaceholder}>
  <Text style={styles.placeholderText}>🏦</Text>
</View>
```

With:
```tsx
<Image 
  source={require('../../assets/onboarding/main-illustration-1.png')}
  style={styles.illustration}
  resizeMode="contain"
/>
```

### OnboardingScreen2.tsx
Replace the emoji placeholder with:
```tsx
<Image 
  source={require('../../assets/onboarding/main-illustration-2.png')}
  style={styles.illustration}
  resizeMode="contain"
/>
```

### OnboardingScreen3.tsx
Replace the emoji placeholder with:
```tsx
<Image 
  source={require('../../assets/onboarding/main-illustration-3.png')}
  style={styles.illustration}
  resizeMode="contain"
/>
```

## Additional Styling

After adding the images, you may need to adjust the `illustration` style in each screen's StyleSheet:

```tsx
illustration: {
  width: 300,
  height: 400,
},
```

Adjust width and height based on your actual asset dimensions for the best visual result.

