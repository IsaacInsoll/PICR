import { useAtomValue } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import type { MeQueryQuery } from '@shared/gql/graphql';

import { getUUID } from '../helpers/getUUID';
import { meQuery } from '@shared/urql/queries/meQuery';
import type { ExtraUserProps } from '@shared/extraUserProps';
import { extraUserProps } from '@shared/extraUserProps';

export const useMe = (
  options: { pause?: boolean } = {},
):
  | (NonNullable<MeQueryQuery['me']> &
      ExtraUserProps & {
        clientInfo: {
          useOriginalsForLightbox: boolean;
          thumbnailJpegQuality: number;
          thumbnailVariants: NonNullable<
            MeQueryQuery['clientInfo']
          >['thumbnailVariants'];
          baseUrl: string;
          canWrite: boolean;
        };
      })
  | null => {
  // console.log('useMe()');
  const token = useAtomValue(authKeyAtom);
  const uuid = getUUID();
  const [result] = useQuery({
    query: meQuery,
    pause: options.pause || (!token && !uuid),
  });
  if (!token && !uuid) return null;
  const data = result.data;
  if (!data?.me || !data.clientInfo) return null;
  const me = {
    ...data.me,
    ...extraUserProps(data.me),
    clientInfo: data.clientInfo,
  };
  // console.log(me);
  return me;
};

export const useOriginalsForLightbox = () => {
  const me = useMe();
  return me?.clientInfo.useOriginalsForLightbox ?? false;
};

export const useThumbnailVariants = () => {
  const me = useMe();
  return me?.clientInfo.thumbnailVariants ?? [];
};

export const useBaseUrl = () => {
  const me = useMe();
  return me?.clientInfo.baseUrl;
};

export const useLinkMode = () => {
  const me = useMe();
  return me?.linkMode;
};

export const useCanDownload = () => {
  const linkMode = useLinkMode();
  return linkMode !== 'proof_no_downloads';
};
