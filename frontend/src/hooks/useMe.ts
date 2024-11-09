import { gql } from '../helpers/gql';
import { useAtomValue } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';
import { getUUID } from '../Router';

export const useMe = ():
  | (Pick<User, 'id' | 'name' | 'folderId' | 'commentPermissions'> & {
      isUser: boolean;
      isPublicLink: boolean;
    })
  | null => {
  // console.log('useMe()');
  const token = useAtomValue(authKeyAtom);
  const uuid = getUUID();
  const [result] = useQuery({ query: meQuery, pause: !token && !uuid });
  const me = result.data?.me;
  if (!me) return null;
  return { ...me, isUser: !me.uuid, isPublicLink: !!me.uuid };
};

export const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      name
      folderId
      uuid
      commentPermissions
      folder {
        id
        name
      }
    }
  }
`);
