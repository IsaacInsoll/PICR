import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { placeholderFolder } from './components/FolderHeader/PlaceholderFolder';
import { MinimalFolder } from '../types';
import { useBaseViewFolderURL } from './pages/ViewFolder';

export const useSetFolder = () => {
  const navigate = useNavigate();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const baseUrl = useBaseViewFolderURL();
  return (f: MinimalFolder) => {
    setPlaceholderFolder({ ...f });
    navigate(baseUrl + f.id);
  };
};
