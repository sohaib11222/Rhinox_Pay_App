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

export type UnifiedNetworkBalance = {
  virtualAccountId: number;
  currency: string;
  blockchain: string;
  blockchainName: string | null;
  balance: string;
  available: string;
  depositAddress: string | null;
};

export type UnifiedBalance = {
  symbol: string;
  totalBalance: string;
  totalAvailable: string;
  isUnifiedStable: boolean;
  networks: UnifiedNetworkBalance[];
};

/**
 * Aggregated crypto balances (single USDT / USDC across networks)
 */
export const getUnifiedBalances = async (): Promise<ApiResponse<UnifiedBalance[]>> => {
  try {
    const response = await apiClient.get(API_ROUTES.CRYPTO.UNIFIED_BALANCES);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

export const useGetUnifiedBalances = (options?: UseQueryOptions<ApiResponse<UnifiedBalance[]>, Error>) => {
  return useQuery<ApiResponse<UnifiedBalance[]>, Error>({
    queryKey: ['crypto', 'unified-balances'],
    queryFn: getUnifiedBalances,
    ...options,
  });
};

export const getUnifiedBalanceBySymbol = async (symbol: string): Promise<ApiResponse<UnifiedBalance>> => {
  try {
    const route = buildRouteWithParams('/crypto/unified-balances/{symbol}', { symbol });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

export const useGetUnifiedBalanceBySymbol = (
  symbol: string,
  options?: UseQueryOptions<ApiResponse<UnifiedBalance>, Error>
) => {
  return useQuery<ApiResponse<UnifiedBalance>, Error>({
    queryKey: ['crypto', 'unified-balances', symbol],
    queryFn: () => getUnifiedBalanceBySymbol(symbol),
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
    console.error('[getVirtualAccounts] Error:', error);
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

