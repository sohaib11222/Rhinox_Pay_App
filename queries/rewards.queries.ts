import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { API_ROUTES, buildRouteWithParams } from '../utils/apiConfig';

export interface RewardCriterion {
  id: string;
  label: string;
  current: number;
  target: number;
  progressText: string;
}

export interface RewardListItem {
  id: string;
  code: string;
  title: string;
  description: string;
  value: string;
  icon: string;
  tierCode: string;
  fulfillmentType: string;
  amountNgn: number | null;
  categoryCode: string | null;
  dataHint: string | null;
  claimId: number | null;
  claimStatus: 'none' | 'pending' | 'completed' | 'failed';
  isClaimed: boolean;
  canClaim: boolean;
}

export interface RewardsDashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl?: string | null;
    isVerified: boolean;
  };
  tier: {
    currentCode: string;
    currentName: string;
    nextCode: string | null;
    nextName: string | null;
    progressToNext: number;
    progressLabel: string;
    criteria: RewardCriterion[];
  };
  rewards: RewardListItem[];
}

export interface RewardHistoryItem {
  id: string;
  title: string;
  tier: string;
  status: 'Successful' | 'Pending' | 'Failed';
  value: string;
  expiryDate: string | null;
  date: string;
}

export interface RewardHistoryGroup {
  date: string;
  items: RewardHistoryItem[];
}

export const getRewardsDashboard = async (): Promise<ApiResponse<RewardsDashboardData>> => {
  try {
    const response = await apiClient.get(API_ROUTES.REWARDS.DASHBOARD);
    return response.data;
  } catch (error: any) {
    console.error('[getRewardsDashboard] Error:', error);
    throw handleApiError(error);
  }
};

export const getRewardsHistory = async (): Promise<ApiResponse<RewardHistoryGroup[]>> => {
  try {
    const response = await apiClient.get(API_ROUTES.REWARDS.HISTORY);
    return response.data;
  } catch (error: any) {
    console.error('[getRewardsHistory] Error:', error);
    throw handleApiError(error);
  }
};

export const useGetRewardsDashboard = (
  options?: UseQueryOptions<ApiResponse<RewardsDashboardData>, Error>
) => {
  return useQuery<ApiResponse<RewardsDashboardData>, Error>({
    queryKey: ['rewards', 'dashboard'],
    queryFn: getRewardsDashboard,
    ...options,
  });
};

export const useGetRewardsHistory = (
  options?: UseQueryOptions<ApiResponse<RewardHistoryGroup[]>, Error>
) => {
  return useQuery<ApiResponse<RewardHistoryGroup[]>, Error>({
    queryKey: ['rewards', 'history'],
    queryFn: getRewardsHistory,
    ...options,
  });
};

export const buildRewardClaimRoute = (rewardCode: string) =>
  buildRouteWithParams(API_ROUTES.REWARDS.CLAIM, { rewardCode });
