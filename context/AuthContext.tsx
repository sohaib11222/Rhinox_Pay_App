/**
 * Authentication context — shared auth state across the app
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import {
  clearTokens,
  clearTokensForLogout,
  getAccessToken,
  getBiometricEnabled,
  getBiometricLocked,
  getRefreshToken,
  setAccessToken,
  setBiometricLocked,
  setRefreshToken,
} from '../utils/apiClient';
import { API_BASE_URL } from '../utils/apiConfig';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  const validateToken = useCallback(async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.status === 200) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token,
        });
        return;
      }

      await clearTokens();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    } catch (error: any) {
      if (error?.status === 401 || error?.response?.status === 401) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } =
              refreshResponse.data.data || refreshResponse.data;

            if (accessToken) {
              await setAccessToken(accessToken);
              if (newRefreshToken) {
                await setRefreshToken(newRefreshToken);
              }
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                token: accessToken,
              });
              return;
            }
          } catch (refreshError) {
            console.error('[AuthContext] Token refresh failed after validation:', refreshError);
          }
        }
      }

      await clearTokens();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const token = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const biometricEnabled = await getBiometricEnabled();
      const biometricLocked = await getBiometricLocked();

      if (!token && !refreshToken) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
        return;
      }

      if (biometricEnabled && biometricLocked) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
        return;
      }

      if (!token && refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data || response.data;

          if (accessToken) {
            await setAccessToken(accessToken);
            if (newRefreshToken) {
              await setRefreshToken(newRefreshToken);
            }
            await validateToken(accessToken);
            return;
          }
        } catch (refreshError) {
          console.error('[AuthContext] Token refresh failed:', refreshError);
          await clearTokens();
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            token: null,
          });
          return;
        }
      }

      if (token) {
        await validateToken(token);
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  }, [validateToken]);

  const logout = useCallback(async () => {
    await clearTokensForLogout();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  }, []);

  const setAuthenticated = useCallback(async (token: string) => {
    await setAccessToken(token);
    await setBiometricLocked(false);
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      token,
    });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      ...authState,
      checkAuth,
      logout,
      setAuthenticated,
    }),
    [authState, checkAuth, logout, setAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
