/**
 * Authentication Hook
 * Manages authentication state and token persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { getAccessToken, getRefreshToken, clearTokens } from '../utils/apiClient';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

/**
 * Hook to manage authentication state
 * Checks for existing tokens and validates them
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  /**
   * Check if user has valid token
   */
  const checkAuth = useCallback(async () => {
    try {
      console.log('[useAuth] Checking authentication state...');
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const token = await getAccessToken();
      const refreshToken = await getRefreshToken();

      console.log('[useAuth] Token check - Access token:', token ? 'exists' : 'missing');
      console.log('[useAuth] Token check - Refresh token:', refreshToken ? 'exists' : 'missing');

      if (!token && !refreshToken) {
        console.log('[useAuth] No tokens found, user is not authenticated');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
        return;
      }

      // If we have a refresh token but no access token, try to refresh
      if (!token && refreshToken) {
        console.log('[useAuth] Access token missing, attempting to refresh...');
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

          if (accessToken) {
            const { setAccessToken, setRefreshToken } = await import('../utils/apiClient');
            await setAccessToken(accessToken);
            if (newRefreshToken) {
              await setRefreshToken(newRefreshToken);
            }
            console.log('[useAuth] Token refreshed successfully');
            // Continue with validation
            await validateToken(accessToken);
            return;
          }
        } catch (refreshError) {
          console.error('[useAuth] Token refresh failed:', refreshError);
          await clearTokens();
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            token: null,
          });
          return;
        }
      }

      // Validate token by fetching user data
      if (token) {
        await validateToken(token);
      } else {
        // No token but we have refresh token - already handled above
        console.log('[useAuth] No access token to validate');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
      }
    } catch (error) {
      console.error('[useAuth] Error checking auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  }, []);

  /**
   * Validate token by fetching current user
   */
  const validateToken = useCallback(async (token: string) => {
    try {
      console.log('[useAuth] Validating token...');
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && response.status === 200) {
        console.log('[useAuth] Token is valid, user is authenticated');
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: token,
        });
      } else {
        console.log('[useAuth] Token validation failed');
        await clearTokens();
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
      }
    } catch (error: any) {
      console.error('[useAuth] Token validation error:', error);
      
      // If 401, token is invalid - try refresh if we have refresh token
      if (error?.status === 401 || error?.response?.status === 401) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data || refreshResponse.data;

            if (accessToken) {
              const { setAccessToken, setRefreshToken } = await import('../utils/apiClient');
              await setAccessToken(accessToken);
              if (newRefreshToken) {
                await setRefreshToken(newRefreshToken);
              }
              console.log('[useAuth] Token refreshed after validation failure');
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                token: accessToken,
              });
              return;
            }
          } catch (refreshError) {
            console.error('[useAuth] Token refresh failed after validation:', refreshError);
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

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    console.log('[useAuth] Logging out...');
    await clearTokens();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  }, []);

  /**
   * Set authenticated state (used after successful login)
   */
  const setAuthenticated = useCallback(async (token: string) => {
    const { setAccessToken } = await import('../utils/apiClient');
    await setAccessToken(token);
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      token: token,
    });
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    checkAuth,
    logout,
    setAuthenticated,
  };
};
