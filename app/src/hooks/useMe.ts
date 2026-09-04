import { appMeQuery } from '@shared/urql/queries/appMeQuery';
import { useQuery } from 'urql';
import { appMeViewModel } from '@/src/helpers/appMe';
import type { AppMe } from '@/src/helpers/appMe';

export const useMe = (): AppMe | null => {
  const [result] = useQuery({ query: appMeQuery });
  // if result.error == No Permissions then your token expired, reauth?
  return appMeViewModel(result.data);
};

export const useThumbnailVariants = () => {
  const me = useMe();
  return me?.clientInfo.thumbnailVariants ?? [];
};
