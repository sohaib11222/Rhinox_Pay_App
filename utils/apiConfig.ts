/**
 * API Configuration and Route Definitions
Based on Rhinox Pay API Postman Collection
Base URL: http://localhost:3000/api
 */

import { Platform } from 'react-native';

// Get the API base URL based on platform
// For Android emulator: use 10.0.2.2 (special IP that maps to host machine's localhost)
// For Android physical device: use your computer's IP address (e.g., 192.168.1.100)
// For iOS simulator: localhost works fine
// For iOS physical device: use your computer's IP address
const getApiBaseUrl = (): string => {
  // You can also use environment variables or a config file
  // For now, we'll use platform detection
  
  if (Platform.OS === 'android') {
    // For Android emulator, use 10.0.2.2
    // For physical device, replace with your computer's IP address
    // Example: return 'http://192.168.1.100:3000/api';
    return 'https://rhinoxpay.hmstech.xyz/api';
  }
  
  // For iOS simulator, localhost works
  // For iOS physical device, you may need to use your computer's IP
  return 'https://rhinoxpay.hmstech.xyz/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * API Routes organized by module
 */
export const API_ROUTES = {
  // Auth Routes
  AUTH: {
    ME: '/auth/me',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REFRESH_TOKEN: '/auth/refresh',
    SETUP_PIN: '/auth/setup-pin',
    SET_PIN: '/auth/set-pin',
    VERIFY_PASSWORD_FOR_PIN: '/auth/verify-password-for-pin',
    MARK_FACE_VERIFIED: '/auth/mark-face-verified',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_PASSWORD_RESET_OTP: '/auth/verify-password-reset-otp',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Bank Accounts Routes
  BANK_ACCOUNTS: {
    GET_ALL: '/bank-accounts',
  },

  // Bill Payment Routes
  BILL_PAYMENT: {
    CATEGORIES: '/bill-payment/categories',
    PROVIDERS: '/bill-payment/providers',
    PLANS: '/bill-payment/plans',
    VALIDATE_METER: '/bill-payment/validate-meter',
    VALIDATE_ACCOUNT: '/bill-payment/validate-account',
    INITIATE: '/bill-payment/initiate',
    CONFIRM: '/bill-payment/confirm',
    BENEFICIARIES: '/bill-payment/beneficiaries',
  },

  // Conversion Routes
  CONVERSION: {
    CALCULATE: '/conversion/calculate',
    INITIATE: '/conversion/initiate',
    CONFIRM: '/conversion/confirm',
    RECEIPT: '/conversion/receipt',
  },

  // Country Routes
  COUNTRY: {
    GET_ALL: '/countries',
    GET_BY_CODE: '/countries',
  },

  // Crypto Routes
  CRYPTO: {
    TOKENS_BY_SYMBOL: '/crypto/tokens',
    USDT_TOKENS: '/crypto/usdt-tokens',
    DEPOSIT_ADDRESS: '/crypto/deposit-address',
    VIRTUAL_ACCOUNTS: '/crypto/virtual-accounts',
    TATUM_WEBHOOK: '/crypto/webhooks/tatum',
  },

  // Deposit Routes
  DEPOSIT: {
    INITIATE: '/deposit/initiate',
    CONFIRM: '/deposit/confirm',
    BANK_DETAILS: '/deposit/bank-details',
    MOBILE_MONEY_PROVIDERS: '/deposit/mobile-money-providers',
    RECEIPT: '/deposit/receipt',
  },

  // Exchange Routes
  EXCHANGE: {
    CONVERT: '/exchange/convert',
    RATES: '/exchange/rates',
    RATES_BY_BASE: '/exchange/rates',
    RATE: '/exchange/rate',
    SET_RATE: '/exchange/set-rate',
  },

  // Health Routes
  HEALTH: {
    ROOT: '/',
    CHECK: '/health',
  },

  // Home Routes
  HOME: {
    DASHBOARD: '/home',
    WALLETS: '/home/wallets',
    TRANSACTIONS: '/home/transactions',
  },

  // KYC Routes
  KYC: {
    STATUS: '/kyc/status',
    SUBMIT: '/kyc/submit',
    UPLOAD_ID: '/kyc/upload-id',
    FACE_VERIFICATION: '/kyc/face-verification',
    ADMIN_APPROVE: '/kyc/admin/approve',
    ADMIN_REJECT: '/kyc/admin/reject',
  },

  // P2P Public Routes
  P2P_PUBLIC: {
    BROWSE_ADS: '/p2p/ads/browse',
    GET_AD_DETAILS: '/p2p/ads',
  },

  // P2P User Routes
  P2P_USER: {
    BROWSE_BUY_ADS: '/p2p/user/ads/buy',
    BROWSE_SELL_ADS: '/p2p/user/ads/sell',
    CREATE_ORDER: '/p2p/orders',
    GET_ORDERS: '/p2p/orders',
    GET_ORDER_DETAILS: '/p2p/orders',
    CANCEL_ORDER: '/p2p/user/orders',
    PAYMENT_RECEIVED: '/p2p/user/orders',
    PAYMENT_MADE: '/p2p/orders',
  },

  // P2P Vendor Routes - Ad Creation
  P2P_VENDOR_ADS: {
    CREATE_BUY_AD: '/p2p/ads/buy',
    CREATE_SELL_AD: '/p2p/ads/sell',
  },

  // P2P Vendor Routes - Ad Management
  P2P_VENDOR_AD_MGMT: {
    GET_MY_ADS: '/p2p/ads',
    GET_AD_DETAILS: '/p2p/ads',
    UPDATE_AD: '/p2p/ads',
    UPDATE_AD_STATUS: '/p2p/ads',
  },

  // P2P Vendor Routes - Order Management
  P2P_VENDOR_ORDERS: {
    GET_VENDOR_ORDERS: '/p2p/vendor/orders',
    ACCEPT_ORDER: '/p2p/orders',
    DECLINE_ORDER: '/p2p/orders',
    CANCEL_ORDER: '/p2p/vendor/orders',
    PAYMENT_MADE: '/p2p/vendor/orders',
    PAYMENT_RECEIVED: '/p2p/orders',
  },

  // P2P Chat Routes
  P2P_CHAT: {
    GET_MESSAGES: '/p2p/orders',
    SEND_MESSAGE: '/p2p/orders',
    MARK_AS_READ: '/p2p/orders',
    UNREAD_COUNT: '/p2p/chat/unread-count',
  },

  // P2P Review Routes
  P2P_REVIEW: {
    CREATE_REVIEW: '/p2p/orders',
    UPDATE_REVIEW: '/p2p/reviews',
    DELETE_REVIEW: '/p2p/reviews',
    GET_VENDOR_REVIEWS: '/p2p/vendors',
    GET_AD_REVIEWS: '/p2p/ads',
  },

  // Payment Settings Routes
  PAYMENT_SETTINGS: {
    GET_ALL: '/payment-settings',
    GET_BY_ID: '/payment-settings',
    ADD_BANK_ACCOUNT: '/payment-settings/bank-account',
    ADD_MOBILE_MONEY: '/payment-settings/mobile-money',
    ADD_RHINOXPAY_ID: '/payment-settings/rhinoxpay-id',
    UPDATE: '/payment-settings',
    DELETE: '/payment-settings',
    SET_DEFAULT: '/payment-settings',
    MOBILE_MONEY_PROVIDERS: '/payment-settings/mobile-money-providers',
    BANKS: '/payment-settings/banks',
  },

  // Transfer Routes
  TRANSFER: {
    ELIGIBILITY: '/transfer/eligibility',
    INITIATE: '/transfer/initiate',
    VERIFY: '/transfer/verify',
    RECEIPT: '/transfer/receipt',
    VALIDATE_RECIPIENT: '/transfer/validate-recipient',
  },

  // Wallet Routes
  WALLET: {
    GET_ALL: '/wallets',
    GET_BY_CURRENCY: '/wallets',
    GET_BALANCE: '/wallets',
    GET_BALANCES: '/wallets/balances',
    GET_TRANSACTIONS: '/wallets',
    CREATE: '/wallets/create',
  },

  // Transaction History Routes
  TRANSACTION_HISTORY: {
    GET_ALL: '/transaction-history',
    GET_DEPOSITS: '/transaction-history/deposits',
    GET_WITHDRAWALS: '/transaction-history/withdrawals',
    GET_P2P: '/transaction-history/p2p',
    GET_BILL_PAYMENTS: '/transaction-history/bill-payments',
    GET_DETAILS: '/transaction-history',
  },

  // Support Routes
  SUPPORT: {
    CREATE_CHAT: '/support/chats',
    GET_CHATS: '/support/chats',
    GET_CHAT_DETAILS: '/support/chats',
    SEND_MESSAGE: '/support/chats',
    MARK_MESSAGES_READ: '/support/chats',
    GET_UNREAD_COUNT: '/support/chats/unread-count',
  },

  // Notification Routes
  NOTIFICATION: {
    GET_ALL: '/notifications',
    GET_UNREAD_COUNT: '/notifications/unread-count',
    MARK_AS_READ: '/notifications',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications',
  },
} as const;

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (route: string, params?: Record<string, string | number | undefined>): string => {
  // Ensure route starts with / if it doesn't already
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  
  // Remove trailing /api from API_BASE_URL if route already includes it, or handle correctly
  let baseUrl = API_BASE_URL;
  if (baseUrl.endsWith('/api') && cleanRoute.startsWith('/api')) {
    baseUrl = baseUrl.replace(/\/api$/, '');
  }
  
  let url = `${baseUrl}${cleanRoute}`;
  
  if (params) {
    // Filter out undefined, null, and empty string values
    const validParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '');
    
    if (validParams.length > 0) {
      const queryString = validParams
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += `?${queryString}`;
    }
  }
  
  return url;
};

/**
 * Helper function to build route with path parameters
 */
export const buildRouteWithParams = (
  baseRoute: string,
  params: Record<string, string | number>
): string => {
  let route = baseRoute;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`{${key}}`, String(value));
  });
  return route;
};

