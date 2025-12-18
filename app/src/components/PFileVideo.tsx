import { memo, useEffect, useState } from 'react';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { Video } from '@shared/gql/graphql';
import { StyleSheet, View } from 'react-native';
import { aspectFit } from '@shared/files/aspectFit';

// Basically an Video Thumbnail
export const PFileVideo = memo(
  ({ file, ...props }: { file: Video } & ImageProps) => {
    const uri = useLocalImageUrl(file, 'md');
    // const second = useSecond();
    if (!uri) return null;

    const flatStyle = StyleSheet.flatten(props.style);
    const af = aspectFit(flatStyle, file.imageRatio);
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
