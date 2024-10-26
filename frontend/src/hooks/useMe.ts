import { gql } from '../helpers/gql';
import { useAtomValue } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';
import { getUUID } from '../Router';

export const useMe = (): Pick<
  User,
  'id' | 'name' | 'folderId' | 'commentPermissions'
> | null => {
  // console.log('useMe()');
  const token = useAtomValue(authKeyAtom);
  const uuid = getUUID();
  const [result] = useQuery({ query: meQuery, pause: !token && !uuid });
  return result.data?.me ?? null;
};

export const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      name
      folderId
      commentPermissions
      folder {
        id
        name
      }
    }
  }
`);
