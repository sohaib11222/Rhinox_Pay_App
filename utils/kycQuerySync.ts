import { QueryClient } from '@tanstack/react-query';

export const invalidateKycAndUserQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] }),
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    queryClient.invalidateQueries({ queryKey: ['home'] }),
  ]);
};
