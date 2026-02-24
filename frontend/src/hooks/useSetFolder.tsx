import type { NavigateOptions } from 'react-router';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import { placeholderFolder } from '../components/FolderHeader/PlaceholderFolder';
import type { PicrFolder } from '@shared/types/picr';
import type {
  FileNavigationTarget,
  FolderNavigationTarget,
} from '@shared/types/ui';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';

export const useSetFolder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  return (
    folder: FolderNavigationTarget,
    file?: FileNavigationTarget,
    options?: NavigateOptions,
  ) => {
    setPlaceholderFolder(toPlaceholderFolder(folder));
    const base = baseUrl + folder.id;
    const fileId = typeof file === 'string' ? file : file?.id;
    const f = fileId ? `/${fileId}` : '';
    navigate(base + f + location.hash, options);
  };
};

// converts any Mantine component to a link that preloads (placeholder) and behaves like a real link (IE: open in new tab)
export const useFolderLink = (
  folder: FolderNavigationTarget,
  file?: FileNavigationTarget,
) => {
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  const location = useLocation();

  const to =
    baseUrl +
    folder.id +
    (typeof file === 'string' ? `/${file}` : file?.id ? `/${file.id}` : '') +
    location.hash;

  const onClick = () => setPlaceholderFolder(toPlaceholderFolder(folder));

  return { to, onClick, component: NavLink };
};

const toPlaceholderFolder = (folder: FolderNavigationTarget): PicrFolder => ({
  ...folder,
  id: folder.id,
  name: folder.name ?? 'Loading...',
  parents: folder.parents ?? [],
});
