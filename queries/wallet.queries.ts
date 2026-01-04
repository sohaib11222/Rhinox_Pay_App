/**
 * Wallet Queries
 * GET requests for wallet-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Get all user wallets
 */
export const getWallets = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.WALLET.GET_ALL);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting wallets
 */
export const useGetWallets = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['wallets'],
    queryFn: getWallets,
    ...options,
  });
};

/**
 * Get wallet by currency code
 */
export const getWalletByCurrency = async (currency: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/wallets/{currency}`, { currency });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting wallet by currency
 */
export const useGetWalletByCurrency = (
  currency: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['wallets', currency],
    queryFn: () => getWalletByCurrency(currency),
    enabled: !!currency,
    ...options,
  });
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (walletId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/wallets/{walletId}/balance`, { walletId });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting wallet balance
 */
export const useGetWalletBalance = (
  walletId: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['wallets', walletId, 'balance'],
    queryFn: () => getWalletBalance(walletId),
    enabled: !!walletId,
    ...options,
  });
};

/**
 * Get wallet transactions
 */
export interface GetWalletTransactionsParams {
  walletId: string;
  limit?: number;
  offset?: number;
}

export const getWalletTransactions = async (
  params: GetWalletTransactionsParams
): Promise<ApiResponse> => {
  try {
    const { walletId, ...queryParams } = params;
    const route = buildRouteWithParams(`/wallets/{walletId}/transactions`, { walletId });
    const url = buildApiUrl(route, queryParams as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting wallet transactions
 */
export const useGetWalletTransactions = (
  params: GetWalletTransactionsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['wallets', params.walletId, 'transactions', params],
    queryFn: () => getWalletTransactions(params),
    enabled: !!params.walletId,
    ...options,
  });
};

/**
 * Get all wallet balances (fiat + crypto) with USDT conversion
 */
export const getWalletBalances = async (): Promise<ApiResponse> => {
  try {
    console.log('[getWalletBalances] Fetching all wallet balances...');
    const response = await apiClient.get(API_ROUTES.WALLET.GET_BALANCES);
    console.log('[getWalletBalances] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getWalletBalances] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting all wallet balances
 */
export const useGetWalletBalances = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['wallets', 'balances'],
    queryFn: getWalletBalances,
    ...options,
  });
};

