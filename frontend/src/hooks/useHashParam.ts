import { useCallback } from 'react';
import { useLocation } from 'react-router';
import { readHashParam, withHashParam } from '../helpers/hashParams';
import { useHashNavigation } from './useHashNavigation';

// All hash writes go through React Router so useLocation remains authoritative
// for modal, sort and view state. Replacing preference changes keeps them out of
// browser history while preserving modal/lightbox history markers.
export const useHashParam = (key: string) => {
  const location = useLocation();
  const { navigateHash } = useHashNavigation();
  const value = readHashParam(location.hash, key);
  const setValue = useCallback(
    (nextValue?: string) => {
      navigateHash((current) => ({
        hash: withHashParam(current.hash, key, nextValue),
        replace: true,
        state: current.state,
      }));
    },
    [key, navigateHash],
  );

  return [value, setValue] as const;
};
