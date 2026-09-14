import {
  defaultGalleryFilterCriteria,
  mediaCriteriaEqual,
  normalizeGalleryFilterCriteria,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import { filterOptions } from '@shared/filterAtom';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  decodeGalleryLocationCriteria,
  withGalleryLocationCriteria,
} from '../helpers/galleryCriteriaSearchParams';
import { useCommentPermissions } from './useCommentPermissions';
import { useLocationNavigation } from './useLocationNavigation';

export const galleryResultsHistoryState = (state: unknown) => ({
  ...(typeof state === 'object' && state !== null ? state : {}),
  galleryResultsOpened: true,
  galleryResultsOpenedAt: Date.now(),
});

export const wasGalleryResultsOpenedInCurrentDocument = (state: unknown) => {
  if (
    typeof state !== 'object' ||
    state === null ||
    !('galleryResultsOpened' in state) ||
    (state as { galleryResultsOpened?: unknown }).galleryResultsOpened !== true
  ) {
    return false;
  }

  const openedAt = (state as { galleryResultsOpenedAt?: unknown })
    .galleryResultsOpenedAt;
  return (
    typeof openedAt === 'number' &&
    typeof performance !== 'undefined' &&
    openedAt >= performance.timeOrigin
  );
};

export const useGalleryCriteria = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canView } = useCommentPermissions();
  const capabilities = useMemo(() => ({ canViewReview: canView }), [canView]);
  const { getCurrentLocation, navigateLocation } = useLocationNavigation();
  const [, setLegacyFilters] = useAtom(filterOptions);
  const decoded = useMemo(
    () => decodeGalleryLocationCriteria(location.search, capabilities),
    [capabilities, location.search],
  );
  const filters = useMemo<GalleryFilterCriteria>(
    () => ({ ...decoded.filters, searchText: '' }),
    [decoded.filters],
  );

  // The URL is authoritative for structured filters. Keep the legacy atom as a
  // compatibility mirror until the CSV flow is migrated, without making
  // Back/Forward wait for an effect before rendering. Free text belongs only to
  // recursive Results and is never mirrored into the local Gallery filter.
  useEffect(() => {
    setLegacyFilters((current) => {
      const next = { ...decoded.filters, searchText: '' };
      return mediaCriteriaEqual(current, next) &&
        current.searchText === next.searchText
        ? current
        : next;
    });
  }, [decoded.filters, setLegacyFilters]);

  // Remove malformed or permission-inaccessible criteria from the visible URL
  // in place. This also leaves unrelated owners such as `link` untouched.
  useEffect(() => {
    const canonical = withGalleryLocationCriteria(
      location.search,
      decoded,
      capabilities,
    );
    if (canonical === location.search) return;
    navigateLocation((current) => ({
      search: canonical,
      replace: true,
      state: current.state,
    }));
  }, [capabilities, decoded, location.search, navigateLocation]);

  const setFilters = useCallback(
    (nextValue: GalleryFilterCriteria) => {
      const next = {
        ...normalizeGalleryFilterCriteria(nextValue, capabilities),
        searchText: '',
      };
      setLegacyFilters(next);
      navigateLocation((current) => {
        const currentCriteria = decodeGalleryLocationCriteria(
          current.search,
          capabilities,
        );
        return {
          search: withGalleryLocationCriteria(
            current.search,
            { ...currentCriteria, filters: next },
            capabilities,
          ),
          replace: true,
          state: current.state,
        };
      });
    },
    [capabilities, navigateLocation, setLegacyFilters],
  );

  const resetFilters = useCallback(
    () => setFilters(defaultGalleryFilterCriteria),
    [setFilters],
  );

  const getCurrentCriteria = useCallback(
    () =>
      decodeGalleryLocationCriteria(getCurrentLocation().search, capabilities),
    [capabilities, getCurrentLocation],
  );

  const setResultsQuery = useCallback(
    (query: string) => {
      navigateLocation((current) => {
        const currentCriteria = decodeGalleryLocationCriteria(
          current.search,
          capabilities,
        );
        const enteringResults = currentCriteria.mode !== 'results';
        return {
          search: withGalleryLocationCriteria(
            current.search,
            {
              mode: 'results',
              query,
              // Metadata criteria remain in the URL while Results is open so
              // returning to the gallery restores them. Results deliberately
              // omits them from its server request and filter drawer.
              filters: currentCriteria.filters,
              folderIds: enteringResults ? [] : currentCriteria.folderIds,
            },
            capabilities,
          ),
          replace: !enteringResults,
          state: enteringResults
            ? galleryResultsHistoryState(current.state)
            : current.state,
        };
      });
    },
    [capabilities, navigateLocation],
  );
  const enterResults = useCallback(
    ({ query = '' }: { query?: string } = {}) => setResultsQuery(query),
    [setResultsQuery],
  );

  const exitResults = useCallback(() => {
    if (wasGalleryResultsOpenedInCurrentDocument(location.state)) {
      void navigate(-1);
      return;
    }

    navigateLocation((current) => {
      const currentCriteria = decodeGalleryLocationCriteria(
        current.search,
        capabilities,
      );
      return {
        search: withGalleryLocationCriteria(
          current.search,
          {
            ...currentCriteria,
            mode: 'gallery',
            query: '',
            folderIds: [],
          },
          capabilities,
        ),
        replace: true,
        state: current.state,
      };
    });
  }, [capabilities, location.state, navigate, navigateLocation]);

  return {
    ...decoded,
    filters,
    setFilters,
    resetFilters,
    enterResults,
    setResultsQuery,
    exitResults,
    getCurrentCriteria,
    getCurrentLocation,
  };
};
