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
    ...options,
  });
};

