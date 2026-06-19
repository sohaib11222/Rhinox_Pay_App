/**
 * API Client using Axios
 * Handles all HTTP requests with interceptors for authentication and error handling
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { API_BASE_URL, API_ROUTES } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const BIOMETRIC_LOCKED_KEY = 'biometricLocked';
const VERIFY_WITH_PIN_KEY = 'verifyWithPin';
const VERIFY_WITH_EMAIL_KEY = 'verifyWithEmail';
const VERIFY_WITH_2FA_KEY = 'verifyWith2FA';

/**
 * Get stored access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Set access token
 */
export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting access token:', error);
  }
};

/**
 * Set refresh token
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

/**
 * Clear tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    
    // Verify tokens are cleared
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (accessToken || refreshToken) {
      console.error('[clearTokens] ERROR: Tokens still exist after clearing!');
      console.error('[clearTokens] Access token exists:', !!accessToken);
      console.error('[clearTokens] Refresh token exists:', !!refreshToken);
      // Force remove again
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  } catch (error) {
    console.error('[clearTokens] Error clearing tokens:', error);
    // Try individual removal as fallback
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (fallbackError) {
      console.error('[clearTokens] Fallback clear also failed:', fallbackError);
    }
  }
};

/**
 * Whether the app is waiting for biometric unlock (logged out but token kept).
 */
export const getBiometricLocked = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_LOCKED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting biometric lock state:', error);
    return false;
  }
};

export const setBiometricLocked = async (locked: boolean): Promise<void> => {
  try {
    if (locked) {
      await AsyncStorage.setItem(BIOMETRIC_LOCKED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_LOCKED_KEY);
    }
  } catch (error) {
    console.error('Error setting biometric lock state:', error);
  }
};

export const hasStoredAuthSession = async (): Promise<boolean> => {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);
  return !!(accessToken || refreshToken);
};

/**
 * Clear session on logout. Keeps stored token when biometric login is enabled.
 */
export const clearTokensForLogout = async (): Promise<void> => {
  try {
    const biometricEnabled = await getBiometricEnabled();
    if (biometricEnabled) {
      await setBiometricLocked(true);
      return;
    }
    await setBiometricLocked(false);
    await clearTokens();
  } catch (error) {
    console.error('[clearTokensForLogout] Error:', error);
    await setBiometricLocked(false);
    await clearTokens();
  }
};

/**
 * Refresh access token using stored refresh token.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
    if (!accessToken) {
      return null;
    }

    await setAccessToken(accessToken);
    if (newRefreshToken) {
      await setRefreshToken(newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    console.error('[refreshAccessToken] Failed:', error);
    return null;
  }
};

/**
 * Get biometric login preference
 */
export const getBiometricEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting biometric preference:', error);
    return false;
  }
};

/**
 * Set biometric login preference
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
    if (!enabled) {
      await setBiometricLocked(false);
    }
  } catch (error) {
    console.error('Error setting biometric preference:', error);
  }
};

/**
 * Get security confirmation settings
 */
export interface SecurityConfirmationSettings {
  verifyWithPin: boolean;
  verifyWithEmail: boolean;
  verifyWith2FA: boolean;
}

/**
 * Get all security confirmation settings
 */
export const getSecurityConfirmationSettings = async (): Promise<SecurityConfirmationSettings> => {
  try {
    const [pin, email, twoFA] = await Promise.all([
      AsyncStorage.getItem(VERIFY_WITH_PIN_KEY),
      AsyncStorage.getItem(VERIFY_WITH_EMAIL_KEY),
      AsyncStorage.getItem(VERIFY_WITH_2FA_KEY),
    ]);
    
    return {
      verifyWithPin: pin === 'true',
      verifyWithEmail: email === 'true',
      verifyWith2FA: twoFA === 'true',
    };
  } catch (error) {
    console.error('Error getting security confirmation settings:', error);
    return {
      verifyWithPin: false,
      verifyWithEmail: false,
      verifyWith2FA: false,
    };
  }
};

