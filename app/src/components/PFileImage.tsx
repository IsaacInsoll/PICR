import { memo } from 'react';
import type { ImageProps } from 'expo-image';
import { Image as ExpoImage } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { View } from 'react-native';
import type { FileType } from '@shared/gql/graphql';
import { useThumbnailVariants } from '@/src/hooks/useMe';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';

type ThumbnailImageLike = {
  id?: string;
  fileHash?: string;
  name?: string;
  type?: FileType | null;
  blurHash?: string | null;
};

// Basically an Expo Image using a Picr File as src
const PFileImageComponent = ({
  file,
  targetWidth,
  ...props
}: { file?: ThumbnailImageLike | null; targetWidth: number } & ImageProps) => {
  const thumbnailVariants = useThumbnailVariants();
  const sourceSize = thumbnailRouteSizeForWidth(thumbnailVariants, targetWidth);
  const uri = useLocalImageUrl(
    file ? { ...file, type: file.type ?? undefined } : {},
    sourceSize,
  );
  const blurHash = file?.blurHash ?? undefined;
  if (!uri) return <View {...props} />;
  return <ExpoImage {...props} source={{ uri }} placeholder={blurHash} />;
};

export const PFileImage = memo(PFileImageComponent);
PFileImage.displayName = 'PFileImage';
