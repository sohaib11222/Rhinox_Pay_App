/**
 * Wallet Mutations
 * POST/PUT/DELETE requests for wallet-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Create a new wallet
 */
export interface CreateWalletRequest {
  currency: string;
  type: 'fiat' | 'crypto';
}

export const createWallet = async (data: CreateWalletRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.WALLET.CREATE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating wallet
 */
export const useCreateWallet = (
  options?: UseMutationOptions<ApiResponse, Error, CreateWalletRequest>
) => {
  return useMutation<ApiResponse, Error, CreateWalletRequest>({
    mutationFn: createWallet,
    ...options,
  });
};

