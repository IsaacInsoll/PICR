import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import {
  thumbnailVariantForWidth,
  sortedThumbnailVariants,
} from '@shared/thumbnailVariantSelection';
import type { ImageUrlFileInput } from '@shared/types/ui';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import { imageURL } from './imageURL';

export const thumbnailSrcSet = (
  file: ImageUrlFileInput,
  variants: readonly ThumbnailVariantFragmentFragment[],
): string | undefined => {
  if (variants.length === 0) return undefined;
  return sortedThumbnailVariants(variants)
    .map(
      (variant) =>
        `${imageURL(file, variant.token as ThumbnailVariantToken)} ${variant.width}w`,
    )
    .join(', ');
};

// Returns undefined until the server-published ladder is known. Fabricating a
// token client-side would bake in the *default* quality, so on a server with a
// custom quality every fabricated URL 404s (a non-current quality is served but
// never generated). Callers should render the blurhash placeholder instead.
export const thumbnailRouteSizeForWidth = (
  variants: readonly ThumbnailVariantFragmentFragment[],
  width: number,
): ThumbnailVariantToken | undefined => {
  const variant = thumbnailVariantForWidth(variants, width);
  return variant ? (variant.token as ThumbnailVariantToken) : undefined;
};

export const thumbnailUrlForWidth = (
  file: ImageUrlFileInput,
  width: number,
  variants: readonly ThumbnailVariantFragmentFragment[],
): string | undefined => {
  const token = thumbnailRouteSizeForWidth(variants, width);
  return token ? imageURL(file, token) : undefined;
};

export { sortedThumbnailVariants, thumbnailVariantForWidth };
