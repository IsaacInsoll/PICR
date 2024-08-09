import { gql } from '../helpers/gql';
import { useAtomValue } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';

export const useMe = (): Pick<User, 'id' | 'name' | 'folderId'> | null => {
  const token = useAtomValue(authKeyAtom);
  console.log('useMe()');
  const [result] = useQuery({ query: meQuery, pause: !token });
  return result.data?.me ?? null;
};

const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      name
      folderId
    }
  }
`);
