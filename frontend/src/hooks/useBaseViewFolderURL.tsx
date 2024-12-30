// This component is used in the 'public URL' and 'private URL' routes, so this is how we determine where each link should point

import { getUUID } from '../helpers/getUUID';

export const useBaseViewFolderURL = () => {
  return getUUID() ? '/s/' + getUUID() + '/' : '/admin/f/';
};
