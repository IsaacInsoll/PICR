import { useQuery } from 'urql';
import { viewUserQuery } from '@shared/urql/queries/viewUserQuery';
import type { PicrUser } from '@shared/types/picr';

export const useViewUser = (id?: string): [PicrUser | undefined, boolean] => {
  const hasId = !!id && id !== '';
  const queryId = hasId ? id : '1';
  const [response] = useQuery({
    query: viewUserQuery,
    variables: { id: queryId },
    pause: !hasId,
  });
  return [response.data?.user, hasId];
};
