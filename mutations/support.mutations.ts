/**
 * Support Mutations
 * POST, PUT, DELETE requests for support chat endpoints
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';
import { uploadMultipartImage } from '../utils/multipartUpload';

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
    const response = await apiClient.post(API_ROUTES.SUPPORT.CREATE_CHAT, params);
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
  message?: string;
  imageUri?: string;
}

/**
 * Send a message in a support chat
 */
export const sendSupportMessage = async (
  chatId: number,
  params: SendSupportMessageParams
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`${API_ROUTES.SUPPORT.SEND_MESSAGE}/{id}/messages`, { id: chatId });

    if (params.imageUri) {
      return uploadMultipartImage({
        route,
        fileField: 'image',
        imageUri: params.imageUri,
        fields: {
          message: params.message?.trim() || '',
        },
      });
    }

    if (!params.message?.trim()) {
      throw new Error('Message is required');
    }

    const response = await apiClient.post(route, { message: params.message.trim() });
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
    const route = buildRouteWithParams(`${API_ROUTES.SUPPORT.MARK_MESSAGES_READ}/{id}/messages/read`, { id: chatId });
    const response = await apiClient.put(route);
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

