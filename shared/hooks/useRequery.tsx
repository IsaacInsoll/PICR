import { useEffect } from 'react';
import type { UseQueryExecute } from 'urql';

// Update GraphQL query results at specified interval
// On web, skips requery when the tab is not visible
export const useRequery = (reQuery: UseQueryExecute, ms?: number) => {
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        typeof document === 'undefined' ||
        !document.visibilityState ||
        document.visibilityState == 'visible'
      )
        reQuery({ requestPolicy: 'cache-and-network' });
    }, ms ?? 5000);
    return () => clearInterval(timer);
  }, [reQuery, ms]);
};
