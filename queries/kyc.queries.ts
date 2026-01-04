/**
 * KYC Queries
 * GET requests for KYC-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Get user KYC status and information
 */
export const getKYCStatus = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.KYC.STATUS);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting KYC status
 */
export const useGetKYCStatus = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['kyc', 'status'],
    queryFn: getKYCStatus,
    ...options,
  });
};

