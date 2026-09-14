import type {
  MediaResultsInput,
  MediaResultsPageFragmentFragment,
} from '@shared/gql/graphql';
import { mediaResultsNextPageQuery } from '@shared/urql/queries/mediaResultsQuery';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Client } from 'urql';

type ResultsPage = MediaResultsPageFragmentFragment;

interface PageChainState {
  requestKey: string;
  cursors: string[];
  pages: ReadonlyMap<string, ResultsPage>;
  errors: ReadonlyMap<string, string>;
}

interface SeededPage {
  after: string;
  page: ResultsPage;
}

const emptyPages = new Map<string, ResultsPage>();
const emptyErrors = new Map<string, string>();

export const useSubscribedMediaResultPages = ({
  client,
  input,
  requestKey,
  selectionFingerprint,
  initialCursor,
  changedMessage,
}: {
  client: Client;
  input: MediaResultsInput;
  requestKey: string;
  selectionFingerprint?: string;
  initialCursor?: string;
  changedMessage: string;
}) => {
  const [state, setState] = useState<PageChainState>({
    requestKey,
    cursors: initialCursor ? [initialCursor] : [],
    pages: emptyPages,
    errors: emptyErrors,
  });
  const [retryVersion, setRetryVersion] = useState(0);
  const matchingState = state.requestKey === requestKey ? state : undefined;
  const initialCursors = useMemo(
    () => (initialCursor ? [initialCursor] : []),
    [initialCursor],
  );
  const cursors = matchingState?.cursors ?? initialCursors;
  const pages = matchingState?.pages ?? emptyPages;
  const errors = matchingState?.errors ?? emptyErrors;
  const cursorsKey = cursors.join('\u0000');

  useEffect(() => {
    if (!selectionFingerprint || cursors.length === 0) return;

    const subscriptions = cursors.map((after) =>
      client
        .query(
          mediaResultsNextPageQuery,
          { input: { ...input, after } },
          { requestPolicy: 'cache-first' },
        )
        .subscribe((result) => {
          setState((current) => {
            const base: PageChainState =
              current.requestKey === requestKey
                ? current
                : {
                    requestKey,
                    cursors,
                    pages: emptyPages,
                    errors: emptyErrors,
                  };
            const nextErrors = new Map(base.errors);
            if (result.error) {
              nextErrors.set(after, result.error.message);
              return { ...base, errors: nextErrors };
            }

            const connection = result.data?.mediaResults;
            if (!connection) return base;
            if (connection.selectionFingerprint !== selectionFingerprint) {
              nextErrors.set(after, changedMessage);
              return { ...base, errors: nextErrors };
            }

            nextErrors.delete(after);
            const nextPages = new Map(base.pages);
            nextPages.set(after, connection);
            return { ...base, pages: nextPages, errors: nextErrors };
          });
        }),
    );

    return () => subscriptions.forEach(({ unsubscribe }) => unsubscribe());
  }, [
    changedMessage,
    client,
    cursors,
    cursorsKey,
    input,
    requestKey,
    retryVersion,
    selectionFingerprint,
  ]);

  const requestPage = useCallback(
    (after: string) => {
      setState((current) => {
        const base: PageChainState =
          current.requestKey === requestKey
            ? current
            : {
                requestKey,
                cursors: initialCursor ? [initialCursor] : [],
                pages: emptyPages,
                errors: emptyErrors,
              };
        if (base.cursors.includes(after)) return base;
        return { ...base, cursors: [...base.cursors, after] };
      });
    },
    [initialCursor, requestKey],
  );

  const replacePages = useCallback(
    (seededPages: SeededPage[]) => {
      setState({
        requestKey,
        cursors: seededPages.map(({ after }) => after),
        pages: new Map(seededPages.map(({ after, page }) => [after, page])),
        errors: emptyErrors,
      });
    },
    [requestKey],
  );

  const retry = useCallback(() => setRetryVersion((value) => value + 1), []);
  const orderedPages = useMemo(
    () =>
      cursors.flatMap((cursor) => {
        const page = pages.get(cursor);
        return page ? [page] : [];
      }),
    [cursors, pages],
  );
  const lastCursor = cursors.at(-1);

  return {
    cursors,
    pages: orderedPages,
    errors,
    loading: !!lastCursor && !pages.has(lastCursor) && !errors.has(lastCursor),
    requestPage,
    replacePages,
    retry,
  };
};
