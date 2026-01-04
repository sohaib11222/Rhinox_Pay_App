/**
 * Conversion Queries
 * GET requests for currency conversion endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Calculate conversion preview
 */
export interface CalculateConversionParams {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}

export const calculateConversion = async (
  params: CalculateConversionParams
): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.CONVERSION.CALCULATE, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for calculating conversion
 */
export const useCalculateConversion = (
  params: CalculateConversionParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['conversion', 'calculate', params],
    queryFn: () => calculateConversion(params),
    enabled: !!params.fromCurrency && !!params.toCurrency && !!params.amount,
    ...options,
  });
};

/**
 * Get conversion receipt
 */
export const getConversionReceipt = async (
  conversionReference: string
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(API_ROUTES.CONVERSION.RECEIPT + '/{conversionReference}', {
      conversionReference,
    });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting conversion receipt
 */
export const useGetConversionReceipt = (
  conversionReference: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['conversion', 'receipt', conversionReference],
    queryFn: () => getConversionReceipt(conversionReference),
    enabled: !!conversionReference,
    ...options,
  });
};

