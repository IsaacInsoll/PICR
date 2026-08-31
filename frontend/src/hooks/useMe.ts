import { useAtomValue } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import { useQuery } from 'urql';
import type { MeQueryQuery } from '@shared/gql/graphql';

import { getUUID } from '../helpers/getUUID';
import { meQuery } from '@shared/urql/queries/meQuery';
import type { ExtraUserProps } from '@shared/extraUserProps';
import { extraUserProps } from '@shared/extraUserProps';
import {
  DEFAULT_SERVER_MEDIA_SETTINGS,
  serverThumbnailDimensions,
  type ServerThumbnailDimensions,
} from '@shared/serverMediaSettings';

export const useMe = (
  options: { pause?: boolean } = {},
):
  | (NonNullable<MeQueryQuery['me']> &
      ExtraUserProps & {
        clientInfo: {
          useOriginalsForLightbox: boolean;
          thumbnailSmallPx: number;
          thumbnailMediumPx: number;
          thumbnailLargePx: number;
          thumbnailJpegQuality: number;
          thumbnailDimensions: ServerThumbnailDimensions;
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

export const useServerThumbnailDimensions = () => {
  const me = useMe();
  return (
    me?.clientInfo.thumbnailDimensions ??
    serverThumbnailDimensions(DEFAULT_SERVER_MEDIA_SETTINGS)
  );
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
