import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Validate meter number (electricity)
 */
export interface ValidateMeterRequest {
  providerId: number;
  meterNumber: string;
  accountType: 'prepaid' | 'postpaid';
}

export const validateMeter = async (data: ValidateMeterRequest): Promise<ApiResponse> => {
  try {
    console.log('[validateMeter] Validating meter with data:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.BILL_PAYMENT.VALIDATE_METER, data);
    console.log('[validateMeter] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[validateMeter] Error validating meter:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for validating meter
 */
export const useValidateMeter = (
  options?: UseMutationOptions<ApiResponse, Error, ValidateMeterRequest>
) => {
  return useMutation<ApiResponse, Error, ValidateMeterRequest>({
    mutationFn: validateMeter,
    ...options,
  });
};

/**
 * Validate account number (betting)
 */
export interface ValidateAccountRequest {
  providerId: number;
  accountNumber: string;
}

export const validateAccount = async (data: ValidateAccountRequest): Promise<ApiResponse> => {
  try {
    console.log('[validateAccount] Validating account with data:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.BILL_PAYMENT.VALIDATE_ACCOUNT, data);
    console.log('[validateAccount] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[validateAccount] Error validating account:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for validating account
 */
export const useValidateAccount = (
  options?: UseMutationOptions<ApiResponse, Error, ValidateAccountRequest>
) => {
  return useMutation<ApiResponse, Error, ValidateAccountRequest>({
    mutationFn: validateAccount,
    ...options,
  });
};

/**
 * Initiate bill payment
 */
export interface InitiateBillPaymentRequest {
  categoryCode: string;
  providerId: number;
  currency: string;
  amount: string;
  accountNumber: string;
  accountType?: string;
  planId?: number;
  beneficiaryId?: number;
}

export const initiateBillPayment = async (data: InitiateBillPaymentRequest): Promise<ApiResponse> => {
  try {
    console.log('[initiateBillPayment] Initiating bill payment with data:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.BILL_PAYMENT.INITIATE, data);
    console.log('[initiateBillPayment] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[initiateBillPayment] Error initiating bill payment:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for initiating bill payment
 */
export const useInitiateBillPayment = (
  options?: UseMutationOptions<ApiResponse, Error, InitiateBillPaymentRequest>
) => {
  return useMutation<ApiResponse, Error, InitiateBillPaymentRequest>({
    mutationFn: initiateBillPayment,
    ...options,
  });
};

/**
 * Confirm bill payment
 */
export interface ConfirmBillPaymentRequest {
  transactionId: number;
  pin: string;
}

export const confirmBillPayment = async (data: ConfirmBillPaymentRequest): Promise<ApiResponse> => {
  try {
    console.log('[confirmBillPayment] Confirming bill payment with data:', JSON.stringify({ ...data, pin: '***' }, null, 2));
    const response = await apiClient.post(API_ROUTES.BILL_PAYMENT.CONFIRM, data);
    console.log('[confirmBillPayment] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[confirmBillPayment] Error confirming bill payment:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for confirming bill payment
 */
export const useConfirmBillPayment = (
  options?: UseMutationOptions<ApiResponse, Error, ConfirmBillPaymentRequest>
) => {
  return useMutation<ApiResponse, Error, ConfirmBillPaymentRequest>({
    mutationFn: confirmBillPayment,
    ...options,
  });
};

/**
 * Create beneficiary
 */
export interface CreateBeneficiaryRequest {
  categoryCode: string;
  providerId: number;
  name: string;
  accountNumber: string;
  accountType?: string;
}

export const createBeneficiary = async (data: CreateBeneficiaryRequest): Promise<ApiResponse> => {
  try {
    console.log('[createBeneficiary] Creating beneficiary with data:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.BILL_PAYMENT.BENEFICIARIES, data);
    console.log('[createBeneficiary] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[createBeneficiary] Error creating beneficiary:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating beneficiary
 */
export const useCreateBeneficiary = (
  options?: UseMutationOptions<ApiResponse, Error, CreateBeneficiaryRequest>
) => {
  return useMutation<ApiResponse, Error, CreateBeneficiaryRequest>({
    mutationFn: createBeneficiary,
    ...options,
  });
};

/**
 * Update beneficiary
 */
export interface UpdateBeneficiaryRequest {
  id: number;
  name?: string;
  accountNumber?: string;
  accountType?: string;
}

export const updateBeneficiary = async (data: UpdateBeneficiaryRequest): Promise<ApiResponse> => {
  try {
    const { id, ...updateData } = data;
    console.log('[updateBeneficiary] Updating beneficiary with data:', JSON.stringify({ id, ...updateData }, null, 2));
    const route = buildRouteWithParams(`${API_ROUTES.BILL_PAYMENT.BENEFICIARIES}/{id}`, { id });
    const response = await apiClient.put(route, updateData);
    console.log('[updateBeneficiary] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[updateBeneficiary] Error updating beneficiary:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for updating beneficiary
 */
export const useUpdateBeneficiary = (
  options?: UseMutationOptions<ApiResponse, Error, UpdateBeneficiaryRequest>
) => {
  return useMutation<ApiResponse, Error, UpdateBeneficiaryRequest>({
    mutationFn: updateBeneficiary,
    ...options,
  });
};

/**
 * Delete beneficiary
 */
export const deleteBeneficiary = async (id: number): Promise<ApiResponse> => {
  try {
    console.log('[deleteBeneficiary] Deleting beneficiary with id:', id);
    const route = buildRouteWithParams(`${API_ROUTES.BILL_PAYMENT.BENEFICIARIES}/{id}`, { id });
    const response = await apiClient.delete(route);
    console.log('[deleteBeneficiary] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[deleteBeneficiary] Error deleting beneficiary:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for deleting beneficiary
 */
export const useDeleteBeneficiary = (
  options?: UseMutationOptions<ApiResponse, Error, number>
) => {
  return useMutation<ApiResponse, Error, number>({
    mutationFn: deleteBeneficiary,
    ...options,
  });
};

