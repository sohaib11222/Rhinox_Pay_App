/**
 * Country Queries
 * GET requests for country endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Get all countries
 */
export const getCountries = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.COUNTRY.GET_ALL);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting all countries
 */
export const useGetCountries = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['countries'],
    queryFn: getCountries,
    ...options,
  });
};

/**
 * Get country by code
 */
export const getCountryByCode = async (code: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/countries/{code}`, { code });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting country by code
 */
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

