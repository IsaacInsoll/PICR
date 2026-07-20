import type { NavigateOptions } from 'react-router';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useCallback } from 'react';
import type {
  FileNavigationTarget,
  FolderNavigationTarget,
} from '@shared/types/ui';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';

// Returns a builder for the folder/file URL, preserving the current hash (which
// carries #s= sort and #m= modal state). Exported for surfaces that need the URL
// string directly rather than as link props - e.g. a folder tile inside a
// third-party gallery that renders its own anchor. Stable across renders (unless
// base URL or hash change) so callers can safely use it in useMemo deps.
export const useFolderUrl = () => {
  const baseUrl = useBaseViewFolderURL();
  const location = useLocation();

  return useCallback(
    (folder: FolderNavigationTarget, file?: FileNavigationTarget) => {
      const fileId = typeof file === 'string' ? file : file?.id;
      return baseUrl + folder.id + (fileId ? `/${fileId}` : '') + location.hash;
    },
    [baseUrl, location.hash],
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
    options?: NavigateOptions,
  ) => {
    void navigate(folderUrl(folder, file), options);
  };
};

// Converts any Mantine component into a real link (so "open in new tab",
// middle-click and "copy link address" all work). The destination folder's name
// appears while it loads via a graphcache lookup - see PlaceholderFolderHeader -
// so there is nothing to push in on click.
export const useFolderLink = (
  folder: FolderNavigationTarget,
  file?: FileNavigationTarget,
) => {
  const folderUrl = useFolderUrl();
  return { to: folderUrl(folder, file), component: NavLink };
};
