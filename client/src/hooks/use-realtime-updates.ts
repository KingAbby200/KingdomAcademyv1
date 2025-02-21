import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { socket } from '@/lib/socket';

export function useRealtimeUpdates(queryKey: string | string[]) {
  const queryClient = useQueryClient();
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  useEffect(() => {
    // Listen for content updates
    socket.on('content:update', (data: { type: string; id?: string | number }) => {
      // Invalidate relevant queries based on the update type
      if (data.type === normalizedQueryKey[0]) {
        queryClient.invalidateQueries({ queryKey: normalizedQueryKey });
      }
    });

    // Add focus detection for app updates
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: normalizedQueryKey });
      }
    };

    // Add route change detection
    const handleRouteChange = () => {
      queryClient.invalidateQueries({ queryKey: normalizedQueryKey });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      socket.off('content:update');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [queryClient, normalizedQueryKey]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: normalizedQueryKey });
  };

  return { refresh };
}