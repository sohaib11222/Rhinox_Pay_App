/**
 * Notification Queries
 * GET requests for notification endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

export interface GetNotificationsParams {
  type?: 'transaction' | 'p2p' | 'conversion' | 'general' | 'promotional';
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get all notifications
 */
export const getNotifications = async (params?: GetNotificationsParams): Promise<ApiResponse> => {
  try {
    console.log('[getNotifications] Calling notifications API with params:', JSON.stringify(params, null, 2));
    const url = buildApiUrl(API_ROUTES.NOTIFICATION.GET_ALL, params as any);
    const response = await apiClient.get(url);
    console.log('[getNotifications] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getNotifications] Error fetching notifications:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting all notifications
 */
export const useGetNotifications = (
  params?: GetNotificationsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
    ...options,
  });
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<ApiResponse> => {
  try {
    console.log('[getUnreadNotificationCount] Calling unread count API...');
    const response = await apiClient.get(API_ROUTES.NOTIFICATION.GET_UNREAD_COUNT);
    console.log('[getUnreadNotificationCount] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getUnreadNotificationCount] Error fetching unread count:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting unread notification count
 */
export const useGetUnreadNotificationCount = (
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    ...options,
  });
};

