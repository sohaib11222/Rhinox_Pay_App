/**
 * Health Queries
 * GET requests for health check endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * API root endpoint
 */
export const getApiRoot = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.HEALTH.ROOT);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for API root
 */
export const useGetApiRoot = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['health', 'root'],
    queryFn: getApiRoot,
    ...options,
  });
};

/**
 * Health check endpoint
 */
export const getHealthCheck = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.HEALTH.CHECK);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for health check
 */
export const useGetHealthCheck = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['health', 'check'],
    queryFn: getHealthCheck,
    ...options,
  });
};

