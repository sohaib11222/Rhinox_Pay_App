# RhinoxPay Directory Structure Analysis

## 📁 Project Overview
**RhinoxPay** is a React Native mobile payment application built with Expo, TypeScript, and React Navigation. It provides comprehensive financial services including P2P transactions, crypto operations, bill payments, wallet management, and more.

---

## 🏗️ Architecture Overview

### **Technology Stack**
- **Framework**: React Native 0.81.5 with Expo ~54.0.20
- **Language**: TypeScript 5.9.2
- **State Management**: TanStack React Query v5.90.16
- **Navigation**: React Navigation v7 (Bottom Tabs + Native Stack)
- **HTTP Client**: Axios 1.13.2
- **UI Libraries**: Expo Blur, Expo Linear Gradient, React Native SVG

---

## 📂 Directory Structure

```
RhinoxPay/
├── 📱 App Entry & Configuration
│   ├── App.tsx                    # Main app component with QueryClient setup
│   ├── index.ts                   # Entry point
│   ├── app.json                   # Expo configuration
│   ├── package.json               # Dependencies and scripts
│   ├── tsconfig.json              # TypeScript configuration
│   └── metro.config.js            # Metro bundler configuration
│
├── 🧭 Navigation Layer
│   ├── RootNavigator.tsx          # Root navigator (Onboarding → Auth → Main)
│   ├── OnboardingNavigator.tsx   # Onboarding flow (3 screens + Welcome)
│   ├── AuthNavigator.tsx          # Authentication flow
│   └── MainNavigator.tsx          # Main app navigation (5 tabs with nested stacks)
│
├── 🖼️ Screens
│   ├── OnboardingScreens/          # First-time user experience
│   │   ├── OnboardingScreen1.tsx
│   │   ├── OnboardingScreen2.tsx
│   │   ├── OnboardingScreen3.tsx
│   │   └── WelcomeScreen.tsx
│   │
│   ├── AuthScreens/               # Authentication & verification
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── Verification.tsx
│   │   ├── SetBiometrics.tsx
│   │   ├── KYC.tsx
│   │   └── FacialRegister.tsx
│   │
│   └── MainScreens/               # Core application screens
│       ├── HomeScreen.tsx         # Dashboard
│       ├── NotificationsScreen.tsx
│       │
│       ├── TransactionsScreen.tsx # Transaction history
│       ├── SendTransactionsScreen.tsx
│       ├── FundTransactionsScreen.tsx
│       ├── WithdrawalsScreen.tsx
│       ├── BillPaymentsScreen.tsx
│       ├── P2PTransactionsScreen.tsx
│       ├── CryptoDepositScreen.tsx
│       ├── CryptoWithdrawalsScreen.tsx
│       │
│       ├── billpayment screens/   # Bill payment services
│       │   ├── BillPaymentMainScreen.tsx
│       │   ├── Airtime.tsx
│       │   ├── DataRecharge.tsx
│       │   ├── InternetSubscription.tsx
│       │   ├── Electricity.tsx
│       │   ├── CableTv.tsx
│       │   ├── Betting.tsx
│       │   └── BeneficiariesScreen.tsx
│       │
│       ├── WalletScreens/         # Wallet management
│       │   ├── Wallet.tsx
│       │   ├── CryptoAssetDetails.tsx
│       │   ├── Fund.tsx
│       │   └── Withdrawal.tsx
│       │
│       ├── P2PScreens/            # Peer-to-peer trading
│       │   ├── PaymentSettings.tsx
│       │   ├── BuyOrder.tsx
│       │   ├── SellOrder.tsx
│       │   ├── SellOrderFlow.tsx
│       │   ├── MyAdsScreen.tsx
│       │   ├── CreateBuyAd.tsx
│       │   ├── CreateSellAd.tsx
│       │   ├── AdDetails.tsx
│       │   └── SendFundsScreen.tsx
│       │
│       ├── SendFundScreens/       # Fund transfer methods
│       │   ├── SendFundsDirectScreen.tsx
│       │   ├── SendFundCrypto.tsx
│       │   ├── FundWalletScreen.tsx
│       │   ├── MobileFundScreen.tsx
│       │   ├── Conversion.tsx
│       │   ├── AssetsScreen.tsx
│       │   └── P2PFundScreen.tsx
│       │
│       └── SettingsScreens/       # User settings & support
│           ├── Settings.tsx
│           ├── EditProfile.tsx
│           ├── P2PProfile.tsx
│           ├── AccountSecurity.tsx
│           ├── Support.tsx
│           ├── ChatScreen.tsx
│           ├── Rewards.tsx
│           └── RewardsHistory.tsx
│
│   └── components/                # Shared screen components
│       ├── TransactionErrorModal.tsx
│       ├── TransactionReceiptModal.tsx
│       └── TransactionSuccessModal.tsx
│
├── 🔧 Components
│   ├── LoadingIndicator.tsx       # Loading state component
│   ├── ThemedText.tsx             # Themed text component
│   └── index.ts                   # Component exports
│
├── 🪝 Hooks
│   ├── usePullToRefresh.ts        # Pull-to-refresh functionality
│   └── index.ts                   # Hook exports
│
├── 🔌 Data Layer (API Integration)
│   ├── queries/                   # React Query hooks for data fetching
│   │   ├── auth.queries.ts
│   │   ├── bankAccounts.queries.ts
│   │   ├── conversion.queries.ts
│   │   ├── country.queries.ts
│   │   ├── crypto.queries.ts
│   │   ├── deposit.queries.ts
│   │   ├── exchange.queries.ts
│   │   ├── health.queries.ts
│   │   ├── home.queries.ts
│   │   ├── kyc.queries.ts
│   │   ├── p2p.queries.ts
│   │   ├── paymentSettings.queries.ts
│   │   ├── transfer.queries.ts
│   │   ├── wallet.queries.ts
│   │   └── index.ts
│   │
│   └── mutations/                 # React Query mutations for data updates
│       ├── auth.mutations.ts
│       ├── conversion.mutations.ts
│       ├── crypto.mutations.ts
│       ├── deposit.mutations.ts
│       ├── exchange.mutations.ts
│       ├── kyc.mutations.ts
│       ├── p2p.mutations.ts
│       ├── paymentSettings.mutations.ts
│       ├── transfer.mutations.ts
│       ├── wallet.mutations.ts
│       └── index.ts
│
├── 🛠️ Utils
│   ├── apiClient.ts               # Axios client configuration
│   ├── apiConfig.ts               # API routes and base URL configuration
│   ├── constants.ts               # Application constants
│   └── index.ts                   # Utility exports
│
├── 🎨 Assets
│   ├── fonts/                     # Custom fonts (SF Pro Display, Agbalumo)
│   ├── login/                     # Login screen assets
│   ├── onboarding/                # Onboarding screen assets
│   ├── tab-icons/                 # Tab bar icons
│   └── [various PNG files]        # Icons, images, backgrounds
│
└── 📄 Documentation
    ├── README.md
    ├── README_ONBOARDING.md
    ├── ONBOARDING_SETUP_COMPLETE.md
    ├── ASSETS_INTEGRATION_COMPLETE.md
    └── Rhinox_Pay_API.postman_collection.json
```

