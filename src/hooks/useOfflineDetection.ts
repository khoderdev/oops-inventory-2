import { useState, useEffect } from 'react';
import { isOnline, setupOfflineDetection } from '@/utils/offlineDetection';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for detecting offline status and showing appropriate notifications
 */
export function useOfflineDetection() {
  const [offline, setOffline] = useState(!isOnline());
  const { toast } = useToast();

  useEffect(() => {
    // Show initial offline status if needed
    if (offline) {
      toast({
        title: 'Offline Mode',
        description: 'You are currently offline. Using cached data.',
        variant: 'destructive',
        duration: 5000,
      });
    }

    // Set up listeners for online/offline events
    const cleanup = setupOfflineDetection(
      // Offline handler
      () => {
        setOffline(true);
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Using cached data.',
          variant: 'destructive',
          duration: 5000,
        });
      },
      // Online handler
      () => {
        setOffline(false);
        toast({
          title: 'Online Mode',
          description: 'You are back online. Data will be synced.',
          duration: 3000,
        });
      }
    );

    return cleanup;
  }, [toast]);

  return { offline };
}
