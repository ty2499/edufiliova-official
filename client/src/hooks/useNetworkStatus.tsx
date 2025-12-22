import { useState, useEffect } from 'react';
import { addNetworkListeners, isOnline } from '@/utils/networkDetection';

export const useNetworkStatus = () => {
  const [online, setOnline] = useState<boolean>(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    const cleanup = addNetworkListeners(handleOnline, handleOffline);

    return cleanup;
  }, []);

  return { online };
};
