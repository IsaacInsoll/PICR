import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { placeholderFolder } from '../components/FolderHeader/PlaceholderFolder';
import { MinimalFile, MinimalFolder } from '../../types';
import { useBaseViewFolderURL } from '../pages/ViewFolder';

export const useSetFolder = () => {
  const navigate = useNavigate();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  return (
    folder: MinimalFolder,
    file?: Pick<MinimalFile, 'id'>,
    fileView?: fileViewType,
  ) => {
    setPlaceholderFolder({ ...folder });
    const base = baseUrl + folder.id;
    const f = file ? `/${file.id}` + (fileView ? `/${fileView}` : '') : '';
    navigate(base + f);
  };
};

export type fileViewType = 'info' | undefined;
