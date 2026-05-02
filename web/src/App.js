import React, {useEffect, useState} from 'react';
import './App.css';

const STATUS_URL = 'https://isandrewup.ajm501028.workers.dev/status';
const POLL_MS = 60_000;
const STALE_MS = 15 * 60_000;

function formatDuration(since) {
  if (!since) return null;
  const ms = Date.now() - new Date(since).getTime();
  if (ms < 60_000) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatBattery(signals) {
  const level = signals?.batteryLevel;
  const state = signals?.batteryState;
  const charger = signals?.chargerType;
  if (typeof level !== 'number') return null;
  let suffix = '';
  if (state === 'charging' && charger && charger !== 'none') {
    suffix = ` (charging via ${charger})`;
  } else if (state === 'charging') {
    suffix = ' (charging)';
  } else if (state === 'full') {
    suffix = ' (full)';
  }
  return `${level}%${suffix}`;
}

function formatNextAlarm(value) {
  if (!value || value === 'unavailable' || value === 'unknown' || value === 'none') return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(STATUS_URL, { cache: 'no-store' });
        const data = await res.json();
        setStatus(data);
      } catch (ex) {
        console.error('failed to fetch status', ex);
        setStatus({ isAndrewUp: null, signals: {}, updatedAt: null, awakeSince: null });
      }
      setIsLoading(false);
    }

    fetchStatus();
    const poll = setInterval(fetchStatus, POLL_MS);
    const tick = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
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

  const awakeFor = !isStale && status?.isAndrewUp === true ? formatDuration(status?.awakeSince) : null;
  const asleepFor = !isStale && status?.isAndrewUp === false ? formatDuration(status?.asleepSince) : null;
  const battery = !isStale ? formatBattery(status?.signals) : null;
  const nextAlarm = !isStale && status?.isAndrewUp === false ? formatNextAlarm(status?.signals?.nextAlarm) : null;
  const hasDetails = awakeFor || asleepFor || battery || nextAlarm;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Is Andrew Up?</h1>
        <h2>{answer}</h2>
        {hasDetails && (
          <div className="details">
            {awakeFor && <div>Awake for {awakeFor}</div>}
            {asleepFor && <div>Asleep for {asleepFor}</div>}
            {battery && <div>Battery: {battery}</div>}
            {nextAlarm && <div>Next alarm: {nextAlarm}</div>}
          </div>
        )}
        <span style={{ fontSize: '10px', marginTop: 12 }}>
          {updatedAt ? `Last Updated: ${updatedAt.toLocaleString()}` : 'No data yet'}
        </span>
      </header>
    </div>
  );
}