/**
 * Set verify with PIN preference
 */
export const setVerifyWithPin = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(VERIFY_WITH_PIN_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting verify with PIN preference:', error);
  }
};

/**
 * Set verify with Email preference
 */
export const setVerifyWithEmail = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(VERIFY_WITH_EMAIL_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting verify with Email preference:', error);
  }
};

/**
 * Set verify with 2FA preference
 */
export const setVerifyWith2FA = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(VERIFY_WITH_2FA_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting verify with 2FA preference:', error);
  }
};

/**
 * Create axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token && config.headers) {
        // Ensure token is trimmed and properly formatted
        const trimmedToken = token.trim();
        config.headers.Authorization = `Bearer ${trimmedToken}`;
      }

      if (config.data instanceof FormData && config.headers) {
        // Axios must not set Content-Type for multipart — RN sets boundary automatically.
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
          config.headers.delete('content-type');
        } else {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
        config.transformRequest = [(data) => data];
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

          if (accessToken) {
            await setAccessToken(accessToken);
            if (newRefreshToken) {
              await setRefreshToken(newRefreshToken);
            }

            // Retry the original request with the new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens
        await clearTokens();
        // TODO: Navigate to login screen using navigation
        // You can use navigation here: navigationRef.current?.navigate('Login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * API Error type
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: Record<string, unknown>;
  errors?: Record<string, string[]>;
}

const sanitizeUserFacingError = (message?: string): string => {
  if (!message) return 'An error occurred';
  return message
    .replace(/PalmPay virtual(?: account)?/gi, 'bank transfer')
    .replace(/PalmPay/gi, 'payment provider')
    .replace(/palmpay/gi, 'payment provider')
    .replace(/virtual account/gi, 'account')
    .trim();
};

/**
 * Custom error handler
 */
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as any;
    return {
      message: sanitizeUserFacingError(data?.message || data?.error || 'An error occurred'),
      status: error.response.status,
      code: data?.code,
      data: data?.data,
      errors: data?.errors,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Network error. Please check your connection.',
    };
  } else {
    // Something else happened
    return {
      message: sanitizeUserFacingError(error.message || 'An unexpected error occurred'),
    };
  }
};

export default apiClient;

const cacheSecuritySettings = async (settings: SecurityConfirmationSettings): Promise<void> => {
  await AsyncStorage.multiSet([
    [VERIFY_WITH_PIN_KEY, String(settings.verifyWithPin)],
    [VERIFY_WITH_EMAIL_KEY, String(settings.verifyWithEmail)],
    [VERIFY_WITH_2FA_KEY, String(settings.verifyWith2FA)],
  ]);
};

export const syncSecurityConfirmationSettings = async (): Promise<SecurityConfirmationSettings> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return getSecurityConfirmationSettings();
    }

    const response = await apiClient.get(API_ROUTES.AUTH.SECURITY_SETTINGS);
    const settings = response.data.data as SecurityConfirmationSettings;
    await cacheSecuritySettings(settings);
    return settings;
  } catch (error) {
    console.error('[syncSecurityConfirmationSettings] Error:', error);
    return getSecurityConfirmationSettings();
  }
};

export const persistSecurityConfirmationSettings = async (
  partial: Partial<SecurityConfirmationSettings>
): Promise<SecurityConfirmationSettings> => {
  const current = await getSecurityConfirmationSettings();
  const next: SecurityConfirmationSettings = {
    verifyWithPin: partial.verifyWithPin ?? current.verifyWithPin,
    verifyWithEmail: partial.verifyWithEmail ?? current.verifyWithEmail,
    verifyWith2FA: partial.verifyWith2FA ?? current.verifyWith2FA,
  };

  const response = await apiClient.patch(API_ROUTES.AUTH.SECURITY_SETTINGS, next);
  const settings = response.data.data as SecurityConfirmationSettings;
  await cacheSecuritySettings(settings);
  return settings;
};

