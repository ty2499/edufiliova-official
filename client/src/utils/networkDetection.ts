export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const addNetworkListeners = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

export const checkNetworkAndNavigate = (
  navigateToError: (errorType: string) => void
) => {
  if (!navigator.onLine) {
    navigateToError('error-500');
    return false;
  }
  return true;
};
