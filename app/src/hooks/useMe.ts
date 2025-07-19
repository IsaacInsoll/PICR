import { meQuery } from '@shared/urql/queries/meQuery';
// import { extraUserProps } from '../../../backend/helpers/extraUserProps';
import { useQuery } from 'urql';
import { User } from '../../../graphql-types';

export const useMe = (): Pick<
  User,
  'id' | 'name' | 'folderId' | 'commentPermissions'
> => {
  const [result] = useQuery({ query: meQuery });
  // if result.error == No Permissions then your token expired, reauth?
  const data = result.data;
  if (!data) return null;
  const me = {
    ...data.me,
    // ...extraUserProps(data?.me),
    clientInfo: data.clientInfo,
  };
  return me;
};
