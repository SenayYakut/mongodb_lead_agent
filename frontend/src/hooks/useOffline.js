import { useCallback, useEffect, useState } from 'react';
import { getPendingMeetings } from '../services/offlineStorage';
import { isOnline, onOffline, onOnline } from '../utils/networkDetector';
import { startSync } from '../services/syncService';

const QUEUE_KEY = 'offline_meeting_queue';

const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle');

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await getPendingMeetings();
      setPendingCount(pending.length);
    } catch (error) {
      console.warn('[OFFLINE] Failed to read pending count:', error);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('idle');
    };

    const unsubscribeOnline = onOnline(handleOnline);
    const unsubscribeOffline = onOffline(handleOffline);

    return () => {
      if (unsubscribeOnline) {
        unsubscribeOnline();
      }
      if (unsubscribeOffline) {
        unsubscribeOffline();
      }
    };
  }, [refreshPendingCount]);

  useEffect(() => {
    if (isOffline) {
      return;
    }

    const syncNow = async () => {
      try {
        await startSync(setSyncStatus);
      } catch (error) {
        console.warn('[OFFLINE] Sync failed:', error);
      } finally {
        refreshPendingCount();
      }
    };

    syncNow();
  }, [isOffline, refreshPendingCount]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorage = (event) => {
      if (event.key === QUEUE_KEY) {
        refreshPendingCount();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshPendingCount]);

  return {
    isOffline,
    pendingCount,
    syncStatus,
    refreshPendingCount
  };
};

export default useOffline;
