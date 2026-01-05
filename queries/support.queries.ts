/**
 * Support Queries
 * GET requests for support chat endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl, buildRouteWithParams } from '../utils/apiConfig';

export interface GetSupportChatsParams {
  status?: 'active' | 'resolved' | 'appealed' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Get all support chats for the user
 */
export const getSupportChats = async (params?: GetSupportChatsParams): Promise<ApiResponse> => {
  try {
    console.log('[getSupportChats] Calling support chats API with params:', JSON.stringify(params, null, 2));
    const apiParams: any = {};
    if (params?.status && params.status !== 'all') {
      apiParams.status = params.status;
    }
    if (params?.limit) {
      apiParams.limit = params.limit;
    }
    if (params?.offset) {
      apiParams.offset = params.offset;
    }
    const url = buildApiUrl(API_ROUTES.SUPPORT.GET_CHATS, apiParams);
    const response = await apiClient.get(url);
    console.log('[getSupportChats] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getSupportChats] Error fetching support chats:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting support chats
 */
export const useGetSupportChats = (
  params?: GetSupportChatsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['support', 'chats', params],
    queryFn: () => getSupportChats(params),
    ...options,
  });
};

/**
 * Get support chat details with messages
 */
export const getSupportChatDetails = async (chatId: number): Promise<ApiResponse> => {
  try {
    console.log('[getSupportChatDetails] Calling support chat details API for ID:', chatId);
    const route = buildRouteWithParams(`${API_ROUTES.SUPPORT.GET_CHAT_DETAILS}/{id}`, { id: chatId });
    const response = await apiClient.get(route);
    console.log('[getSupportChatDetails] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getSupportChatDetails] Error fetching support chat details:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting support chat details
 */
export const useGetSupportChatDetails = (
  chatId: number,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['support', 'chats', chatId, 'details'],
    queryFn: () => getSupportChatDetails(chatId),
    enabled: !!chatId,
    ...options,
  });
};

/**
 * Get unread message count
 */
export const getSupportUnreadCount = async (): Promise<ApiResponse> => {
  try {
    console.log('[getSupportUnreadCount] Calling support unread count API');
    const response = await apiClient.get(API_ROUTES.SUPPORT.GET_UNREAD_COUNT);
    console.log('[getSupportUnreadCount] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getSupportUnreadCount] Error fetching support unread count:', error);
    throw handleApiError(error);
  }
};

/**
 * Query hook for getting support unread count
 */
export const useGetSupportUnreadCount = (
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['support', 'unread-count'],
    queryFn: getSupportUnreadCount,
    ...options,
  });
};