---

## 🎯 Navigation Architecture

### **Root Navigation Flow**
```
RootNavigator
├── Onboarding (Initial Route)
│   └── OnboardingNavigator
│       ├── Onboarding1 → Onboarding2 → Onboarding3
│       └── Welcome → Auth screens
│
├── Auth
│   └── AuthNavigator
│       ├── Login
│       ├── Register
│       ├── Verification
│       ├── SetBiometrics
│       ├── KYC
│       └── FacialRegister
│
└── Main
    └── MainNavigator (Bottom Tab Navigator)
        ├── Home Tab (HomeStackNavigator)
        │   ├── HomeMain
        │   └── Notifications
        │
        ├── Transactions Tab (TransactionsStackNavigator)
        │   ├── TransactionsList
        │   ├── SendTransactions
        │   ├── FundTransactions
        │   ├── Withdrawals
        │   ├── BillPayments
        │   ├── P2PTransactions
        │   ├── CryptoDeposit
        │   ├── CryptoWithdrawals
        │   └── Bill Payment Sub-screens (Airtime, Data, etc.)
        │
        ├── Call Tab (BillPaymentMainScreen)
        │   └── Direct component (no stack)
        │
        ├── Wallet Tab (WalletStackNavigator)
        │   ├── WalletMain
        │   ├── CryptoAssetDetails
        │   ├── Withdrawal
        │   └── Fund
        │
        └── Settings Tab (SettingsStackNavigator)
            ├── SettingsMain
            ├── EditProfile
            ├── P2PProfile
            ├── PaymentSettings
            ├── P2P Screens (BuyOrder, SellOrder, etc.)
            ├── SendFund Screens
            ├── AccountSecurity
            ├── Support
            ├── ChatScreen
            ├── Rewards
            └── RewardsHistory
```

