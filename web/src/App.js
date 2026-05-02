import React, {useEffect, useState} from 'react';
import './App.css';

const STATUS_URL = 'https://isandrewup.ajm501028.workers.dev/status';
const POLL_MS = 60_000;
const STALE_MS = 15 * 60_000;

export default function App() {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(STATUS_URL, { cache: 'no-store' });
        const data = await res.json();
        setStatus(data);
      } catch (ex) {
        console.error('failed to fetch status', ex);
        setStatus({ isAndrewUp: null, signals: {}, updatedAt: null });
      }
      setIsLoading(false);
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Is Andrew Up?</h1>
          <div className="loading-icon"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </header>
      </div>
    );
  }

  const updatedAt = status?.updatedAt ? new Date(status.updatedAt) : null;
  const isStale = !updatedAt || (Date.now() - updatedAt.getTime()) > STALE_MS;

  let answer;
  if (isStale || status?.isAndrewUp === null || status?.isAndrewUp === undefined) {
    answer = '¯\\_(ツ)_/¯';
  } else {
    answer = status.isAndrewUp ? 'Yes.' : 'No.';
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Is Andrew Up?</h1>
        <h2>{answer}</h2>
        <span style={{ fontSize: '10px' }}>
          {updatedAt ? `Last Updated: ${updatedAt.toLocaleString()}` : 'No data yet'}
        </span>
      </header>
    </div>
  );
}
