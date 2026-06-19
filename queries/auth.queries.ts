/**
 * Auth Queries
 * GET requests for authentication-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.AUTH.ME);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting current user
 */
export const useGetCurrentUser = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    ...options,
  });
};

export interface UserSession {
  id: number;
  name: string;
  app: string;
  location: string;
  isCurrentDevice: boolean;
  lastUsed: string;
}

export const getUserSessions = async (): Promise<ApiResponse<{ sessions: UserSession[] }>> => {
  try {
    const response = await apiClient.get(API_ROUTES.AUTH.SESSIONS);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

export const useGetUserSessions = (
  options?: UseQueryOptions<ApiResponse<{ sessions: UserSession[] }>, Error>
) => {
  return useQuery<ApiResponse<{ sessions: UserSession[] }>, Error>({
    queryKey: ['auth', 'sessions'],
    queryFn: getUserSessions,
    ...options,
  });
};

export const getSecuritySettings = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.AUTH.SECURITY_SETTINGS);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

