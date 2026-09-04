import type { AppMeQueryQuery } from '@shared/gql/graphql';

type AppMeUser = NonNullable<AppMeQueryQuery['me']>;
type AppClientInfo = NonNullable<AppMeQueryQuery['clientInfo']>;

export type AppMe = Pick<AppMeUser, 'id' | 'name' | 'folderId'> & {
  clientInfo: Pick<AppClientInfo, 'thumbnailVariants'>;
};

export const appMeViewModel = (
  data: AppMeQueryQuery | undefined,
): AppMe | null => {
  const me = data?.me;
  const clientInfo = data?.clientInfo;
  if (!me || !clientInfo) return null;

  return {
    id: me.id,
    name: me.name,
    folderId: me.folderId,
    clientInfo: {
      thumbnailVariants: clientInfo.thumbnailVariants,
    },
  };
};
