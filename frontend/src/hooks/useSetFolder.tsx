import type { NavigateOptions } from 'react-router';
import { NavLink, useLocation, useNavigate } from 'react-router';
import type {
  FileNavigationTarget,
  FolderNavigationTarget,
} from '@shared/types/ui';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';

const useFolderUrl = () => {
  const baseUrl = useBaseViewFolderURL();
  const location = useLocation();

  return (folder: FolderNavigationTarget, file?: FileNavigationTarget) => {
    const fileId = typeof file === 'string' ? file : file?.id;
    return baseUrl + folder.id + (fileId ? `/${fileId}` : '') + location.hash;
  };
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
