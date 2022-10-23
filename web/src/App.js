import React, {useEffect, useState} from 'react';
import './App.css';

export default function App() {
  const [isAndrewUp, setIsAndrewUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLastFetched, setTimeLastFetched] = useState(undefined);

  useEffect(() => {
    async function fetchAndSetWakeStatus() {
      let url = 'https://firebasestorage.googleapis.com/v0/b/isandrewup.appspot.com/o/data.json?alt=media';

      setIsLoading(true);

      const result = await fetch(url);

      try {
        const jsonResult = await result.json();

        setIsAndrewUp((jsonResult && jsonResult.isAndrewUp) || false);
      } catch (ex) {
        // defaults to me being asleep if something goes wrong
        setIsAndrewUp(false);

        console.error('call to firebase failed', ex);
      }

      setIsLoading(false);
      setTimeLastFetched(new Date());
    };

    fetchAndSetWakeStatus();

    const interval = setInterval(() => fetchAndSetWakeStatus(), 300000);

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

  let lastFetched = timeLastFetched;
  if (lastFetched === undefined) {
    lastFetched = new Date();
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Is Andrew Up?</h1>
        <h2>{isAndrewUp ? 'Yes.' : 'No.'}</h2>
        <span style={{ fontSize: '10px' }}>Last Fetched: {lastFetched.toLocaleString()}</span>
      </header>
    </div>
  );
}