import React from 'react';
import useOffline from '../hooks/useOffline';

const OfflineIndicator = () => {
  const {
    isOffline,
    pendingCount,
    syncStatus
  } = useOffline();

  const statusLabel = isOffline ? 'Offline' : 'Online';
  const statusDetail = () => {
    if (isOffline) {
      return pendingCount > 0
        ? `${pendingCount} meeting(s) saved locally`
        : 'Changes will save locally';
    }

    if (syncStatus === 'syncing') {
      return 'Syncing saved meetings...';
    }

    if (syncStatus === 'error') {
      return pendingCount > 0
        ? `Sync failed. ${pendingCount} pending`
        : 'Sync failed. Will retry.';
    }

    if (pendingCount > 0) {
      return `${pendingCount} meeting(s) pending sync`;
    }

    if (syncStatus === 'success') {
      return 'All meetings synced';
    }

    return 'All data is up to date';
  };

  return (
    <div style={styles.container}>
      <div style={styles.statusRow}>
        <span style={{
          ...styles.statusDot,
          backgroundColor: isOffline ? '#d32f2f' : '#2e7d32'
        }} />
        <span style={styles.statusLabel}>{statusLabel}</span>
      </div>
      <div style={styles.statusDetail}>{statusDetail()}</div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #000',
    borderRadius: '6px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    minWidth: '180px'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  statusLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statusDetail: {
    fontSize: '12px',
    color: '#444'
  }
};

export default OfflineIndicator;
