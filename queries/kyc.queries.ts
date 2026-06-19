/**
 * KYC Queries
 * GET requests for KYC-related endpoints
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';
import { invalidateKycAndUserQueries } from '../utils/kycQuerySync';

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
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    ...options,
  });
};

/** Refetch KYC + profile whenever the hosting screen gains focus. */
export const useRefreshKYCOnFocus = () => {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      invalidateKycAndUserQueries(queryClient);
    }, [queryClient])
  );
};

