/**
 * Auth Mutations
 * POST/PUT/DELETE requests for authentication-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES } from '../utils/apiConfig';
import { setAccessToken, setRefreshToken } from '../utils/apiClient';

/**
 * Login user
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.LOGIN, data);
    // Auto-save tokens if returned
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      setRefreshToken(response.data.data.refreshToken);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for login
 */
export const useLogin = (options?: UseMutationOptions<ApiResponse, Error, LoginRequest>) => {
  return useMutation<ApiResponse, Error, LoginRequest>({
    mutationFn: loginUser,
    ...options,
  });
};

/**
 * Register a new user account
 */
export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  countryId: string;
  termsAccepted: boolean;
}

export const registerUser = async (data: RegisterRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.REGISTER, data);
    // Auto-save tokens if returned
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      setRefreshToken(response.data.data.refreshToken);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for register
 */
export const useRegister = (options?: UseMutationOptions<ApiResponse, Error, RegisterRequest>) => {
  return useMutation<ApiResponse, Error, RegisterRequest>({
    mutationFn: registerUser,
    ...options,
  });
};

/**
 * Verify email address with OTP code
 */
export interface VerifyEmailRequest {
  userId: string;
  code: string;
}

export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.VERIFY_EMAIL, data);
    // Auto-save tokens if returned
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      setRefreshToken(response.data.data.refreshToken);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for verify email
 */
export const useVerifyEmail = (
  options?: UseMutationOptions<ApiResponse, Error, VerifyEmailRequest>
) => {
  return useMutation<ApiResponse, Error, VerifyEmailRequest>({
    mutationFn: verifyEmail,
    ...options,
  });
};

/**
 * Resend email verification OTP
 */
export interface ResendVerificationRequest {
  userId: string;
}

export const resendVerification = async (data: ResendVerificationRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.RESEND_VERIFICATION, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for resend verification
 */
export const useResendVerification = (
  options?: UseMutationOptions<ApiResponse, Error, ResendVerificationRequest>
) => {
  return useMutation<ApiResponse, Error, ResendVerificationRequest>({
    mutationFn: resendVerification,
    ...options,
  });
};

/**
 * Refresh access token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

export const refreshAccessToken = async (data: RefreshTokenRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.REFRESH_TOKEN, data);
    // Auto-save tokens if returned
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      setRefreshToken(response.data.data.refreshToken);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for refresh token
 */
export const useRefreshToken = (
  options?: UseMutationOptions<ApiResponse, Error, RefreshTokenRequest>
) => {
  return useMutation<ApiResponse, Error, RefreshTokenRequest>({
    mutationFn: refreshAccessToken,
    ...options,
  });
};

/**
 * Setup 5-digit transaction PIN
 */
export interface SetupPinRequest {
  pin: string;
}

export const setupPin = async (data: SetupPinRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.SETUP_PIN, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for setup pin
 */
export const useSetupPin = (
  options?: UseMutationOptions<ApiResponse, Error, SetupPinRequest>
) => {
  return useMutation<ApiResponse, Error, SetupPinRequest>({
    mutationFn: setupPin,
    ...options,
  });
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for logout
 */
export const useLogout = (options?: UseMutationOptions<ApiResponse, Error, void>) => {
  return useMutation<ApiResponse, Error, void>({
    mutationFn: logoutUser,
    ...options,
  });
};

/**
 * Mark face verification as successful
 */
export const markFaceVerified = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.AUTH.MARK_FACE_VERIFIED);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for mark face verified
 */
export const useMarkFaceVerified = (options?: UseMutationOptions<ApiResponse, Error, void>) => {
  return useMutation<ApiResponse, Error, void>({
    mutationFn: markFaceVerified,
    ...options,
  });
};

