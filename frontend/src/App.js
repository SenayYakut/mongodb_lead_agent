import React, { useState } from 'react';
import MeetingInput from './components/MeetingInput';
import GroupsView from './components/GroupsView';

/**
 * Main App Component
 */
function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMeetingSubmitted = () => {
    // Trigger refresh of groups view
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Networking Assistant</h1>
        <p style={styles.subtitle}>Multi-Agent System for Networking Management</p>
      </header>

      <main style={styles.main}>
        <MeetingInput onMeetingSubmitted={handleMeetingSubmitted} />
        <GroupsView key={refreshKey} />
      </main>

      <footer style={styles.footer}>
        <p>Powered by MongoDB Atlas & Multi-Agent System</p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '30px 20px',
    textAlign: 'center',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
  },
  main: {
    flex: 1,
    padding: '40px 20px',
  },
  footer: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    textAlign: 'center',
    borderTop: '1px solid #ddd',
    fontSize: '14px',
    color: '#666',
  },
};

export default App;
