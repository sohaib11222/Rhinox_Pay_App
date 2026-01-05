/**
 * Support Mutations
 * POST, PUT, DELETE requests for support chat endpoints
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

export interface CreateSupportChatParams {
  name: string;
  email: string;
  reason: string;
}

/**
 * Create a new support chat
 */
export const createSupportChat = async (params: CreateSupportChatParams): Promise<ApiResponse> => {
  try {
    console.log('[createSupportChat] Creating support chat with params:', JSON.stringify(params, null, 2));
    const response = await apiClient.post(API_ROUTES.SUPPORT.CREATE_CHAT, params);
    console.log('[createSupportChat] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[createSupportChat] Error creating support chat:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating a support chat
 */
export const useCreateSupportChat = (
  options?: UseMutationOptions<ApiResponse, Error, CreateSupportChatParams>
) => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse, Error, CreateSupportChatParams>({
    mutationFn: createSupportChat,
    onSuccess: () => {
      // Invalidate and refetch support chats
      queryClient.invalidateQueries({ queryKey: ['support', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
    },
    ...options,
  });
};

export interface SendSupportMessageParams {
  message: string;
}

/**
 * Send a message in a support chat
 */
export const sendSupportMessage = async (
  chatId: number,
  params: SendSupportMessageParams
): Promise<ApiResponse> => {
  try {
    console.log('[sendSupportMessage] Sending message to chat:', chatId, 'with params:', JSON.stringify(params, null, 2));
    const route = buildRouteWithParams(`${API_ROUTES.SUPPORT.SEND_MESSAGE}/{id}/messages`, { id: chatId });
    const response = await apiClient.post(route, params);
    console.log('[sendSupportMessage] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[sendSupportMessage] Error sending support message:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for sending a support message
 */
export const useSendSupportMessage = (
  chatId: number,
  options?: UseMutationOptions<ApiResponse, Error, SendSupportMessageParams>
) => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse, Error, SendSupportMessageParams>({
    mutationFn: (params) => sendSupportMessage(chatId, params),
    onSuccess: () => {
      // Invalidate and refetch chat details and chats list
      queryClient.invalidateQueries({ queryKey: ['support', 'chats', chatId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
    },
    ...options,
  });
};

/**
 * Mark messages as read in a support chat
 */
export const markSupportMessagesRead = async (chatId: number): Promise<ApiResponse> => {
  try {
    console.log('[markSupportMessagesRead] Marking messages as read for chat:', chatId);
    const route = buildRouteWithParams(`${API_ROUTES.SUPPORT.MARK_MESSAGES_READ}/{id}/messages/read`, { id: chatId });
    const response = await apiClient.put(route);
    console.log('[markSupportMessagesRead] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[markSupportMessagesRead] Error marking support messages as read:', error);
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking support messages as read
 */
export const useMarkSupportMessagesRead = (
  chatId: number,
  options?: UseMutationOptions<ApiResponse, Error, void>
) => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse, Error, void>({
    mutationFn: () => markSupportMessagesRead(chatId),
    onSuccess: () => {
      // Invalidate and refetch chat details and unread count
      queryClient.invalidateQueries({ queryKey: ['support', 'chats', chatId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
    },
    ...options,
  });
};

