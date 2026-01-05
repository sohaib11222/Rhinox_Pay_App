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
    // Auto-save tokens if returned - await to ensure they're stored before returning
    if (response.data?.data?.accessToken) {
      await setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      await setRefreshToken(response.data.data.refreshToken);
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
    // Auto-save tokens if returned - await to ensure they're stored before returning
    if (response.data?.data?.accessToken) {
      await setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      await setRefreshToken(response.data.data.refreshToken);
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
    // Get current token before verification
    const { getAccessToken } = await import('../utils/apiClient');
    const oldToken = await getAccessToken();
    if (oldToken) {
      console.log('[verifyEmail] Old token before verification (preview):', oldToken.substring(0, 50) + '...');
    }
    
    const response = await apiClient.post(API_ROUTES.AUTH.VERIFY_EMAIL, data);
    console.log('[verifyEmail] Response received:', JSON.stringify(response.data, null, 2));
    
    // Auto-save tokens if returned - await to ensure they're stored before returning
    if (response.data?.data?.accessToken) {
      const newToken = response.data.data.accessToken;
      console.log('[verifyEmail] New token from response (preview):', newToken.substring(0, 50) + '...');
      console.log('[verifyEmail] Storing new access token...');
      await setAccessToken(newToken);
      
      // Verify the new token was stored correctly
      const storedToken = await getAccessToken();
      if (storedToken === newToken) {
        console.log('[verifyEmail] ✓ Token stored and verified successfully');
      } else {
        console.error('[verifyEmail] ✗ Token mismatch! Stored token does not match new token');
        console.error('[verifyEmail] Expected:', newToken.substring(0, 50) + '...');
        console.error('[verifyEmail] Got:', storedToken ? storedToken.substring(0, 50) + '...' : 'null');
      }
    } else {
      console.warn('[verifyEmail] No accessToken in response');
    }
    if (response.data?.data?.refreshToken) {
      console.log('[verifyEmail] Storing new refresh token');
      await setRefreshToken(response.data.data.refreshToken);
    } else {
      console.log('[verifyEmail] No refreshToken in response (this is OK)');
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
    // Auto-save tokens if returned - await to ensure they're stored before returning
    if (response.data?.data?.accessToken) {
      await setAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      await setRefreshToken(response.data.data.refreshToken);
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
    // Get token before making request to verify it's available
    const { getAccessToken } = await import('../utils/apiClient');
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token available. Please verify your email first.');
    }
    console.log('[setupPin] Making request with token (preview):', token.substring(0, 50) + '...');
    
    const response = await apiClient.post(API_ROUTES.AUTH.SETUP_PIN, data);
    return response.data;
  } catch (error: any) {
    // If 401 error, it might be a timing issue - log for debugging
    if (error.status === 401) {
      console.error('[setupPin] 401 Error - Token might not be recognized by backend yet');
      console.error('[setupPin] Error details:', JSON.stringify(error, null, 2));
    }
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
 * Set or update PIN after password verification
 * This endpoint should be called after password verification
 */
export interface SetPinRequest {
  pin: string;
}

export const setPin = async (data: SetPinRequest): Promise<ApiResponse> => {
  try {
    // Token is automatically included by apiClient
    const response = await apiClient.post(API_ROUTES.AUTH.SET_PIN, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for set pin (after password verification)
 */
export const useSetPin = (
  options?: UseMutationOptions<ApiResponse, Error, SetPinRequest>
) => {
  return useMutation<ApiResponse, Error, SetPinRequest>({
    mutationFn: setPin,
    ...options,
  });
};

/**
 * Verify password before setting/changing PIN
 * This is the first step in the PIN setup/change process
 */
export interface VerifyPasswordForPinRequest {
  password: string;
}

export const verifyPasswordForPin = async (data: VerifyPasswordForPinRequest): Promise<ApiResponse> => {
  try {
    // Token is automatically included by apiClient
    const response = await apiClient.post(API_ROUTES.AUTH.VERIFY_PASSWORD_FOR_PIN, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for verify password for PIN
 */
export const useVerifyPasswordForPin = (
  options?: UseMutationOptions<ApiResponse, Error, VerifyPasswordForPinRequest>
) => {
  return useMutation<ApiResponse, Error, VerifyPasswordForPinRequest>({
    mutationFn: verifyPasswordForPin,
    ...options,
  });
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<ApiResponse> => {
  try {
    console.log('[logoutUser] Calling logout API...');
    const response = await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    console.log('[logoutUser] Logout response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[logoutUser] Logout error:', error);
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

/**
 * Forgot password - Send OTP to email
 */
export interface ForgotPasswordRequest {
  email: string;
}

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
  try {
    console.log('[forgotPassword] Requesting password reset OTP:', data.email);
    const response = await apiClient.post(API_ROUTES.AUTH.FORGOT_PASSWORD, data);
    console.log('[forgotPassword] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for forgot password
 */
export const useForgotPassword = (options?: UseMutationOptions<ApiResponse, Error, ForgotPasswordRequest>) => {
  return useMutation<ApiResponse, Error, ForgotPasswordRequest>({
    mutationFn: forgotPassword,
    ...options,
  });
};

/**
 * Verify password reset OTP
 */
export interface VerifyPasswordResetOtpRequest {
  email: string;
  otp: string;
}

export const verifyPasswordResetOtp = async (data: VerifyPasswordResetOtpRequest): Promise<ApiResponse> => {
  try {
    console.log('[verifyPasswordResetOtp] Verifying OTP:', data.email);
    const response = await apiClient.post(API_ROUTES.AUTH.VERIFY_PASSWORD_RESET_OTP, data);
    console.log('[verifyPasswordResetOtp] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for verify password reset OTP
 */
export const useVerifyPasswordResetOtp = (options?: UseMutationOptions<ApiResponse, Error, VerifyPasswordResetOtpRequest>) => {
  return useMutation<ApiResponse, Error, VerifyPasswordResetOtpRequest>({
    mutationFn: verifyPasswordResetOtp,
    ...options,
  });
};

/**
 * Reset password with verified OTP
 */
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<ApiResponse> => {
  try {
    console.log('[resetPassword] Resetting password for:', data.email);
    const response = await apiClient.post(API_ROUTES.AUTH.RESET_PASSWORD, data);
    console.log('[resetPassword] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for reset password
 */
export const useResetPassword = (options?: UseMutationOptions<ApiResponse, Error, ResetPasswordRequest>) => {
  return useMutation<ApiResponse, Error, ResetPasswordRequest>({
    mutationFn: resetPassword,
    ...options,
  });
};

/**
 * Update user profile
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryId?: string | number;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.put(API_ROUTES.AUTH.ME, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for update profile
 */
export const useUpdateProfile = (options?: UseMutationOptions<ApiResponse, Error, UpdateProfileRequest>) => {
  return useMutation<ApiResponse, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,
    ...options,
  });
};

