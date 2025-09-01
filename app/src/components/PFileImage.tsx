import { memo } from 'react';
import { Image } from '../../../graphql-types';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { Video } from '@shared/gql/graphql';
import { PFileVideo } from '@/src/components/PFileVideo';
import { View } from 'react-native';

// Basically an Expo Image using a Picr File as src
export const PFileImage = memo(
  ({
    file,
    size,
    ...props
  }: { file?: Image | Video | null; size: ThumbnailSize } & ImageProps) => {
    const uri = useLocalImageUrl(file, size);
    if (!uri) return <View {...props} />;
    return (
      <ExpoImage {...props} source={{ uri }} placeholder={file.blurHash} />
    );
  },
);
