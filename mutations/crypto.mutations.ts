/**
 * Crypto Mutations
 * POST/PUT/DELETE requests for cryptocurrency-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Receive Tatum webhook events
 */
export interface TatumWebhookRequest {
  subscriptionType: string;
  address: string;
  counterAddress?: string;
  amount: string;
  txId: string;
  blockNumber?: number;
  contractAddress?: string;
  timestamp?: number;
}

export const receiveTatumWebhook = async (data: TatumWebhookRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.CRYPTO.TATUM_WEBHOOK, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for Tatum webhook
 */
export const useReceiveTatumWebhook = (
  options?: UseMutationOptions<ApiResponse, Error, TatumWebhookRequest>
) => {
  return useMutation<ApiResponse, Error, TatumWebhookRequest>({
    mutationFn: receiveTatumWebhook,
    ...options,
  });
};

