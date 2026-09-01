import { MediaTypeFilter, type Maybe } from '@shared/gql/graphql.js';

export const mediaTypesForThumbnailWork = (
  mediaType: Maybe<MediaTypeFilter> | undefined,
): readonly ['Image', 'Video'] | readonly ['Image'] | readonly ['Video'] => {
  if (mediaType === MediaTypeFilter.Image) {
    return ['Image'];
  }
  if (mediaType === MediaTypeFilter.Video) {
    return ['Video'];
  }
  return ['Image', 'Video'];
};
