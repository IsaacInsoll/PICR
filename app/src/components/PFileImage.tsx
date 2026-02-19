import { memo } from 'react';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { View } from 'react-native';
import { FileType } from '@shared/gql/graphql';

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
  size,
  ...props
}: { file?: ThumbnailImageLike | null; size: ThumbnailSize } & ImageProps) => {
  const uri = useLocalImageUrl(
    file ? { ...file, type: file.type ?? undefined } : {},
    size,
  );
  const blurHash = file?.blurHash ?? undefined;
  if (!uri) return <View {...props} />;
  return <ExpoImage {...props} source={{ uri }} placeholder={blurHash} />;
};

export const PFileImage = memo(PFileImageComponent);
PFileImage.displayName = 'PFileImage';
