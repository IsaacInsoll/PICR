export interface ThumbnailVariantChoice {
  token: string;
  width: number;
}

export const sortedThumbnailVariants = <T extends ThumbnailVariantChoice>(
  variants: readonly T[],
): T[] => [...variants].sort((a, b) => a.width - b.width);

export const thumbnailVariantForWidth = <T extends ThumbnailVariantChoice>(
  variants: readonly T[],
  width: number,
): T | undefined => {
  const sorted = sortedThumbnailVariants(variants);
  return sorted.find((variant) => variant.width >= width) ?? sorted.at(-1);
};
