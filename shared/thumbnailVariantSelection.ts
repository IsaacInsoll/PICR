export interface ThumbnailVariantChoice {
  token: string;
  width: number;
}

export interface ThumbnailSourceDimensions {
  width: number;
  height: number;
}

export interface RenderedThumbnailVariant<T extends ThumbnailVariantChoice> {
  variant: T;
  width: number;
  height: number;
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

const renderedThumbnailDimensions = (
  source: ThumbnailSourceDimensions,
  targetLongEdge: number,
): ThumbnailSourceDimensions | undefined => {
  if (
    !Number.isFinite(source.width) ||
    source.width <= 0 ||
    !Number.isFinite(source.height) ||
    source.height <= 0 ||
    !Number.isFinite(targetLongEdge) ||
    targetLongEdge <= 0
  ) {
    return undefined;
  }

  const scale = Math.min(
    1,
    targetLongEdge / Math.max(source.width, source.height),
  );
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
};

export const renderedThumbnailVariants = <T extends ThumbnailVariantChoice>(
  variants: readonly T[],
  source: ThumbnailSourceDimensions,
): RenderedThumbnailVariant<T>[] => {
  const renderedWidths = new Set<number>();
  const candidates: RenderedThumbnailVariant<T>[] = [];

  for (const variant of sortedThumbnailVariants(variants)) {
    const dimensions = renderedThumbnailDimensions(source, variant.width);
    if (!dimensions || renderedWidths.has(dimensions.width)) continue;

    renderedWidths.add(dimensions.width);
    candidates.push({ variant, ...dimensions });
  }

  return candidates;
};
