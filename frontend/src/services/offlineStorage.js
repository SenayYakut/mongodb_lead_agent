const DB_NAME = 'networking-assistant-offline';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
const QUEUE_KEY = 'offline_meeting_queue';

const isBrowser = typeof window !== 'undefined';
const hasIndexedDb = isBrowser && typeof window.indexedDB !== 'undefined';

const getQueue = () => {
  if (!isBrowser) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('[OFFLINE] Failed to read queue:', error);
    return [];
  }
};

const setQueue = (queue) => {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('[OFFLINE] Failed to persist queue:', error);
  }
};

const openDb = () => new Promise((resolve, reject) => {
  if (!hasIndexedDb) {
    reject(new Error('IndexedDB is not available'));
    return;
  }

  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

let dbPromise = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDb();
  }
  return dbPromise;
};

const runStoreOp = async (mode, operation) => {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let request;

    try {
      request = operation(store);
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error || request?.error);
    transaction.onabort = () => reject(transaction.error || request?.error);
  });
};

const normalizePhotoFiles = (photos = []) => (
  photos
    .map((photo) => (photo && photo.file ? photo.file : photo))
    .filter(Boolean)
);

export const isOfflineStorageSupported = () => isBrowser && hasIndexedDb;

export const storeMeeting = async ({ text, location, audioBlob, photos }) => {
  if (!isOfflineStorageSupported()) {
    throw new Error('Offline storage is not supported in this browser.');
  }

  const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    createdAt: new Date().toISOString(),
    text: text || '',
    location: location || '',
    hasAudio: Boolean(audioBlob),
    photoCount: Array.isArray(photos) ? photos.length : 0,
    status: 'pending'
  };

  const record = {
    id,
    audioBlob: audioBlob || null,
    photos: normalizePhotoFiles(photos)
  };

  await runStoreOp('readwrite', (store) => store.put(record));

  const queue = getQueue();
  queue.push(entry);
  setQueue(queue);

  return entry;
};

export const getPendingMeetings = async () => (
  getQueue().filter((entry) => entry.status === 'pending')
);

export const getMeetingFiles = async (id) => {
  const record = await runStoreOp('readonly', (store) => store.get(id));
  return {
    audioBlob: record?.audioBlob || null,
    photos: record?.photos || []
  };
};

export const markAsSynced = async (id) => {
  const queue = getQueue();
  const updatedQueue = queue.map((entry) => (
    entry.id === id
      ? { ...entry, status: 'synced', syncedAt: new Date().toISOString() }
      : entry
  ));

  setQueue(updatedQueue);
  await runStoreOp('readwrite', (store) => store.delete(id));
};

export const clearSyncedMeetings = () => {
  const updatedQueue = getQueue().filter((entry) => entry.status !== 'synced');
  setQueue(updatedQueue);
  return updatedQueue.length;
};

export const clearAllOfflineMeetings = async () => {
  setQueue([]);
  if (isOfflineStorageSupported()) {
    await runStoreOp('readwrite', (store) => store.clear());
  }
};
