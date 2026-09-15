import {
  defaultGalleryFilterCriteria,
  normalizeGalleryFilterCriteria,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
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
  const decoded = useMemo(
    () => decodeGalleryLocationCriteria(location.search, capabilities),
    [capabilities, location.search],
  );
  const filters: GalleryFilterCriteria = decoded.filters;

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
      const next = normalizeGalleryFilterCriteria(nextValue, capabilities);
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
    [capabilities, navigateLocation],
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

  const setResultFolderIds = useCallback(
    (folderIds: string[]) => {
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
              mode: 'results',
              folderIds,
            },
            capabilities,
          ),
          replace: true,
          state: current.state,
        };
      });
    },
    [capabilities, navigateLocation],
  );

  const clearResultsCriteria = useCallback(() => {
    const currentCriteria = getCurrentCriteria();
    const filters = {
      ...defaultGalleryFilterCriteria,
      metadata: currentCriteria.filters.metadata,
    };
    navigateLocation((current) => {
      return {
        search: withGalleryLocationCriteria(
          current.search,
          {
            mode: 'results',
            query: '',
            filters,
            folderIds: [],
          },
          capabilities,
        ),
        replace: true,
        state: current.state,
      };
    });
  }, [capabilities, getCurrentCriteria, navigateLocation]);

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
    setResultFolderIds,
    clearResultsCriteria,
    exitResults,
    getCurrentCriteria,
    getCurrentLocation,
  };
};
