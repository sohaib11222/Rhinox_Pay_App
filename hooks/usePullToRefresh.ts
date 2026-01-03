import { useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  refreshDelay?: number;
}

interface UsePullToRefreshReturn {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Custom hook for pull-to-refresh functionality
 * Can be used with ScrollView, FlatList, or any scrollable component
 * 
 * @param options - Configuration options
 * @param options.onRefresh - Async function to call when refresh is triggered
 * @param options.refreshDelay - Minimum delay in milliseconds before refresh completes (default: 2000)
 * @returns Object containing refreshing state and onRefresh handler
 * 
 * @example
 * ```tsx
 * const { refreshing, onRefresh } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   },
 *   refreshDelay: 2000
 * });
 * 
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   }
 * >
 *   ...
 * </ScrollView>
 * ```
 */
export const usePullToRefresh = (
  options: UsePullToRefreshOptions = {}
): UsePullToRefreshReturn => {
  const { onRefresh: onRefreshCallback, refreshDelay = 2000 } = options;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);

    try {
      // Call the provided refresh callback
      if (onRefreshCallback) {
        const result = onRefreshCallback();
        // If it's a promise, wait for it
        if (result instanceof Promise) {
          await result;
        }
      }

      // Ensure minimum refresh delay for better UX
      const delayPromise = new Promise((resolve) =>
        setTimeout(resolve, refreshDelay)
      );
      await delayPromise;
    } catch (error) {
      console.error('Error during refresh:', error);
      // Still wait for minimum delay even on error
      await new Promise((resolve) => setTimeout(resolve, refreshDelay));
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefreshCallback, refreshDelay]);

  return {
    refreshing,
    onRefresh,
  };
};

