import { useGetPendingFriendRequestsQuery } from "@/lib/api";

export function usePendingFriendRequests() {
  const { data, isLoading, error, refetch } = useGetPendingFriendRequestsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds to check for new requests
  });

  const pendingRequests = data?.data || [];
  const pendingCount = pendingRequests.length;

  return {
    pendingRequests,
    pendingCount,
    isLoading,
    error,
    refetch,
  };
}