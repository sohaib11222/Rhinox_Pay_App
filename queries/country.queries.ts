/**
 * Country Queries
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';
import { FALLBACK_COUNTRIES, filterSupportedCountries } from '../utils/supportedCountries';

const COUNTRIES_CACHE_KEY = 'rhinox_countries_cache_v1';

export const getCountries = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.COUNTRY.GET_ALL);
    const payload = response.data;
    if (payload?.data && Array.isArray(payload.data)) {
      await AsyncStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(payload.data));
    }
    return payload;
  } catch (error: any) {
    try {
      const cached = await AsyncStorage.getItem(COUNTRIES_CACHE_KEY);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }
    } catch {
      // ignore cache read errors
    }
    throw handleApiError(error);
  }
};

export const useGetCountries = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['countries'],
    queryFn: getCountries,
    retry: 3,
    staleTime: 30 * 60 * 1000,
    placeholderData: { success: true, data: filterSupportedCountries(FALLBACK_COUNTRIES) },
    ...options,
  });
};

export const getCountryByCode = async (code: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/countries/{code}`, { code });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

export const useGetCountryByCode = (
  code: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['countries', code],
    queryFn: () => getCountryByCode(code),
    enabled: !!code,
    ...options,
  });
};
