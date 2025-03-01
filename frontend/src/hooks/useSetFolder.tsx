import { NavigateOptions, useNavigate } from 'react-router';
import { useSetAtom } from 'jotai/index';
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
