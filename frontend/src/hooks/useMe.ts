import { useAtomValue } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';

import { getUUID } from '../helpers/getUUID';
import { meQuery } from '@shared/urql/queries/meQuery';
import {
  extraUserProps,
  ExtraUserProps,
} from '../../../backend/helpers/extraUserProps';

export const useMe = ():
  | (Pick<User, 'id' | 'name' | 'folderId' | 'commentPermissions'> &
      ExtraUserProps & {
        clientInfo: {
          avifEnabled?: boolean;
          baseUrl: string;
          canWrite: boolean;
        };
      })
  | null => {
  // console.log('useMe()');
  const token = useAtomValue(authKeyAtom);
  const uuid = getUUID();
  const [result] = useQuery({ query: meQuery, pause: !token && !uuid });
  const data = result.data;
  if (!data) return null;
  const me = {
    ...data.me,
    ...extraUserProps(data?.me),
    clientInfo: data.clientInfo,
  };
  // console.log(me);
  return me;
};

export const useAvifEnabled = () => {
  const me = useMe();
  return me?.clientInfo?.avifEnabled ?? false;
};
export const useBaseUrl = () => {
  const me = useMe();
  return me?.clientInfo?.baseUrl;
};
