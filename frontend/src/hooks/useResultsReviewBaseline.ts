import type { PicrFile } from '@shared/types/picr';
import {
  resultsReviewSnapshot,
  type ResultsReviewSnapshot,
} from '../helpers/resultsReviewStatus';
import { useState } from 'react';

interface BaselineState {
  sessionKey: string;
  files: ReadonlyMap<string, ResultsReviewSnapshot>;
}

const emptyBaseline = new Map<string, ResultsReviewSnapshot>();

export const useResultsReviewBaseline = (
  sessionKey: string,
  files: readonly PicrFile[],
) => {
  const [state, setState] = useState<BaselineState>({
    sessionKey,
    files: emptyBaseline,
  });
  const sameSession = state.sessionKey === sessionKey;
  const missingFiles = files.filter(
    (file) => !sameSession || !state.files.has(file.id),
  );
  if (state.sessionKey !== sessionKey || missingFiles.length > 0) {
    const baseline = sameSession
      ? new Map(state.files)
      : new Map<string, ResultsReviewSnapshot>();
    for (const file of missingFiles) {
      baseline.set(file.id, resultsReviewSnapshot(file));
    }
    setState({ sessionKey, files: baseline });
    return baseline;
  }

  return state.files;
};
