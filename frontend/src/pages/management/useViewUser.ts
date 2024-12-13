import { useQuery } from 'urql';
import { viewUserQuery } from '../../urql/queries/viewUserQuery';
import { MinimalSharedFolder } from '../../../types';

export const useViewUser = (
  id: string,
): [MinimalSharedFolder | undefined, boolean] => {
  const [response] = useQuery({
    query: viewUserQuery,
    variables: { id: id ?? '0' },
    pause: !id,
  });
  return [response.data?.user, !!id && id !== ''];
};
