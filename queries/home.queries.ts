/**
 * Home Queries
 * GET requests for home/dashboard endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Get user home/dashboard data
 */
export const getHomeData = async (): Promise<ApiResponse> => {
  try {
    console.log('[getHomeData] Fetching home dashboard data...');
    const response = await apiClient.get(API_ROUTES.HOME.DASHBOARD);
    console.log('[getHomeData] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getHomeData] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting home data
 */
export const useGetHomeData = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['home', 'dashboard'],
    queryFn: getHomeData,
    ...options,
  });
};

/**
 * Get all wallet balances
 */
export const getWalletBalances = async (): Promise<ApiResponse> => {
  try {
    console.log('[getWalletBalances] Fetching wallet balances...');
    const response = await apiClient.get(API_ROUTES.HOME.WALLETS);
    console.log('[getWalletBalances] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getWalletBalances] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting wallet balances
 */
export const useGetWalletBalances = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['home', 'wallets'],
    queryFn: getWalletBalances,
    ...options,
  });
};

/**
 * Get home transactions (fiat and crypto)
 */
export interface GetHomeTransactionsParams {
  limit?: number;
  fiatLimit?: number;
  cryptoLimit?: number;
}

export const getHomeTransactions = async (params?: GetHomeTransactionsParams): Promise<ApiResponse> => {
  try {
    console.log('[getHomeTransactions] Fetching home transactions with params:', JSON.stringify(params, null, 2));
    const { buildApiUrl } = await import('../utils/apiConfig');
    const url = buildApiUrl(API_ROUTES.HOME.TRANSACTIONS, params as any);
    const response = await apiClient.get(url);
    console.log('[getHomeTransactions] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getHomeTransactions] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting home transactions
 */
export const useGetHomeTransactions = (
  params?: GetHomeTransactionsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['home', 'transactions', params],
    queryFn: () => getHomeTransactions(params),
    ...options,
  });
};

