import { submitMeeting } from './api';
import { getPendingMeetings, getMeetingFiles, markAsSynced } from './offlineStorage';

let syncInProgress = false;

const normalizePhotoPayload = (photos = []) => (
  photos.map((file) => ({ file }))
);

export const syncPendingMeetings = async (onStatus) => {
  if (syncInProgress) {
    return { status: 'in_progress', syncedCount: 0 };
  }

  const pending = await getPendingMeetings();
  if (pending.length === 0) {
    if (onStatus) {
      onStatus('idle');
    }
    return { status: 'empty', syncedCount: 0 };
  }

  syncInProgress = true;
  if (onStatus) {
    onStatus('syncing');
  }

  let syncedCount = 0;

  try {
    for (const entry of pending) {
      const files = await getMeetingFiles(entry.id);
      const audioBlob = files?.audioBlob || null;
      const photos = normalizePhotoPayload(files?.photos || []);

      await submitMeeting(entry.text, entry.location || null, audioBlob, photos);
      await markAsSynced(entry.id);
      syncedCount += 1;
    }

    if (onStatus) {
      onStatus('success');
    }

    return { status: 'success', syncedCount };
  } catch (error) {
    if (onStatus) {
      onStatus('error');
    }
    throw error;
  } finally {
    syncInProgress = false;
  }
};

export const startSync = async (onStatus) => syncPendingMeetings(onStatus);

export const retryFailedSyncs = async (onStatus) => syncPendingMeetings(onStatus);
