/**
 * Notification Mutations
 * POST, PUT, DELETE requests for notification endpoints
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id: number): Promise<ApiResponse> => {
  try {
    console.log('[markNotificationAsRead] Marking notification as read:', id);
    const route = buildRouteWithParams(`${API_ROUTES.NOTIFICATION.MARK_AS_READ}/{id}/read`, { id });
    const response = await apiClient.put(route);
    console.log('[markNotificationAsRead] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[markNotificationAsRead] Error marking notification as read:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking notification as read
 */
export const useMarkNotificationAsRead = (
  options?: UseMutationOptions<ApiResponse, Error, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse, Error, number>({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    ...options,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<ApiResponse> => {
  try {
    console.log('[markAllNotificationsAsRead] Marking all notifications as read...');
    const response = await apiClient.put(API_ROUTES.NOTIFICATION.MARK_ALL_READ);
    console.log('[markAllNotificationsAsRead] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[markAllNotificationsAsRead] Error marking all notifications as read:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking all notifications as read
 */
export const useMarkAllNotificationsAsRead = (
  options?: UseMutationOptions<ApiResponse, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse, Error, void>({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    ...options,
  });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id: number): Promise<ApiResponse> => {
  try {
    console.log('[deleteNotification] Deleting notification:', id);
    const route = buildRouteWithParams(`${API_ROUTES.NOTIFICATION.DELETE}/{id}`, { id });
    const response = await apiClient.delete(route);
    console.log('[deleteNotification] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[deleteNotification] Error deleting notification:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for deleting a notification
 */
export const useDeleteNotification = (
  options?: UseMutationOptions<ApiResponse, Error, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse, Error, number>({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    ...options,
  });
};

