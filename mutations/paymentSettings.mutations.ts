/**
 * Payment Settings Mutations
 * POST/PUT/DELETE requests for payment settings endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Add a new bank account payment method
 */
export interface AddBankAccountRequest {
  accountType: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  countryCode: string;
  currency: string;
  isDefault?: boolean;
}

export const addBankAccount = async (data: AddBankAccountRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.PAYMENT_SETTINGS.ADD_BANK_ACCOUNT, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for adding bank account
 */
export const useAddBankAccount = (
  options?: UseMutationOptions<ApiResponse, Error, AddBankAccountRequest>
) => {
  return useMutation<ApiResponse, Error, AddBankAccountRequest>({
    mutationFn: addBankAccount,
    ...options,
  });
};

/**
 * Add a new mobile money payment method
 */
export interface AddMobileMoneyRequest {
  providerId: string;
  phoneNumber: string;
  countryCode: string;
  currency: string;
  isDefault?: boolean;
}

export const addMobileMoney = async (data: AddMobileMoneyRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.PAYMENT_SETTINGS.ADD_MOBILE_MONEY, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for adding mobile money
 */
export const useAddMobileMoney = (
  options?: UseMutationOptions<ApiResponse, Error, AddMobileMoneyRequest>
) => {
  return useMutation<ApiResponse, Error, AddMobileMoneyRequest>({
    mutationFn: addMobileMoney,
    ...options,
  });
};

/**
 * Update a payment method
 */
export interface UpdatePaymentMethodRequest {
  paymentMethodId: string;
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export const updatePaymentMethod = async (
  data: UpdatePaymentMethodRequest
): Promise<ApiResponse> => {
  try {
    const { paymentMethodId, ...updateData } = data;
    const route = buildRouteWithParams(`/payment-settings/{id}`, { id: paymentMethodId });
    const response = await apiClient.put(route, updateData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for updating payment method
 */
export const useUpdatePaymentMethod = (
  options?: UseMutationOptions<ApiResponse, Error, UpdatePaymentMethodRequest>
) => {
  return useMutation<ApiResponse, Error, UpdatePaymentMethodRequest>({
    mutationFn: updatePaymentMethod,
    ...options,
  });
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (paymentMethodId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/payment-settings/{id}`, { id: paymentMethodId });
    const response = await apiClient.delete(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for deleting payment method
 */
export const useDeletePaymentMethod = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: deletePaymentMethod,
    ...options,
  });
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (
  paymentMethodId: string
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/payment-settings/{id}/set-default`, {
      id: paymentMethodId,
    });
    const response = await apiClient.post(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for setting default payment method
 */
export const useSetDefaultPaymentMethod = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: setDefaultPaymentMethod,
    ...options,
  });
};

