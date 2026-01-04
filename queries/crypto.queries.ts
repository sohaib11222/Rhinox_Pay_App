/**
 * Crypto Queries
 * GET requests for cryptocurrency-related endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Get all tokens for a given symbol across different blockchains
 */
export const getTokensBySymbol = async (symbol: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/crypto/tokens/{symbol}`, { symbol });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting tokens by symbol
 */
export const useGetTokensBySymbol = (
  symbol: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['crypto', 'tokens', symbol],
    queryFn: () => getTokensBySymbol(symbol),
    enabled: !!symbol,
    ...options,
  });
};

/**
 * Get all USDT tokens across different blockchains
 */
export const getUSDTTokens = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.CRYPTO.USDT_TOKENS);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting USDT tokens
 */
export const useGetUSDTTokens = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['crypto', 'usdt-tokens'],
    queryFn: getUSDTTokens,
    ...options,
  });
};

/**
 * Get deposit address for a currency and blockchain
 */
export const getDepositAddress = async (
  currency: string,
  blockchain: string
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/crypto/deposit-address/{currency}/{blockchain}`, {
      currency,
      blockchain,
    });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting deposit address
 */
export const useGetDepositAddress = (
  currency: string,
  blockchain: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['crypto', 'deposit-address', currency, blockchain],
    queryFn: () => getDepositAddress(currency, blockchain),
    enabled: !!currency && !!blockchain,
    ...options,
  });
};

/**
 * Get user's virtual accounts
 */
export const getVirtualAccounts = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.CRYPTO.VIRTUAL_ACCOUNTS);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting virtual accounts
 */
export const useGetVirtualAccounts = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['crypto', 'virtual-accounts'],
    queryFn: getVirtualAccounts,
    ...options,
  });
};

