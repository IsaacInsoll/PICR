import { memo, useEffect, useState } from 'react';
import { Image } from '../../../graphql-types';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { Video } from '@shared/gql/graphql';
import { View } from 'react-native';

// Basically an Video Thumbnail
export const PFileVideo = memo(
  ({ file, ...props }: { file: Video } & ImageProps) => {
    // I had this in here and it worked, but I prefer the idea of the parent deciding how to render this (IE: if it's a folder)
    // as different views have different needs (EG: blurring, overlaying text etc)
    //    const isFolder = file.__typename == 'Folder';
    //     const uri = useLocalImageUrl(isFolder ? file.heroImage : file, size);
    const uri = useLocalImageUrl(file, 'md');
    const second = useSecond();
    if (!uri) return null;

    const { height, width } = props.style;
    const aspect = width / (file.imageRatio ?? 1);

    console.log(height, width, aspect);

    const frame = second - 1;

    return (
      <View
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: width,
          height: aspect, //intentionally not parent height
        }}
      >
        <ExpoImage
          {...props}
          source={{ uri }}
          contentFit="contain"
          style={{
            position: 'absolute',
            top: aspect * -frame,
            left: 0,
            right: 0,
            // bottom: height * -9,
            width: width,
            height: aspect * 10,
          }}
        />
      </View>
    );
  },
);

// copied from app, should be in shared
const useSecond = () => {
  const [second, setSecond] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecond((second) => (second >= 10 ? 1 : second + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [second]);
  return second;
};
