import { appMeViewModel } from '@/src/helpers/appMe';
import type { AppMeQueryQuery } from '@shared/gql/graphql';

type ThumbnailVariants = NonNullable<
  AppMeQueryQuery['clientInfo']
>['thumbnailVariants'];

const thumbnailVariants = [
  {
    token: 'v1-500j80',
    width: 500,
    format: 'jpeg',
    mimeType: 'image/jpeg',
    quality: 80,
  },
] satisfies ThumbnailVariants;

describe('appMeViewModel', () => {
  it('keeps only the authenticated photographer fields used by the app', () => {
    const data = {
      me: {
        id: '1',
        name: 'Photographer',
        folderId: '10',
      },
      clientInfo: {
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
          thumbnailVariants,
        },
      }),
    ).toBeNull();
    expect(
      appMeViewModel({
        me: {
          id: '1',
          name: 'Photographer',
          folderId: '10',
        },
        clientInfo: null,
      }),
    ).toBeNull();
  });
});
