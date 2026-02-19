import { memo } from 'react';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { StyleSheet, View } from 'react-native';
import { aspectFit } from '@shared/files/aspectFit';
import { FileType } from '@shared/gql/graphql';

type VideoThumbnailFile = {
  id?: string;
  fileHash?: string;
  name?: string;
  type?: FileType | null;
  imageRatio?: number | null;
};

// Basically an Video Thumbnail
const PFileVideoComponent = ({
  file,
  ...props
}: { file: VideoThumbnailFile } & ImageProps) => {
  const uri = useLocalImageUrl({ ...file, type: file.type ?? undefined }, 'md');
  // const second = useSecond();
  if (!uri) return null;

  const flatStyle = StyleSheet.flatten(props.style);
  const af = aspectFit(
    {
      width:
        typeof flatStyle?.width === 'number'
          ? flatStyle.width
          : (file.imageRatio ?? 1),
      height: typeof flatStyle?.height === 'number' ? flatStyle.height : 1,
    },
    file.imageRatio ?? undefined,
  );
  const frame = 3; //second - 1;

  return (
    <View
      style={[
        props.style,
        {
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <View
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: af.width,
          height: af.height, //intentionally not parent height
        }}
      >
        <ExpoImage
          {...props}
          source={{ uri }}
          contentFit="contain"
          onError={console.log}
          style={{
            position: 'absolute',
            top: af.height * -frame,
            // left: (props.style.width - af.width) / 2,
            // right: (props.style.width - af.width) / 2,
            // bottom: height * -9,
            width: af.width,
            height: af.height * 10,
          }}
        />
      </View>
    </View>
  );
};

export const PFileVideo = memo(PFileVideoComponent);
PFileVideo.displayName = 'PFileVideo';
