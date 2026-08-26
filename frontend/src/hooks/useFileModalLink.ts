import { useLocation } from 'react-router';
import {
  buildFileModalNavigation,
  type FileModalState,
} from '../helpers/fileModalHash';

export const useFileModalLink = (state: FileModalState) => {
  const location = useLocation();
  const navigation = buildFileModalNavigation(location, state);

  return {
    to: {
      pathname: location.pathname,
      search: location.search,
      hash: navigation.hash,
    },
    replace: navigation.replace,
    state: navigation.state,
  };
};
