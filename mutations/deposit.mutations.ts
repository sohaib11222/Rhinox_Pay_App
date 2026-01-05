/**
 * Deposit Mutations
 * POST/PUT/DELETE requests for deposit-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Initiate a fiat wallet deposit transaction
 */
export interface InitiateDepositRequest {
  amount: string;
  currency: string;
  countryCode: string;
  channel: 'bank_transfer' | 'mobile_money';
  providerId?: number; // Required for mobile_money, not used for bank_transfer
}

export const initiateDeposit = async (data: InitiateDepositRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.DEPOSIT.INITIATE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for initiating deposit
 */
export const useInitiateDeposit = (
  options?: UseMutationOptions<ApiResponse, Error, InitiateDepositRequest>
) => {
  return useMutation<ApiResponse, Error, InitiateDepositRequest>({
    mutationFn: initiateDeposit,
    ...options,
  });
};

/**
 * Confirm and complete deposit transaction with PIN
 */
export interface ConfirmDepositRequest {
  transactionId: number;
  pin: string;
}

export const confirmDeposit = async (data: ConfirmDepositRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.DEPOSIT.CONFIRM, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for confirming deposit
 */
export const useConfirmDeposit = (
  options?: UseMutationOptions<ApiResponse, Error, ConfirmDepositRequest>
) => {
  return useMutation<ApiResponse, Error, ConfirmDepositRequest>({
    mutationFn: confirmDeposit,
    ...options,
  });
};

