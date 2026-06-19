import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import apiClient, { ApiResponse, handleApiError } from '../utils/apiClient';
import { buildRewardClaimRoute } from '../queries/rewards.queries';

export interface ClaimRewardResponse {
  id: number;
  code: string;
  title: string;
  description: string;
  value: string;
  tierCode: string;
  status: string;
  fulfillmentType: string;
  amountNgn: number | null;
  categoryCode: string | null;
  dataHint: string | null;
  icon: string;
  claimedAt: string;
  expiresAt: string | null;
}

export const claimReward = async (rewardCode: string): Promise<ApiResponse<ClaimRewardResponse>> => {
  try {
    const response = await apiClient.post(buildRewardClaimRoute(rewardCode));
    return response.data;
  } catch (error: any) {
    console.error('[claimReward] Error:', error);
    throw handleApiError(error);
  }
};

export const useClaimReward = (
  options?: UseMutationOptions<ApiResponse<ClaimRewardResponse>, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ClaimRewardResponse>, Error, string>({
    mutationFn: claimReward,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'history'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};
