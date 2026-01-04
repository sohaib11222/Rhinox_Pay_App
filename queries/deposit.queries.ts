/**
 * Deposit Queries
 * GET requests for deposit-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Get bank account details for deposit
 */
export interface GetBankDetailsParams {
  countryCode?: string;
  currency?: string;
}

export const getBankDetails = async (params?: GetBankDetailsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.DEPOSIT.BANK_DETAILS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bank details
 */
export const useGetBankDetails = (
  params?: GetBankDetailsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['deposit', 'bank-details', params],
    queryFn: () => getBankDetails(params),
    ...options,
  });
};

/**
 * Get mobile money providers for a country
 */
export interface GetMobileMoneyProvidersParams {
  countryCode?: string;
  currency?: string;
}

export const getMobileMoneyProviders = async (
  params?: GetMobileMoneyProvidersParams
): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.DEPOSIT.MOBILE_MONEY_PROVIDERS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting mobile money providers
 */
export const useGetMobileMoneyProviders = (
  params?: GetMobileMoneyProvidersParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['deposit', 'mobile-money-providers', params],
    queryFn: () => getMobileMoneyProviders(params),
    ...options,
  });
};

/**
 * Get transaction receipt
 */
export const getDepositReceipt = async (transactionId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/deposit/receipt/{transactionId}`, { transactionId });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting deposit receipt
 */
export const useGetDepositReceipt = (
  transactionId: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['deposit', 'receipt', transactionId],
    queryFn: () => getDepositReceipt(transactionId),
    enabled: !!transactionId,
    ...options,
  });
};

