import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl } from '../utils/apiConfig';

/**
 * Get all bill payment categories
 */
export const getBillPaymentCategories = async (): Promise<ApiResponse> => {
  try {
    console.log('[getBillPaymentCategories] Fetching bill payment categories...');
    const response = await apiClient.get(API_ROUTES.BILL_PAYMENT.CATEGORIES);
    console.log('[getBillPaymentCategories] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getBillPaymentCategories] Error fetching categories:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bill payment categories
 */
export const useGetBillPaymentCategories = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['bill-payment', 'categories'],
    queryFn: getBillPaymentCategories,
    ...options,
  });
};

/**
 * Get providers by category
 */
export interface GetProvidersParams {
  categoryCode: string;
  countryCode?: string;
}

export const getBillPaymentProviders = async (params: GetProvidersParams): Promise<ApiResponse> => {
  try {
    console.log('[getBillPaymentProviders] Fetching providers with params:', JSON.stringify(params, null, 2));
    // Build query string from params (apiClient already has baseURL)
    let url = API_ROUTES.BILL_PAYMENT.PROVIDERS;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiClient.get(url);
    console.log('[getBillPaymentProviders] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getBillPaymentProviders] Error fetching providers:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bill payment providers
 */
export const useGetBillPaymentProviders = (
  params: GetProvidersParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['bill-payment', 'providers', params],
    queryFn: () => getBillPaymentProviders(params),
    enabled: !!params.categoryCode,
    ...options,
  });
};

/**
 * Get plans/bundles by provider
 */
export interface GetPlansParams {
  providerId: number;
}

export const getBillPaymentPlans = async (params: GetPlansParams): Promise<ApiResponse> => {
  try {
    console.log('[getBillPaymentPlans] Fetching plans with params:', JSON.stringify(params, null, 2));
    // Build query string from params (apiClient already has baseURL)
    let url = API_ROUTES.BILL_PAYMENT.PLANS;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiClient.get(url);
    console.log('[getBillPaymentPlans] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getBillPaymentPlans] Error fetching plans:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bill payment plans
 */
export const useGetBillPaymentPlans = (
  params: GetPlansParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['bill-payment', 'plans', params],
    queryFn: () => getBillPaymentPlans(params),
    enabled: !!params.providerId,
    ...options,
  });
};

/**
 * Get user's beneficiaries
 */
export interface GetBeneficiariesParams {
  categoryCode?: string;
}

export const getBillPaymentBeneficiaries = async (params?: GetBeneficiariesParams): Promise<ApiResponse> => {
  try {
    console.log('[getBillPaymentBeneficiaries] Fetching beneficiaries with params:', JSON.stringify(params, null, 2));
    // Build query string from params (apiClient already has baseURL)
    let url = API_ROUTES.BILL_PAYMENT.BENEFICIARIES;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiClient.get(url);
    console.log('[getBillPaymentBeneficiaries] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getBillPaymentBeneficiaries] Error fetching beneficiaries:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting bill payment beneficiaries
 */
export const useGetBillPaymentBeneficiaries = (
  params?: GetBeneficiariesParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['bill-payment', 'beneficiaries', params],
    queryFn: () => getBillPaymentBeneficiaries(params),
    ...options,
  });
};

