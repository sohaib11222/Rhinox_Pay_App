/**
 * KYC Mutations
 * POST/PUT/DELETE requests for KYC-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';

/**
 * Submit or update KYC registration information
 */
export interface SubmitKYCRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  idDocumentUrl?: string; // Optional for now, can be added later with file upload
  countryId: number | string;
}

export const submitKYC = async (data: SubmitKYCRequest): Promise<ApiResponse> => {
  try {
    console.log('[submitKYC] Submitting KYC data:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.KYC.SUBMIT, data);
    console.log('[submitKYC] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[submitKYC] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for submitting KYC
 */
export const useSubmitKYC = (
  options?: UseMutationOptions<ApiResponse, Error, SubmitKYCRequest>
) => {
  return useMutation<ApiResponse, Error, SubmitKYCRequest>({
    mutationFn: submitKYC,
    ...options,
  });
};

/**
 * Upload ID document for KYC verification
 */
export interface UploadIDRequest {
  documentUrl: string;
  idType: string;
  idNumber: string;
}

export const uploadID = async (data: UploadIDRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.KYC.UPLOAD_ID, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for uploading ID
 */
export const useUploadID = (
  options?: UseMutationOptions<ApiResponse, Error, UploadIDRequest>
) => {
  return useMutation<ApiResponse, Error, UploadIDRequest>({
    mutationFn: uploadID,
    ...options,
  });
};

/**
 * Submit face verification result
 */
export interface FaceVerificationRequest {
  imageUrl: string;
  isSuccessful: boolean;
}

export const submitFaceVerification = async (
  data: FaceVerificationRequest
): Promise<ApiResponse> => {
  try {
    console.log('[submitFaceVerification] Submitting face verification:', JSON.stringify(data, null, 2));
    const response = await apiClient.post(API_ROUTES.KYC.FACE_VERIFICATION, data);
    console.log('[submitFaceVerification] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[submitFaceVerification] Error:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for face verification
 */
export const useSubmitFaceVerification = (
  options?: UseMutationOptions<ApiResponse, Error, FaceVerificationRequest>
) => {
  return useMutation<ApiResponse, Error, FaceVerificationRequest>({
    mutationFn: submitFaceVerification,
    ...options,
  });
};

/**
 * Admin - Approve user KYC
 */
export interface ApproveKYCRequest {
  userId: string;
}

export const approveKYC = async (data: ApproveKYCRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.KYC.ADMIN_APPROVE, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for approving KYC (Admin)
 */
export const useApproveKYC = (
  options?: UseMutationOptions<ApiResponse, Error, ApproveKYCRequest>
) => {
  return useMutation<ApiResponse, Error, ApproveKYCRequest>({
    mutationFn: approveKYC,
    ...options,
  });
};

/**
 * Admin - Reject user KYC
 */
export interface RejectKYCRequest {
  userId: string;
  reason: string;
}

export const rejectKYC = async (data: RejectKYCRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.KYC.ADMIN_REJECT, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for rejecting KYC (Admin)
 */
export const useRejectKYC = (
  options?: UseMutationOptions<ApiResponse, Error, RejectKYCRequest>
) => {
  return useMutation<ApiResponse, Error, RejectKYCRequest>({
    mutationFn: rejectKYC,
    ...options,
  });
};

