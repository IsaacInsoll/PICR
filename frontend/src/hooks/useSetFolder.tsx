import type { NavigateOptions } from 'react-router';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useCallback } from 'react';
import type {
  FileNavigationTarget,
  FolderNavigationTarget,
} from '@shared/types/ui';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';
import {
  decodeGalleryLocationCriteria,
  withGalleryLocationCriteria,
} from '../helpers/galleryCriteriaSearchParams';

export type GalleryCriteriaNavigationPolicy =
  'clear' | 'carry-gallery' | 'preserve';

interface SetFolderOptions extends NavigateOptions {
  galleryCriteria?: GalleryCriteriaNavigationPolicy;
}

export const searchForFolderNavigation = (
  currentSearch: string,
  policy: GalleryCriteriaNavigationPolicy,
) => {
  if (policy === 'preserve') return currentSearch;
  if (policy === 'clear') return '';

  return withGalleryLocationCriteria(currentSearch, {
    ...decodeGalleryLocationCriteria(currentSearch),
    mode: 'gallery',
    query: '',
    folderIds: [],
  });
};

// Returns a builder for the folder/file URL. Files preserve the full search and
// hash state; folder navigation clears criteria unless its caller deliberately
// carries gallery filters. Exported for surfaces that need the URL string
// directly rather than link props. Stable across renders (unless base URL or
// location state changes) so callers can safely use it in useMemo deps.
export const useFolderUrl = () => {
  const baseUrl = useBaseViewFolderURL();
  const location = useLocation();

  return useCallback(
    (
      folder: FolderNavigationTarget,
      file?: FileNavigationTarget,
      policy: GalleryCriteriaNavigationPolicy = file ? 'preserve' : 'clear',
    ) => {
      const fileId = typeof file === 'string' ? file : file?.id;
      const search = searchForFolderNavigation(location.search, policy);
      return (
        baseUrl +
        folder.id +
        (fileId ? `/${fileId}` : '') +
        search +
        location.hash
      );
    },
    [baseUrl, location.hash, location.search],
  );
};

// Imperative navigation, for redirects and other non-clickable flows. Anything a
// user clicks should use useFolderLink so it behaves like a real link.
export const useSetFolder = () => {
  const navigate = useNavigate();
  const folderUrl = useFolderUrl();
  return (
    folder: FolderNavigationTarget,
    file?: FileNavigationTarget,
    options?: SetFolderOptions,
  ) => {
    const { galleryCriteria, ...navigateOptions } = options ?? {};
    void navigate(folderUrl(folder, file, galleryCriteria), navigateOptions);
  };
};

// Converts any Mantine component into a real link (so "open in new tab",
// middle-click and "copy link address" all work). The destination folder's name
// appears while it loads via a graphcache lookup - see PlaceholderFolderHeader -
// so there is nothing to push in on click.
export const useFolderLink = (
  folder: FolderNavigationTarget,
  file?: FileNavigationTarget,
  galleryCriteria?: GalleryCriteriaNavigationPolicy,
) => {
  const folderUrl = useFolderUrl();
  return {
    to: folderUrl(folder, file, galleryCriteria),
    component: NavLink,
  };
};
