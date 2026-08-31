import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import {
  renderedThumbnailVariants,
  thumbnailVariantForWidth,
  sortedThumbnailVariants,
} from '@shared/thumbnailVariantSelection';
import type {
  RenderedThumbnailVariant,
  ThumbnailSourceDimensions,
} from '@shared/thumbnailVariantSelection';
import type { ImageUrlFileInput } from '@shared/types/ui';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import { imageURL } from './imageURL';

export interface ThumbnailImageCandidate {
  src: string;
  token: ThumbnailVariantToken;
  width: number;
  height: number;
}

const positiveDimensions = (
  width: number | null | undefined,
  height: number | null | undefined,
): ThumbnailSourceDimensions | undefined =>
  typeof width === 'number' &&
  Number.isFinite(width) &&
  width > 0 &&
  typeof height === 'number' &&
  Number.isFinite(height) &&
  height > 0
    ? { width, height }
    : undefined;

const thumbnailSourceDimensions = (
  file: ImageUrlFileInput,
): ThumbnailSourceDimensions | undefined => {
  if (file.type === 'Image') {
    return positiveDimensions(file.imageWidth, file.imageHeight);
  }
  if (file.type === 'Video') {
    return positiveDimensions(file.metadata?.Width, file.metadata?.Height);
  }
  return undefined;
};

const renderedVariantsForFile = (
  file: ImageUrlFileInput,
  variants: readonly ThumbnailVariantFragmentFragment[],
): RenderedThumbnailVariant<ThumbnailVariantFragmentFragment>[] => {
  const source = thumbnailSourceDimensions(file);
  return source ? renderedThumbnailVariants(variants, source) : [];
};

export const thumbnailImageCandidates = (
  file: ImageUrlFileInput,
  variants: readonly ThumbnailVariantFragmentFragment[],
): ThumbnailImageCandidate[] =>
  renderedVariantsForFile(file, variants).map(({ variant, width, height }) => ({
    src: imageURL(file, variant.token as ThumbnailVariantToken),
    token: variant.token as ThumbnailVariantToken,
    width,
    height,
  }));

export const thumbnailSrcSet = (
  file: ImageUrlFileInput,
  variants: readonly ThumbnailVariantFragmentFragment[],
): string | undefined => {
  const candidates = thumbnailImageCandidates(file, variants);
  return candidates.length > 0
    ? candidates.map(({ src, width }) => `${src} ${width}w`).join(', ')
    : undefined;
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

export const thumbnailRouteSizeForFileWidth = (
  file: ImageUrlFileInput,
  variants: readonly ThumbnailVariantFragmentFragment[],
  width: number,
): ThumbnailVariantToken | undefined => {
  const candidates = renderedVariantsForFile(file, variants);
  const candidate =
    candidates.find((item) => item.width >= width) ?? candidates.at(-1);
  return candidate
    ? (candidate.variant.token as ThumbnailVariantToken)
    : thumbnailRouteSizeForWidth(variants, width);
};

export const thumbnailUrlForWidth = (
  file: ImageUrlFileInput,
  width: number,
  variants: readonly ThumbnailVariantFragmentFragment[],
): string | undefined => {
  const token = thumbnailRouteSizeForFileWidth(file, variants, width);
  return token ? imageURL(file, token) : undefined;
};

export { sortedThumbnailVariants, thumbnailVariantForWidth };
