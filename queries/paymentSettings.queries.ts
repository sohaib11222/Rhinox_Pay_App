/**
 * Payment Settings Queries
 * GET requests for payment settings endpoints
 */

import { useEffect, useState } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';
import { getCachedBanks, setCachedBanks } from '../utils/bankListCache';

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
  const countryCode = params?.countryCode || 'NG';
  const currency = params?.currency || 'NGN';

  try {
    const url = buildApiUrl(API_ROUTES.PAYMENT_SETTINGS.BANKS, params as any);
    const response = await apiClient.get(url, {
      timeout: 90000,
    });

    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      await setCachedBanks(response.data.data, countryCode, currency);
    }

    return response.data;
  } catch (error: any) {
    const cached = await getCachedBanks(countryCode, currency);
    if (cached?.length) {
      console.warn('[getPaymentSettingsBanks] Using cached bank list after network error');
      return {
        success: true,
        data: cached,
        message: 'Loaded saved bank list',
      };
    }
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
  const countryCode = params?.countryCode || 'NG';
  const currency = params?.currency || 'NGN';
  const [cachedInitialData, setCachedInitialData] = useState<ApiResponse | undefined>();

  useEffect(() => {
    let mounted = true;
    getCachedBanks(countryCode, currency).then((banks) => {
      if (!mounted || !banks?.length) return;
      setCachedInitialData({
        success: true,
        data: banks,
      });
    });
    return () => {
      mounted = false;
    };
  }, [countryCode, currency]);

  return useQuery<ApiResponse, Error>({
    queryKey: ['paymentSettings', 'banks', params],
    queryFn: () => getPaymentSettingsBanks(params),
    initialData: cachedInitialData,
    initialDataUpdatedAt: cachedInitialData ? 0 : undefined,
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 7 * 24,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnMount: 'always',
    ...options,
  });
};

