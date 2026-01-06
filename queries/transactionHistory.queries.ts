import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildApiUrl } from '../utils/apiConfig';

export interface GetTransactionHistoryParams {
  period?: 'D' | 'W' | 'M' | 'Custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  currency?: string;
  limit?: number;
  offset?: number;
  fiatLimit?: number;
  cryptoLimit?: number;
}

export const getTransactionHistory = async (
  params?: GetTransactionHistoryParams
): Promise<ApiResponse> => {
  try {
    console.log('[getTransactionHistory] Calling transaction history API with params:', JSON.stringify(params, null, 2));
    const url = buildApiUrl(API_ROUTES.TRANSACTION_HISTORY.GET_ALL, params as any);
    const response = await apiClient.get(url);
    console.log('[getTransactionHistory] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getTransactionHistory] Error fetching transaction history:', error);
    throw handleApiError(error);
  }
};

export const useGetTransactionHistory = (
  params?: GetTransactionHistoryParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', params],
    queryFn: () => getTransactionHistory(params),
    ...options,
  });
};

export interface GetDepositsParams {
  currency?: string;
  status?: string; // API expects lowercase: 'completed', 'pending', 'failed'
  type?: string; // API expects channel: 'bank_transfer', 'mobile_money', 'conversion', 'p2p'
  period?: string; // 'D', 'W', 'M', or 'Custom'
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Helper to map UI status to API status
export const mapStatusToAPI = (status: string): string | undefined => {
  if (status === 'All') return undefined;
  return status.toLowerCase();
};

// Helper to map UI type to API channel
export const mapTypeToAPI = (type: string): string | undefined => {
  if (type === 'All') return undefined;
  const typeMap: Record<string, string> = {
    'Bank Transfer': 'bank_transfer',
    'Mobile Money': 'mobile_money',
    'Conversion': 'conversion',
    'P2P Transaction': 'p2p',
  };
  return typeMap[type];
};

export const getDeposits = async (params?: GetDepositsParams): Promise<ApiResponse> => {
  try {
    // Map UI params to API params
    const apiParams: any = {};
    if (params?.currency && params.currency !== 'All') {
      apiParams.currency = params.currency;
    }
    if (params?.status) {
      const mappedStatus = mapStatusToAPI(params.status);
      if (mappedStatus) apiParams.status = mappedStatus;
    }
    if (params?.type) {
      const mappedType = mapTypeToAPI(params.type);
      if (mappedType) apiParams.type = mappedType;
    }
    if (params?.period) {
      apiParams.period = params.period;
    }
    if (params?.startDate) {
      apiParams.startDate = params.startDate;
    }
    if (params?.endDate) {
      apiParams.endDate = params.endDate;
    }
    if (params?.limit) {
      apiParams.limit = params.limit;
    }
    if (params?.offset) {
      apiParams.offset = params.offset;
    }

    console.log('[getDeposits] Calling deposits API with params:', JSON.stringify(apiParams, null, 2));
    const url = buildApiUrl(API_ROUTES.TRANSACTION_HISTORY.GET_DEPOSITS, apiParams);
    const response = await apiClient.get(url);
    console.log('[getDeposits] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getDeposits] Error fetching deposits:', error);
    throw handleApiError(error);
  }
};

export const useGetDeposits = (
  params?: GetDepositsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', 'deposits', params],
    queryFn: () => getDeposits(params),
    ...options,
  });
};

export interface GetWithdrawalsParams {
  currency?: string;
  status?: 'All' | 'Completed' | 'Pending' | 'Failed';
  type?: 'All' | 'Send' | 'Withdraw';
  period?: 'D' | 'W' | 'M' | 'Custom';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Helper to map UI status to API status for withdrawals
export const mapWithdrawalStatusToAPI = (status: string): string | undefined => {
  if (status === 'All') return undefined;
  // Map UI status to API status (lowercase)
  const statusMap: Record<string, string> = {
    'Completed': 'completed',
    'Pending': 'pending',
    'Failed': 'failed',
    'Successful': 'completed', // Also handle 'Successful' as 'completed'
  };
  return statusMap[status] || status.toLowerCase();
};

// Helper to map UI type to API type
export const mapWithdrawalTypeToAPI = (type: string): string | undefined => {
  if (type === 'All') return undefined;
  const typeMap: Record<string, string> = {
    'Withdraw': 'withdrawal',
    'Send': 'transfer',
  };
  return typeMap[type] || type.toLowerCase();
};

export const getWithdrawals = async (params?: GetWithdrawalsParams): Promise<ApiResponse> => {
  try {
    // Map UI params to API params
    const apiParams: any = {};
    if (params?.currency && params.currency !== 'All') {
      apiParams.currency = params.currency;
    }
    if (params?.status) {
      const mappedStatus = mapWithdrawalStatusToAPI(params.status);
      if (mappedStatus) apiParams.status = mappedStatus;
    }
    if (params?.type) {
      const mappedType = mapWithdrawalTypeToAPI(params.type);
      if (mappedType) apiParams.type = mappedType;
    }
    if (params?.period) {
      apiParams.period = params.period;
    }
    if (params?.startDate) {
      apiParams.startDate = params.startDate;
    }
    if (params?.endDate) {
      apiParams.endDate = params.endDate;
    }
    if (params?.limit) {
      apiParams.limit = params.limit;
    }
    if (params?.offset) {
      apiParams.offset = params.offset;
    }

    console.log('[getWithdrawals] Calling withdrawals API with params:', JSON.stringify(apiParams, null, 2));
    const url = buildApiUrl(API_ROUTES.TRANSACTION_HISTORY.GET_WITHDRAWALS, apiParams);
    const response = await apiClient.get(url);
    console.log('[getWithdrawals] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getWithdrawals] Error fetching withdrawals:', error);
    throw handleApiError(error);
  }
};

export const useGetWithdrawals = (
  params?: GetWithdrawalsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', 'withdrawals', params],
    queryFn: () => getWithdrawals(params),
    ...options,
  });
};

