# Onboarding Screens

This folder contains all onboarding screens for the RhinoxPay app, exactly matching the Figma design.

## Screens

### 1. OnboardingScreen1.tsx
**Title:** "Send and Receive Money Across Africa"

**Features:**
- Progress indicator (1/3)
- Skip button
- Main illustration with decorative elements (stars, dots)
- Interactive "Next" button
- Bottom navigation dots

**Navigation:** 
- Next → OnboardingScreen2
- Skip → WelcomeScreen

---

### 2. OnboardingScreen2.tsx
**Title:** "Get Dedicated Crypto and Fiat Wallets"

**Features:**
- Progress indicator (2/3)
- Skip button
- Wallet/crypto illustration with decorative elements
- Interactive "Next" button
- Bottom home navigation

**Navigation:**
- Next → OnboardingScreen3
- Skip → WelcomeScreen

---

### 3. OnboardingScreen3.tsx
**Title:** "Convert Easily Between Different African Currencies"

**Features:**
- Progress indicator (3/3)
- Skip button
- Currency conversion illustration
- Interactive "Proceed" button

**Navigation:**
- Proceed → WelcomeScreen
- Skip → WelcomeScreen

---

### 4. WelcomeScreen.tsx
**Title:** "Transact Across Borders with RhinoxPay"

**Features:**
- RhinoxPay logo
- Main tagline and subtitle
- Animated currency cards (Nigeria, Ghana, South Africa, Uganda flags)
- Coin illustrations (₦, $, €)
- Wallet/card visual
- "Welcome" message
- Two action buttons: Login and Register

**Navigation:**
- Login → LoginScreen (Auth flow)
- Register → RegisterScreen (to be implemented)

---

## Design Colors

### Primary Colors
- **Primary Green:** `#A9EF45`
- **Dark Blue Background:** `#020c19`
- **White:** `#FFFFFF`
- **Black:** `#000000`

### Accent Colors
- **Transparent Dark Overlay:** `rgba(0, 0, 0, 0.7)`
- **White with Opacity:** `rgba(255, 255, 255, 0.5)`
- **White Background (subtle):** `rgba(255, 255, 255, 0.03)`

---

## Interactive Features

✅ **Fully Interactive Navigation**
- Next buttons navigate to the next screen
- Skip buttons jump to Welcome screen
- Proceed button completes onboarding
- Login button navigates to auth flow

✅ **Exact Figma Design Match**
- All spacing and sizing matches Figma specs
- Color codes directly from Figma
- Typography weights and sizes preserved
- Border radius and decorative elements included

✅ **Decorative Elements**
- Stars (rotated squares)
- Dots (small circles)
- Background circles with blur effects
- Progress indicators
- Bottom gradient overlays

---

## Customization

### To update text:
Edit the `<Text>` components in each screen file.

### To change colors:
Update the color values in the `StyleSheet` at the bottom of each file.

### To adjust spacing:
Modify padding, margin, and gap values in the styles.

### To add actual images:
Follow the guide in `assets/onboarding/ASSETS_GUIDE.md`

---

## Navigation Setup

The onboarding flow is integrated into the app's navigation hierarchy:

```
RootNavigator
  └─ OnboardingNavigator (shown first time)
      ├─ OnboardingScreen1
      ├─ OnboardingScreen2
      ├─ OnboardingScreen3
      └─ WelcomeScreen
          └─ AuthNavigator (Login/Register)
              └─ MainNavigator (Home/App)
```

To persist onboarding state (so users don't see it again), implement AsyncStorage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if user has seen onboarding
const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

// After completing onboarding
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
```

---

## Testing

Run the app and you should see the onboarding flow:
1. Screen 1 → tap "Next"
2. Screen 2 → tap "Next"
3. Screen 3 → tap "Proceed"
4. Welcome Screen → tap "Login"

You can also tap "Skip" on any screen to jump directly to the Welcome screen.

---

## Future Enhancements

- [ ] Add actual images from Figma exports
- [ ] Add animations/transitions between screens
- [ ] Implement swipe gestures for navigation
- [ ] Add AsyncStorage for onboarding completion tracking
- [ ] Create RegisterScreen and link from Welcome
- [ ] Add loading states for images
- [ ] Implement blur effects for iOS

