// Full-screen image with pinch-to-zoom etc
import { Zoomable } from '@likashefqet/react-native-image-zoom';
import { useRef, useState } from 'react';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Image } from '../../../graphql-types';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Image as ExpoImage } from 'expo-image';
import { imageURL } from '@/src/components/AppImage';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { fileViewFullscreenAtom } from '@/src/app/[loggedin]/admin/f/[folderId]/[fileId]';
import { useAtom } from 'jotai';

export const PBigImage = ({
  file,
  style,
}: {
  file: Image;
  style?: ViewStyle;
}) => {
  const ref = useRef(null);
  const uri = useLocalImageUrl(file);
  const [fullScreen, setFullScreen] = useAtom(fileViewFullscreenAtom);
  if (!uri) return null;
  return (
    <Zoomable
      ref={ref}
      // minScale={0.5}
      // maxScale={maxScale}
      // scale={scale}
      doubleTapScale={3}
      isSingleTapEnabled
      isDoubleTapEnabled
      onSingleTap={() => setFullScreen((fs) => !fs)}
    >
      <ExpoImage
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        onError={console.log}
      />
    </Zoomable>
  );
};

const useLocalImageUrl = (file: Image) => {
  const [uri, setUri] = useState<string | undefined>(undefined);
  const baseUrl = useLoginDetails()?.server;
  const source = baseUrl + imageURL(file, 'raw');
  CacheManager.get(source, undefined).getPath().then(setUri);
  console.log([source, uri]);
  // return source;
  return Platform.OS == 'android' ? `file://${uri}` : uri;
};

const styles = StyleSheet.create({
  image: {
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
  },
});
