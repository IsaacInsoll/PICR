import { memo } from 'react';
import { Image } from '../../../graphql-types';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';

// Basically an Expo Image using a Picr File as src
export const PFileImage = memo(
  ({
    file,
    size,
    ...props
  }: { file: Image; size: ThumbnailSize } & ImageProps) => {
    const uri = useLocalImageUrl(file, size);
    if (!uri) return null;

    return <ExpoImage {...props} source={{ uri }} />;
  },
);
