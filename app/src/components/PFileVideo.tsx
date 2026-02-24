import { memo } from 'react';
import type { ImageProps } from 'expo-image';
import { Image as ExpoImage } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { StyleSheet, View } from 'react-native';
import { aspectFit } from '@shared/files/aspectFit';
import type { PicrFile } from '@shared/types/picr';

type VideoThumbnailFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio'
>;

// Basically an Video Thumbnail
const PFileVideoComponent = ({
  file,
  ...props
}: { file: VideoThumbnailFile } & ImageProps) => {
  const uri = useLocalImageUrl(
    { ...file, name: file.name ?? undefined, type: file.type ?? undefined },
    'md',
  );
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
          onError={(_e) => {
            /* console.log(_e) */
          }}
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
