import type { AllSize } from '@shared/thumbnailSize';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import type { ImageUrlFileInput } from '@shared/types/ui';

export const imageURL = (
  file: ImageUrlFileInput,
  size: AllSize | ThumbnailVariantToken,
  extension?: string,
) => {
  const { id, fileHash, name, type } = file;
  const path = `image/${id}/${size}/${fileHash}/`;
  if (type === 'Video' && size !== 'raw') return path + 'poster.jpg';

  const filename = extension ? name + extension : name;
  return path + encodeURIComponent(String(filename));
};