### **Tab Bar Features**
- **Custom Tab Bar**: Blur effect with rounded design
- **Active Tab Indicator**: Bright green (#A9EF45) circle background
- **Tab Bar Hiding**: Automatically hides on specific screens (BuyOrder, SellOrder, ChatScreen, etc.)
- **Smart Navigation**: Tab press resets to initial screen in each stack

---

## 🔌 API Integration Architecture

### **API Configuration**
- **Base URL**: Platform-specific (Android: `http://192.168.1.24:3000/api`, iOS: `http://localhost:3000/api`)
- **Client**: Axios-based with React Query integration
- **Route Organization**: Modular route definitions in `apiConfig.ts`

### **API Modules**
1. **Auth** - Authentication, registration, verification, password reset
2. **Bank Accounts** - Bank account management
3. **Conversion** - Currency/crypto conversion
4. **Crypto** - Crypto token operations, deposit addresses, virtual accounts
5. **Deposit** - Deposit initiation and confirmation
6. **Exchange** - Exchange rates and conversions
7. **Home** - Dashboard and wallet data
8. **KYC** - Know Your Customer verification
9. **P2P** - Peer-to-peer trading (ads, orders, chat, reviews)
10. **Payment Settings** - Payment method management
11. **Transfer** - Fund transfers
12. **Wallet** - Wallet operations and transactions

---

## 🎨 UI/UX Features

### **Design System**
- **Custom Fonts**: SF Pro Display family + Agbalumo
- **Blur Effects**: Expo Blur for tab bar
- **Gradients**: Expo Linear Gradient
- **Icons**: Custom tab icons with tinting support

### **Screen Organization**
- **Modular Structure**: Screens grouped by feature/domain
- **Nested Navigation**: Stack navigators within tabs for better organization
- **Modal Components**: Transaction modals (Success, Error, Receipt)

---

## 📊 Key Features

### **Financial Services**
1. **Wallet Management**
   - Multi-currency wallets
   - Crypto asset details
   - Fund and withdrawal operations

2. **Transactions**
   - Send/Receive transactions
   - Transaction history
   - Crypto deposits/withdrawals
   - P2P transactions

3. **Bill Payments**
   - Airtime recharge
   - Data recharge
   - Internet subscription
   - Electricity bills
   - Cable TV
   - Betting services
   - Beneficiaries management

4. **P2P Trading**
   - Browse buy/sell ads
   - Create buy/sell ads
   - Order management
   - Payment settings
   - In-app chat
   - Reviews system

5. **Fund Transfer**
   - Direct transfers
   - Crypto transfers
   - Mobile money
   - P2P funding
   - Currency conversion

6. **User Features**
   - Profile management
   - Account security
   - KYC verification
   - Biometric authentication
   - Facial recognition
   - Rewards system
   - Support chat

---

## 🔍 Code Organization Patterns

### **Strengths**
✅ **Clear Separation of Concerns**: Screens, components, queries, mutations separated
✅ **Modular API Layer**: Organized by feature domain
✅ **Type Safety**: TypeScript throughout
✅ **Reusable Components**: Shared components and hooks
✅ **Consistent Navigation**: Well-structured navigation hierarchy
✅ **State Management**: React Query for server state

### **Areas for Potential Improvement**
⚠️ **Screen Organization**: Some screens could be better grouped (e.g., SendFund screens in Settings stack)
⚠️ **Constants**: Limited constants file - could expand for theme, colors, etc.
⚠️ **Error Handling**: Could benefit from centralized error handling utilities
⚠️ **Type Definitions**: Could add shared TypeScript types/interfaces directory

---

## 📝 Notes

- **Platform Support**: iOS and Android
- **Development**: Expo development build
- **API**: Backend API at `localhost:3000/api` (configurable)
- **Authentication**: Token-based with refresh token support
- **Biometrics**: Local authentication support
- **Camera**: Expo Camera for facial recognition/KYC

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

---

*Last Updated: Based on current directory structure analysis*