export interface GetP2PTransactionsParams {
  currency?: string;
  status?: 'All' | 'Completed' | 'Pending' | 'Failed';
  period?: 'D' | 'W' | 'M' | 'Custom';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const getP2PTransactions = async (params?: GetP2PTransactionsParams): Promise<ApiResponse> => {
  try {
    console.log('[getP2PTransactions] Calling P2P transactions API with params:', JSON.stringify(params, null, 2));
    const url = buildApiUrl(API_ROUTES.TRANSACTION_HISTORY.GET_P2P, params as any);
    const response = await apiClient.get(url);
    console.log('[getP2PTransactions] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getP2PTransactions] Error fetching P2P transactions:', error);
    throw handleApiError(error);
  }
};

export const useGetP2PTransactions = (
  params?: GetP2PTransactionsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', 'p2p', params],
    queryFn: () => getP2PTransactions(params),
    ...options,
  });
};

export interface GetBillPaymentsParams {
  currency?: string;
  status?: string; // API expects lowercase: 'completed', 'pending', 'failed'
  categoryCode?: string; // API expects: 'airtime', 'data', 'electricity', 'cable_tv', 'betting', 'internet'
  period?: string; // 'D', 'W', 'M', or 'Custom'
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Helper to map UI status to API status
export const mapBillPaymentStatusToAPI = (status: string): string | undefined => {
  if (!status || status === 'All') return undefined;
  const statusMap: { [key: string]: string } = {
    'Completed': 'completed',
    'Pending': 'pending',
    'Failed': 'failed',
  };
  return statusMap[status] || status.toLowerCase();
};

// Helper to map UI category/provider to API categoryCode
export const mapBillPaymentCategoryToAPI = (type: string): string | undefined => {
  if (!type || type === 'All') return undefined;
  const categoryMap: { [key: string]: string } = {
    'MTN': 'airtime', // Could be airtime or data
    'Airtel': 'airtime',
    'GLO': 'airtime',
    '9mobile': 'airtime',
    'DSTV': 'cable_tv',
    'GOTV': 'cable_tv',
    'EKEDC': 'electricity',
    'PHED': 'electricity',
    'Spectranet': 'internet',
  };
  return categoryMap[type];
};

export const getBillPayments = async (params?: GetBillPaymentsParams): Promise<ApiResponse> => {
  try {
    console.log('[getBillPayments] Calling bill payments API with params:', JSON.stringify(params, null, 2));
    // Build query string from params, filtering out undefined values
    const queryParams: any = {};
    if (params) {
      if (params.currency) queryParams.currency = params.currency;
      if (params.status) queryParams.status = params.status;
      if (params.categoryCode) queryParams.categoryCode = params.categoryCode;
      if (params.period) queryParams.period = params.period;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.offset !== undefined) queryParams.offset = params.offset;
    }
    
    const url = buildApiUrl(API_ROUTES.TRANSACTION_HISTORY.GET_BILL_PAYMENTS, queryParams);
    const response = await apiClient.get(url);
    console.log('[getBillPayments] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getBillPayments] Error fetching bill payments:', error);
    throw handleApiError(error);
  }
};

export const useGetBillPayments = (
  params?: GetBillPaymentsParams,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', 'bill-payments', params],
    queryFn: () => getBillPayments(params),
    ...options,
  });
};

export const getTransactionDetails = async (id: number): Promise<ApiResponse> => {
  try {
    console.log('[getTransactionDetails] Calling transaction details API for ID:', id);
    const url = buildApiUrl(`${API_ROUTES.TRANSACTION_HISTORY.GET_DETAILS}/${id}/details`);
    const response = await apiClient.get(url);
    console.log('[getTransactionDetails] Response received:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getTransactionDetails] Error fetching transaction details:', error);
    throw handleApiError(error);
  }
};

export const useGetTransactionDetails = (
  id: number,
  options?: UseQueryOptions<ApiResponse, Error>
) => {
  return useQuery<ApiResponse, Error>({
    queryKey: ['transaction-history', 'details', id],
    queryFn: () => getTransactionDetails(id),
    enabled: !!id,
    ...options,
  });
};

