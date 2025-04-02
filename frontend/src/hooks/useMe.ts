import { useAtomValue } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';

import { getUUID } from '../helpers/getUUID';
import { meQuery } from '../urql/queries/meQuery';

export const useMe = ():
  | (Pick<User, 'id' | 'name' | 'folderId' | 'commentPermissions'> & {
      isUser: boolean;
      isPublicLink: boolean;
      clientInfo: { avifEnabled?: boolean };
    })
  | null => {
  // console.log('useMe()');
  const token = useAtomValue(authKeyAtom);
  const uuid = getUUID();
  const [result] = useQuery({ query: meQuery, pause: !token && !uuid });
  const data = result.data;
  if (!data) return null;
  return {
    ...data.me,
    isUser: data.me?.id && !data.me?.uuid,
    isPublicLink: !!data.me?.uuid,
    clientInfo: data.clientInfo,
  };
};

export const useAvifEnabled = () => {
  const me = useMe();
  return me?.clientInfo?.avifEnabled ?? false;
};
