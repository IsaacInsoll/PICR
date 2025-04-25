import { NavigateOptions, NavLink, useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import { placeholderFolder } from '../components/FolderHeader/PlaceholderFolder';
import { MinimalFile, MinimalFolder } from '../../types';

import { useBaseViewFolderURL } from './useBaseViewFolderURL';

export const useSetFolder = () => {
  const navigate = useNavigate();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  return (
    folder: MinimalFolder,
    file?: Pick<MinimalFile, 'id'> | string,
    options?: NavigateOptions,
  ) => {
    setPlaceholderFolder({ ...folder });
    const base = baseUrl + folder.id;
    const f = file && file.id ? `/${file.id}` : file ? '/' + file : '';
    navigate(base + f, options);
  };
};

// converts any Mantine component to a link that preloads (placeholder) and behaves like a real link (IE: open in new tab)
export const useFolderLink = (
  folder: MinimalFolder,
  file?: Pick<MinimalFile, 'id'> | string,
) => {
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();

  const to =
    baseUrl +
    folder.id +
    (file && file?.id ? `/${file?.id}` : file ? '/' + file : '');

  const onClick = () => setPlaceholderFolder(folder);

  return { to, onClick, component: NavLink };
};
