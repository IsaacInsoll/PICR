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
    // I had this in here and it worked, but I prefer the idea of the parent deciding how to render this (IE: if it's a folder)
    // as different views have different needs (EG: blurring, overlaying text etc)
    //    const isFolder = file.__typename == 'Folder';
    //     const uri = useLocalImageUrl(isFolder ? file.heroImage : file, size);
    const uri = useLocalImageUrl(file, size);
    if (!uri) return null;

    return <ExpoImage {...props} source={{ uri }} />;
  },
);
