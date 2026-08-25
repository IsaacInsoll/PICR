import { useEffect, useState } from 'react';

export const useNow = (refreshIntervalMs: number): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      refreshIntervalMs,
    );
    return () => window.clearInterval(interval);
  }, [refreshIntervalMs]);

  return now;
};
