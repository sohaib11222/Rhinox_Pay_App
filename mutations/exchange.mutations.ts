/**
 * Exchange Mutations
 * POST/PUT/DELETE requests for exchange rate endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Set or update exchange rate (Admin)
 */
export interface SetExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
}

export const setExchangeRate = async (data: SetExchangeRateRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.EXCHANGE.SET_RATE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for setting exchange rate
 */
export const useSetExchangeRate = (
  options?: UseMutationOptions<ApiResponse, Error, SetExchangeRateRequest>
) => {
  return useMutation<ApiResponse, Error, SetExchangeRateRequest>({
    mutationFn: setExchangeRate,
    ...options,
  });
};

