// Full-screen image with pinch-to-zoom etc
import { ZOOM_TYPE, Zoomable } from '@likashefqet/react-native-image-zoom';
import { memo, useEffect, useRef, useState } from 'react';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Image } from '../../../graphql-types';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Image as ExpoImage } from 'expo-image';
import { imageURL } from '@/src/components/AppImage';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { useAtom } from 'jotai';
import { AllSize } from '@frontend/helpers/thumbnailSize';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import { File } from '@shared/gql/graphql';

const PBigImageComponent = ({
  file,
  style,
  setIsZoomed,
}: {
  file: Image;
  style?: ViewStyle;
  setIsZoomed: (z: boolean) => void;
}) => {
  console.log('PBIGImage rendering ' + file.name);
  const ref = useRef(null);
  const uri = useLocalImageUrl(file, 'lg');
  const [fullScreen, setFullScreen] = useAtom(fileViewFullscreenAtom);
  const theme = useAppTheme();
  if (!uri) return null;

  const onZoom = (zoomType?: ZOOM_TYPE) => {
    if (!zoomType || zoomType === ZOOM_TYPE.ZOOM_IN) {
      setIsZoomed(true);
    }
  };

  const onAnimationEnd = (finished?: boolean) => {
    if (finished) {
      setIsZoomed(false);
    }
  };
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
      onInteractionStart={() => {
        onZoom();
      }}
      onProgrammaticZoom={(zoomType) => {
        onZoom(zoomType);
      }}
      style={[styles.image, style]}
      onResetAnimationEnd={(finished) => {
        onAnimationEnd(finished);
      }}
    >
      <ExpoImage
        placeholder={file.blurHash}
        source={{ uri }}
        style={{
          ...styles.image,
          backgroundColor: theme.tabColor, //'#000', // theme.backgroundColor we want absolute black, not dark grey
        }}
        contentFit="contain"
        onError={console.log}
      />
    </Zoomable>
  );
};

export const PBigImage = memo(PBigImageComponent);
PBigImage.displayName = 'PBigImage';

export const useLocalImageUrl = (
  file: Partial<Pick<File, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
) => {
  const [uri, setUri] = useState<string | undefined>(undefined);
  const baseUrl = useLoginDetails()?.server;

  useEffect(() => {
    let cancelled = false;
    if (!file || !baseUrl) {
      setUri(undefined);
      return () => {
        cancelled = true;
      };
    }

    const source = baseUrl + imageURL(file, size);
    CacheManager.get(source, undefined)
      .getPath()
      .then((path) => {
        if (!cancelled) setUri(path);
      })
      .catch(() => {
        if (!cancelled) setUri(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, file?.fileHash, file?.id, file?.name, size]);

  if (!uri) return null;
  return Platform.OS === 'android' ? `file://${uri}` : uri;
};

const styles = StyleSheet.create({
  image: {
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
  },
});
