import { useQuery } from 'urql';
import { viewUserQuery } from '@shared/urql/queries/viewUserQuery';
import { PicrUser } from '../../../types';

export const useViewUser = (id?: string): [PicrUser | undefined, boolean] => {
  const [response] = useQuery({
    query: viewUserQuery,
    variables: { id: id ?? '0' },
    pause: !id,
  });
  return [response.data?.user, !!id && id !== ''];
};
