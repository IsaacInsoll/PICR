import { appMeViewModel } from '@/src/helpers/appMe';
import type { AppMeQueryQuery } from '@shared/gql/graphql';

const thumbnailVariants = [
  {
    __typename: 'ThumbnailVariant' as const,
    token: 'v1-500j80',
    width: 500,
    format: 'jpeg',
    mimeType: 'image/jpeg',
    quality: 80,
  },
];

describe('appMeViewModel', () => {
  it('keeps only the authenticated photographer fields used by the app', () => {
    const data = {
      me: {
        __typename: 'User' as const,
        id: '1',
        name: 'Photographer',
        folderId: '10',
      },
      clientInfo: {
        __typename: 'ClientInfo' as const,
        thumbnailVariants,
      },
    } satisfies AppMeQueryQuery;

    expect(appMeViewModel(data)).toEqual({
      id: '1',
      name: 'Photographer',
      folderId: '10',
      clientInfo: { thumbnailVariants },
    });
  });

  it('waits for both authenticated user and client configuration data', () => {
    expect(appMeViewModel(undefined)).toBeNull();
    expect(
      appMeViewModel({
        me: null,
        clientInfo: {
          __typename: 'ClientInfo',
          thumbnailVariants,
        },
      }),
    ).toBeNull();
    expect(
      appMeViewModel({
        me: {
          __typename: 'User',
          id: '1',
          name: 'Photographer',
          folderId: '10',
        },
        clientInfo: null,
      }),
    ).toBeNull();
  });
});
