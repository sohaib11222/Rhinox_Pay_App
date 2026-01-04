/**
 * Exchange Queries
 * GET requests for exchange rate endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Convert amount from one currency to another
 */
export interface ConvertCurrencyParams {
  amount: number;
  from: string;
  to: string;
}

export const convertCurrency = async (params: ConvertCurrencyParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.EXCHANGE.CONVERT, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for converting currency
 */
export const useConvertCurrency = (
  params: ConvertCurrencyParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['exchange', 'convert', params],
    queryFn: () => convertCurrency(params),
    enabled: !!params.amount && !!params.from && !!params.to,
    ...options,
  });
};

/**
 * Get all exchange rates
 */
export interface GetExchangeRatesParams {
  activeOnly?: boolean;
}

export const getExchangeRates = async (params?: GetExchangeRatesParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.EXCHANGE.RATES, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting exchange rates
 */
export const useGetExchangeRates = (
  params?: GetExchangeRatesParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['exchange', 'rates', params],
    queryFn: () => getExchangeRates(params),
    ...options,
  });
};

/**
 * Get all exchange rates from a base currency
 */
export const getExchangeRatesByBase = async (baseCurrency: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/exchange/rates/{baseCurrency}`, { baseCurrency });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting exchange rates by base currency
 */
export const useGetExchangeRatesByBase = (
  baseCurrency: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['exchange', 'rates', baseCurrency],
    queryFn: () => getExchangeRatesByBase(baseCurrency),
    enabled: !!baseCurrency,
    ...options,
  });
};

/**
 * Get exchange rate between two currencies
 */
export interface GetExchangeRateParams {
  from: string;
  to: string;
}

export const getExchangeRate = async (params: GetExchangeRateParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.EXCHANGE.RATE, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting exchange rate
 */
export const useGetExchangeRate = (
  params: GetExchangeRateParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['exchange', 'rate', params],
    queryFn: () => getExchangeRate(params),
    enabled: !!params.from && !!params.to,
    ...options,
  });
};

