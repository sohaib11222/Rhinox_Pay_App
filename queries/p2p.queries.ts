/**
 * P2P Queries
 * GET requests for P2P-related endpoints (Public, User, Vendor, Chat, Review)
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Browse P2P ads - Market listing (PUBLIC)
 */
export interface BrowseAdsParams {
  type?: 'buy' | 'sell';
  cryptoCurrency?: string;
  fiatCurrency?: string;
  countryCode?: string;
  minPrice?: string;
  maxPrice?: string;
  limit?: number;
  offset?: number;
}

export const browseP2PAds = async (params?: BrowseAdsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_PUBLIC.BROWSE_ADS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for browsing P2P ads (PUBLIC)
 */
export const useBrowseP2PAds = (
  params?: BrowseAdsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'ads', 'browse', params],
    queryFn: () => browseP2PAds(params),
    ...options,
  });
};

/**
 * Get ad details (PUBLIC)
 */
export const getP2PAdDetails = async (adId: string | number): Promise<ApiResponse> => {
  try {
    // Convert adId to number if it's a string (API expects integer)
    const numericId = typeof adId === 'string' ? parseInt(adId, 10) : adId;
    if (isNaN(numericId)) {
      throw new Error('Invalid ad ID');
    }
    const route = buildRouteWithParams(`/p2p/ads/{id}`, { id: String(numericId) });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting P2P ad details (PUBLIC)
 */
export const useGetP2PAdDetails = (
  adId: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'ads', adId],
    queryFn: () => getP2PAdDetails(adId),
    enabled: !!adId,
    ...options,
  });
};

/**
 * Browse ads to BUY crypto (USER)
 */
export interface BrowseBuyAdsParams {
  cryptoCurrency?: string;
  fiatCurrency?: string;
  countryCode?: string;
  minPrice?: string;
  maxPrice?: string;
  limit?: number;
  offset?: number;
}

export const browseBuyAds = async (params?: BrowseBuyAdsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_USER.BROWSE_BUY_ADS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for browsing buy ads (USER)
 */
export const useBrowseBuyAds = (
  params?: BrowseBuyAdsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'user', 'ads', 'buy', params],
    queryFn: () => browseBuyAds(params),
    ...options,
  });
};

/**
 * Browse ads to SELL crypto (USER)
 */
export interface BrowseSellAdsParams {
  cryptoCurrency?: string;
  fiatCurrency?: string;
  countryCode?: string;
  minPrice?: string;
  maxPrice?: string;
  limit?: number;
  offset?: number;
}

export const browseSellAds = async (params?: BrowseSellAdsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_USER.BROWSE_SELL_ADS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for browsing sell ads (USER)
 */
export const useBrowseSellAds = (
  params?: BrowseSellAdsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'user', 'ads', 'sell', params],
    queryFn: () => browseSellAds(params),
    ...options,
  });
};

/**
 * Get my orders (USER)
 */
export interface GetOrdersParams {
  role?: 'buyer' | 'vendor';
  status?: string;
  limit?: number;
  offset?: number;
}

export const getP2POrders = async (params?: GetOrdersParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_USER.GET_ORDERS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting P2P orders (USER)
 */
export const useGetP2POrders = (
  params?: GetOrdersParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'orders', params],
    queryFn: () => getP2POrders(params),
    ...options,
  });
};

/**
 * Get order details (BUYER OR VENDOR)
 */
export const getP2POrderDetails = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{id}`, { id: orderId });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting P2P order details
 */
export const useGetP2POrderDetails = (
  orderId: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'orders', orderId],
    queryFn: () => getP2POrderDetails(orderId),
    enabled: !!orderId,
    ...options,
  });
};

/**
 * Get my ads (VENDOR)
 */
export interface GetMyAdsParams {
  type?: string;
  status?: string;
}

export const getMyP2PAds = async (params?: GetMyAdsParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_VENDOR_AD_MGMT.GET_MY_ADS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting my P2P ads (VENDOR)
 */
export const useGetMyP2PAds = (
  params?: GetMyAdsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'vendor', 'ads', params],
    queryFn: () => getMyP2PAds(params),
    ...options,
  });
};

/**
 * Get vendor orders (VENDOR)
 */
export interface GetVendorOrdersParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export const getVendorOrders = async (params?: GetVendorOrdersParams): Promise<ApiResponse> => {
  try {
    const url = buildApiUrl(API_ROUTES.P2P_VENDOR_ORDERS.GET_VENDOR_ORDERS, params as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting vendor orders
 */
export const useGetVendorOrders = (
  params?: GetVendorOrdersParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'vendor', 'orders', params],
    queryFn: () => getVendorOrders(params),
    ...options,
  });
};

/**
 * Get chat messages for an order
 */
export const getP2PChatMessages = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{orderId}/messages`, { orderId });
    const response = await apiClient.get(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting P2P chat messages
 */
export const useGetP2PChatMessages = (
  orderId: string,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'chat', 'messages', orderId],
    queryFn: () => getP2PChatMessages(orderId),
    enabled: !!orderId,
    ...options,
  });
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = async (): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(API_ROUTES.P2P_CHAT.UNREAD_COUNT);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting unread message count
 */
export const useGetUnreadMessageCount = (options?: UseQueryOptions<ApiResponse, Error>) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'chat', 'unread-count'],
    queryFn: getUnreadMessageCount,
    ...options,
  });
};

/**
 * Get all reviews for a vendor
 */
export interface GetVendorReviewsParams {
  vendorId: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export const getVendorReviews = async (params: GetVendorReviewsParams): Promise<ApiResponse> => {
  try {
    const { vendorId, ...queryParams } = params;
    const route = buildRouteWithParams(`/p2p/vendors/{vendorId}/reviews`, { vendorId });
    const url = buildApiUrl(route, queryParams as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting vendor reviews
 */
export const useGetVendorReviews = (
  params: GetVendorReviewsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'reviews', 'vendor', params],
    queryFn: () => getVendorReviews(params),
    enabled: !!params.vendorId,
    ...options,
  });
};

/**
 * Get reviews for a specific ad
 */
export interface GetAdReviewsParams {
  adId: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export const getAdReviews = async (params: GetAdReviewsParams): Promise<ApiResponse> => {
  try {
    const { adId, ...queryParams } = params;
    const route = buildRouteWithParams(`/p2p/ads/{adId}/reviews`, { adId });
    const url = buildApiUrl(route, queryParams as any);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting ad reviews
 */
export const useGetAdReviews = (
  params: GetAdReviewsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['p2p', 'reviews', 'ad', params],
    queryFn: () => getAdReviews(params),
    enabled: !!params.adId,
    ...options,
  });
};

