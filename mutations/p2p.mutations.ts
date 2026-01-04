/**
 * P2P Mutations
 * POST/PUT/DELETE requests for P2P-related endpoints
 */

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

/**
 * Create order from ad (USER)
 */
export interface CreateOrderRequest {
  adId: string;
  cryptoAmount: string;
  paymentMethodId: string;
}

export const createP2POrder = async (data: CreateOrderRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.P2P_USER.CREATE_ORDER, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating P2P order
 */
export const useCreateP2POrder = (
  options?: UseMutationOptions<ApiResponse, Error, CreateOrderRequest>
) => {
  return useMutation<ApiResponse, Error, CreateOrderRequest>({
    mutationFn: createP2POrder,
    ...options,
  });
};

/**
 * Cancel order (USER)
 */
export const cancelUserOrder = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/user/orders/{id}/cancel`, {
      id: orderId,
    });
    const response = await apiClient.post(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for canceling user order
 */
export const useCancelUserOrder = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: cancelUserOrder,
    ...options,
  });
};

/**
 * Mark payment made (BUYER)
 */
export interface PaymentMadeRequest {
  orderId: string;
  paymentProof?: string;
}

export const markPaymentMade = async (data: PaymentMadeRequest): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{id}/buyer/payment-made`, {
      id: data.orderId,
    });
    const response = await apiClient.post(route, { paymentProof: data.paymentProof });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking payment made
 */
export const useMarkPaymentMade = (
  options?: UseMutationOptions<ApiResponse, Error, PaymentMadeRequest>
) => {
  return useMutation<ApiResponse, Error, PaymentMadeRequest>({
    mutationFn: markPaymentMade,
    ...options,
  });
};

/**
 * Mark payment received (USER when selling)
 */
export interface PaymentReceivedRequest {
  orderId: string;
  confirmed: boolean;
}

export const markPaymentReceived = async (
  data: PaymentReceivedRequest
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/user/orders/{id}/payment-received`, {
      id: data.orderId,
    });
    const response = await apiClient.post(route, { confirmed: data.confirmed });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking payment received
 */
export const useMarkPaymentReceived = (
  options?: UseMutationOptions<ApiResponse, Error, PaymentReceivedRequest>
) => {
  return useMutation<ApiResponse, Error, PaymentReceivedRequest>({
    mutationFn: markPaymentReceived,
    ...options,
  });
};

/**
 * Create BUY ad (VENDOR)
 */
export interface CreateBuyAdRequest {
  cryptoCurrency: string;
  fiatCurrency: string;
  price: string;
  volume: string;
  minOrder: string;
  maxOrder: string;
  autoAccept: boolean;
  paymentMethodIds: string[];
  countryCode: string;
  description?: string;
}

export const createBuyAd = async (data: CreateBuyAdRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.P2P_VENDOR_ADS.CREATE_BUY_AD, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating buy ad
 */
export const useCreateBuyAd = (
  options?: UseMutationOptions<ApiResponse, Error, CreateBuyAdRequest>
) => {
  return useMutation<ApiResponse, Error, CreateBuyAdRequest>({
    mutationFn: createBuyAd,
    ...options,
  });
};

/**
 * Create SELL ad (VENDOR)
 */
export interface CreateSellAdRequest {
  cryptoCurrency: string;
  fiatCurrency: string;
  price: string;
  volume: string;
  minOrder: string;
  maxOrder: string;
  autoAccept: boolean;
  paymentMethodIds: string[];
  countryCode: string;
  description?: string;
}

export const createSellAd = async (data: CreateSellAdRequest): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(API_ROUTES.P2P_VENDOR_ADS.CREATE_SELL_AD, data);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating sell ad
 */
export const useCreateSellAd = (
  options?: UseMutationOptions<ApiResponse, Error, CreateSellAdRequest>
) => {
  return useMutation<ApiResponse, Error, CreateSellAdRequest>({
    mutationFn: createSellAd,
    ...options,
  });
};

/**
 * Update ad (VENDOR)
 */
export interface UpdateAdRequest {
  adId: string;
  price?: string;
  volume?: string;
  minOrder?: string;
  maxOrder?: string;
  autoAccept?: boolean;
  paymentMethodIds?: string[];
  countryCode?: string;
  description?: string;
}

export const updateP2PAd = async (data: UpdateAdRequest): Promise<ApiResponse> => {
  try {
    const { adId, ...updateData } = data;
    const route = buildRouteWithParams(`/p2p/ads/{id}`, {
      id: adId,
    });
    const response = await apiClient.put(route, updateData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for updating ad
 */
export const useUpdateP2PAd = (
  options?: UseMutationOptions<ApiResponse, Error, UpdateAdRequest>
) => {
  return useMutation<ApiResponse, Error, UpdateAdRequest>({
    mutationFn: updateP2PAd,
    ...options,
  });
};

/**
 * Update ad status (VENDOR)
 */
export interface UpdateAdStatusRequest {
  adId: string;
  status: string;
  isOnline: boolean;
}

export const updateP2PAdStatus = async (data: UpdateAdStatusRequest): Promise<ApiResponse> => {
  try {
    const { adId, ...statusData } = data;
    const route = buildRouteWithParams(`/p2p/ads/{id}/status`, { id: adId });
    const response = await apiClient.put(route, statusData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for updating ad status
 */
export const useUpdateP2PAdStatus = (
  options?: UseMutationOptions<ApiResponse, Error, UpdateAdStatusRequest>
) => {
  return useMutation<ApiResponse, Error, UpdateAdStatusRequest>({
    mutationFn: updateP2PAdStatus,
    ...options,
  });
};

/**
 * Accept order (VENDOR)
 */
export const acceptOrder = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{id}/vendor/accept`, { id: orderId });
    const response = await apiClient.post(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for accepting order
 */
export const useAcceptOrder = (options?: UseMutationOptions<ApiResponse, Error, string>) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: acceptOrder,
    ...options,
  });
};

