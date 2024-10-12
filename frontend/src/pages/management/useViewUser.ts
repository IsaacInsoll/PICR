import { useQuery } from 'urql';
import { viewUserQuery } from '../../urql/queries/viewUserQuery';

export const useViewUser = (id: string) => {
  const [response] = useQuery({
    query: viewUserQuery,
    variables: { id: id ?? '0' },
    pause: !id,
  });
  return [response.data?.user, id && id !== ''];
};
