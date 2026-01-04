/**
 * Bank Accounts Queries
 * GET requests for bank account endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl } from '../utils/apiConfig';

/**
 * Get all active bank accounts (PUBLIC)
 */
export interface GetBankAccountsParams {
  countryCode?: string;
  currency?: string;
}

export const getBankAccounts = async (
  params?: GetBankAccountsParams
): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.BANK_ACCOUNTS.GET_ALL, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bank accounts
 */
export const useGetBankAccounts = (
  params?: GetBankAccountsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['bankAccounts', params],
    queryFn: () => getBankAccounts(params),
    ...options,
  });
};

