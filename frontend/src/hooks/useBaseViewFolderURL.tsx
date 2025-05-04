// This component is used in the 'public URL' and 'private URL' routes, so this is how we determine where each link should point

import { getUUID } from '../helpers/getUUID';
import { useMe } from './useMe';

export const useBaseViewFolderURL = () => {
  const me = useMe();
  return me?.isLink ? '/s/' + getUUID() + '/' : '/admin/f/';
};
