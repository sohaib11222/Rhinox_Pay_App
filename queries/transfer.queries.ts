/**
 * Transfer Queries
 * GET requests for transfer-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Check if user is eligible to send funds (KYC verification)
 */
export const getTransferEligibility = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.TRANSFER.ELIGIBILITY);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting transfer eligibility
 */
export const useGetTransferEligibility = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transfer', 'eligibility'],
    queryFn: getTransferEligibility,
    ...options,
  });
};

/**
 * Get transfer receipt
 */
export const getTransferReceipt = async (transactionId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(API_ROUTES.TRANSFER.RECEIPT + '/{transactionId}', { transactionId });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting transfer receipt
 */
export const useGetTransferReceipt = (
  transactionId: string,
  options?: Omit<UseQueryOptions<ApiResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transfer', 'receipt', transactionId],
    queryFn: () => getTransferReceipt(transactionId),
    enabled: !!transactionId,
    ...options,
  });
};

/**
 * Validate recipient (Rhinox Pay user) by email
 */
export const validateRecipient = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.TRANSFER.VALIDATE_RECIPIENT, {
      params: { email },
    });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for validating recipient
 */
export const useValidateRecipient = (
  email: string,
  options?: Omit<UseQueryOptions<ApiResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transfer', 'validate-recipient', email],
    queryFn: () => validateRecipient(email),
    enabled: !!email && email.includes('@'), // Only enable if email is provided and looks valid
    ...options,
  });
};
