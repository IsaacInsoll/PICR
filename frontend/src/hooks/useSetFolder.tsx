import {
  NavigateOptions,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router';
import { useSetAtom } from 'jotai';
import { placeholderFolder } from '../components/FolderHeader/PlaceholderFolder';
import { PicrFile, PicrFolder } from '../../types';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';

export const useSetFolder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  return (
    folder: Pick<PicrFolder, 'id'> & Partial<PicrFolder>,
    file?: Pick<PicrFile, 'id'> | string,
    options?: NavigateOptions,
  ) => {
    setPlaceholderFolder(folder as PicrFolder);
    const base = baseUrl + folder.id;
    const fileId = typeof file === 'string' ? file : file?.id;
    const f = fileId ? `/${fileId}` : '';
    navigate(base + f + location.hash, options);
  };
};

// converts any Mantine component to a link that preloads (placeholder) and behaves like a real link (IE: open in new tab)
export const useFolderLink = (
  folder: Pick<PicrFolder, 'id'> & Partial<PicrFolder>,
  file?: Pick<PicrFile, 'id'> | string,
) => {
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  const location = useLocation();

  const to =
    baseUrl +
    folder.id +
    (typeof file === 'string' ? `/${file}` : file?.id ? `/${file.id}` : '') +
    location.hash;

  const onClick = () => setPlaceholderFolder(folder as PicrFolder);

  return { to, onClick, component: NavLink };
};
