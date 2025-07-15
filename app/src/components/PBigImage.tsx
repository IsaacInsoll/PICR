// Full-screen image with pinch-to-zoom etc
import { Zoomable } from '@likashefqet/react-native-image-zoom';
import { useMemo, useRef, useState } from 'react';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Image } from '../../../graphql-types';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Image as ExpoImage } from 'expo-image';
import { imageURL } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { StyleSheet } from 'react-native';

export const PBigImage = ({ file }: { file: Image }) => {
  const ref = useRef(null);
  const uri = useLocalImageUrl(file);

  return (
    <Zoomable
      ref={ref}
      // minScale={0.5}
      // maxScale={maxScale}
      // scale={scale}
      doubleTapScale={3}
      isSingleTapEnabled
      isDoubleTapEnabled
      style={styles.image}
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
  //TODO: get cache working
  const [uri, setUri] = useState<string | undefined>(undefined);
  const baseUrl = useLoginDetails()?.server;
  const source = baseUrl + imageURL(file, 'raw');
  CacheManager.get(source, undefined).getPath().then(setUri);
  console.log([source, uri]);
  return source;
  return uri;
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
});
