/**
 * Payment Settings Queries
 * GET requests for payment settings endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Get all user payment methods
 */
export interface GetPaymentMethodsParams {
  type?: string;
}

export const getPaymentMethods = async (params?: GetPaymentMethodsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.PAYMENT_SETTINGS.GET_ALL, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting payment methods
 */
export const useGetPaymentMethods = (
  params?: GetPaymentMethodsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['paymentSettings', params],
    queryFn: () => getPaymentMethods(params),
    ...options,
  });
};

/**
 * Get a single payment method by ID
 */
export const getPaymentMethodById = async (id: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/payment-settings/{id}`, { id });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting payment method by ID
 */
export const useGetPaymentMethodById = (
  id: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['paymentSettings', id],
    queryFn: () => getPaymentMethodById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Get available mobile money providers
 */
export interface GetMobileMoneyProvidersParams {
  countryCode?: string;
  currency?: string;
}

export const getPaymentSettingsMobileMoneyProviders = async (
  params?: GetMobileMoneyProvidersParams
): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.PAYMENT_SETTINGS.MOBILE_MONEY_PROVIDERS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting mobile money providers
 */
export const useGetPaymentSettingsMobileMoneyProviders = (
  params?: GetMobileMoneyProvidersParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['paymentSettings', 'mobile-money-providers', params],
    queryFn: () => getPaymentSettingsMobileMoneyProviders(params),
    ...options,
  });
};

/**
 * Get available banks
 */
export interface GetBanksParams {
  countryCode?: string;
  currency?: string;
}

export const getPaymentSettingsBanks = async (
  params?: GetBanksParams
): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.PAYMENT_SETTINGS.BANKS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting banks
 */
export const useGetPaymentSettingsBanks = (
  params?: GetBanksParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['paymentSettings', 'banks', params],
    queryFn: () => getPaymentSettingsBanks(params),
    ...options,
  });
};