/**
 * Decline order (VENDOR)
 */
export const declineOrder = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{id}/vendor/decline`, { id: orderId });
    const response = await apiClient.post(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for declining order
 */
export const useDeclineOrder = (options?: UseMutationOptions<ApiResponse, Error, string>) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: declineOrder,
    ...options,
  });
};

/**
 * Cancel order (VENDOR)
 */
export const cancelVendorOrder = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/vendor/orders/{id}/cancel`, {
      id: orderId,
    });
    const response = await apiClient.post(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for canceling vendor order
 */
export const useCancelVendorOrder = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: cancelVendorOrder,
    ...options,
  });
};

/**
 * Mark payment made (VENDOR when buying)
 */
export interface VendorPaymentMadeRequest {
  orderId: string;
  paymentProof?: string;
}

export const markVendorPaymentMade = async (
  data: VendorPaymentMadeRequest
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/vendor/orders/{id}/payment-made`, {
      id: data.orderId,
    });
    const response = await apiClient.post(route, { paymentProof: data.paymentProof });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking vendor payment made
 */
export const useMarkVendorPaymentMade = (
  options?: UseMutationOptions<ApiResponse, Error, VendorPaymentMadeRequest>
) => {
  return useMutation<ApiResponse, Error, VendorPaymentMadeRequest>({
    mutationFn: markVendorPaymentMade,
    ...options,
  });
};

/**
 * Mark payment received (VENDOR when selling)
 */
export interface VendorPaymentReceivedRequest {
  orderId: string;
  confirmed: boolean;
}

export const markVendorPaymentReceived = async (
  data: VendorPaymentReceivedRequest
): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{id}/vendor/payment-received`, {
      id: data.orderId,
    });
    const response = await apiClient.post(route, { confirmed: data.confirmed });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking vendor payment received
 */
export const useMarkVendorPaymentReceived = (
  options?: UseMutationOptions<ApiResponse, Error, VendorPaymentReceivedRequest>
) => {
  return useMutation<ApiResponse, Error, VendorPaymentReceivedRequest>({
    mutationFn: markVendorPaymentReceived,
    ...options,
  });
};

/**
 * Send message in order chat
 */
export interface SendMessageRequest {
  orderId: string;
  message: string;
}

export const sendP2PMessage = async (data: SendMessageRequest): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{orderId}/messages`, {
      orderId: data.orderId,
    });
    const response = await apiClient.post(route, { message: data.message });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for sending P2P message
 */
export const useSendP2PMessage = (
  options?: UseMutationOptions<ApiResponse, Error, SendMessageRequest>
) => {
  return useMutation<ApiResponse, Error, SendMessageRequest>({
    mutationFn: sendP2PMessage,
    ...options,
  });
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (orderId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{orderId}/messages/read`, { orderId });
    const response = await apiClient.put(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for marking messages as read
 */
export const useMarkMessagesAsRead = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: markMessagesAsRead,
    ...options,
  });
};

/**
 * Create review for completed order
 */
export interface CreateReviewRequest {
  orderId: string;
  type: 'positive' | 'negative';
  comment?: string;
}

export const createP2PReview = async (data: CreateReviewRequest): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/orders/{orderId}/review`, {
      orderId: data.orderId,
    });
    const { orderId, ...reviewData } = data;
    const response = await apiClient.post(route, reviewData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for creating review
 */
export const useCreateP2PReview = (
  options?: UseMutationOptions<ApiResponse, Error, CreateReviewRequest>
) => {
  return useMutation<ApiResponse, Error, CreateReviewRequest>({
    mutationFn: createP2PReview,
    ...options,
  });
};

/**
 * Update review
 */
export interface UpdateReviewRequest {
  reviewId: string;
  type?: 'positive' | 'negative';
  comment?: string;
}

export const updateP2PReview = async (data: UpdateReviewRequest): Promise<ApiResponse> => {
  try {
    const { reviewId, ...updateData } = data;
    const route = buildRouteWithParams(`/p2p/reviews/{id}`, { id: reviewId });
    const response = await apiClient.put(route, updateData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for updating review
 */
export const useUpdateP2PReview = (
  options?: UseMutationOptions<ApiResponse, Error, UpdateReviewRequest>
) => {
  return useMutation<ApiResponse, Error, UpdateReviewRequest>({
    mutationFn: updateP2PReview,
    ...options,
  });
};

/**
 * Delete review
 */
export const deleteP2PReview = async (reviewId: string): Promise<ApiResponse> => {
  try {
    const route = buildRouteWithParams(`/p2p/reviews/{id}`, { id: reviewId });
    const response = await apiClient.delete(route);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

/**
 * Mutation hook for deleting review
 */
export const useDeleteP2PReview = (
  options?: UseMutationOptions<ApiResponse, Error, string>
) => {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: deleteP2PReview,
    ...options,
  });
};

