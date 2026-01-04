/**
 * Conversion Mutations
 * POST/PUT/DELETE requests for currency conversion endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Initiate currency conversion
 */
export interface InitiateConversionRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}

export const initiateConversion = async (
  data: InitiateConversionRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.CONVERSION.INITIATE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for initiating conversion
 */
export const useInitiateConversion = (
  options?: UseMutationOptions<ApiResponse, Error, InitiateConversionRequest>
) => {
  return useMutation<ApiResponse, Error, InitiateConversionRequest>({
    mutationFn: initiateConversion,
    ...options,
  });
};

/**
 * Confirm conversion with PIN verification
 */
export interface ConfirmConversionRequest {
  conversionReference: string;
  pin: string;
}

export const confirmConversion = async (
  data: ConfirmConversionRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.CONVERSION.CONFIRM, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for confirming conversion
 */
export const useConfirmConversion = (
  options?: UseMutationOptions<ApiResponse, Error, ConfirmConversionRequest>
) => {
  return useMutation<ApiResponse, Error, ConfirmConversionRequest>({
    mutationFn: confirmConversion,
    ...options,
  });
};

