import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import { thumbnailVariantForWidth } from '@shared/thumbnailVariantSelection';

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
