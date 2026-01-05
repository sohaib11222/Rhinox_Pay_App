/**
 * Transfer Mutations
 * POST/PUT/DELETE requests for transfer-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Initiate a fiat transfer transaction
 */
export interface InitiateTransferRequest {
  amount: string;
  currency: string;
  countryCode: string;
  channel: 'rhionx_user' | 'bank_account' | 'mobile_money';
  paymentMethodId?: number; // Required for bank_account channel
  recipientEmail?: string;
  recipientUserId?: string;
  accountNumber?: string;
  bankName?: string;
  providerId?: number; // Required for mobile_money channel (integer, not string)
  phoneNumber?: string; // Required for mobile_money channel
}

export const initiateTransfer = async (data: InitiateTransferRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.TRANSFER.INITIATE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for initiating transfer
 */
export const useInitiateTransfer = (
  options?: UseMutationOptions<ApiResponse, Error, InitiateTransferRequest>
) => {
  return useMutation<ApiResponse, Error, InitiateTransferRequest>({
    mutationFn: initiateTransfer,
    ...options,
  });
};

/**
 * Verify and complete transfer with email code and PIN
 */
export interface VerifyTransferRequest {
  transactionId: number; // API expects integer
  emailCode: string;
  pin: string;
}

export const verifyTransfer = async (data: VerifyTransferRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.TRANSFER.VERIFY, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for verifying transfer
 */
export const useVerifyTransfer = (
  options?: UseMutationOptions<ApiResponse, Error, VerifyTransferRequest>
) => {
  return useMutation<ApiResponse, Error, VerifyTransferRequest>({
    mutationFn: verifyTransfer,
    ...options,
  });
};

