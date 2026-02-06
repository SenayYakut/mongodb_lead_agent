const isBrowser = typeof window !== 'undefined';

export const isOnline = () => {
  if (!isBrowser || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
};

export const onOnline = (callback) => {
  if (!isBrowser) {
    return () => {};
  }
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
};

export const onOffline = (callback) => {
  if (!isBrowser) {
    return () => {};
  }
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
};
