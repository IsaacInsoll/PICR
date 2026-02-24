import { meQuery } from '@shared/urql/queries/meQuery';
// import { extraUserProps } from '../../../backend/helpers/extraUserProps';
import { useQuery } from 'urql';
import type { User } from '@shared/gql/graphql';

export const useMe = (): Pick<
  User,
  'id' | 'name' | 'folderId' | 'commentPermissions' | 'linkMode'
> | null => {
  const [result] = useQuery({ query: meQuery });
  // if result.error == No Permissions then your token expired, reauth?
  const me = result.data?.me;
  if (!me) return null;
  return {
    id: me.id,
    name: me.name,
    folderId: me.folderId,
    commentPermissions: me.commentPermissions,
    linkMode: me.linkMode,
  };
};
