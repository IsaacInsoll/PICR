// Full-screen image with pinch-to-zoom etc
import { ZOOM_TYPE, Zoomable } from '@likashefqet/react-native-image-zoom';
import { memo, useEffect, useRef, useState } from 'react';
import { CacheManager } from '@georstat/react-native-image-cache';
import type { File, Image } from '@shared/gql/graphql';
import { Image as ExpoImage } from 'expo-image';
import type { ViewStyle } from 'react-native';
import {
  PixelRatio,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useAtom } from 'jotai';
import type { AllSize } from '@shared/thumbnailSize';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import { useThumbnailVariants } from '@/src/hooks/useMe';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';
import { useAuthenticatedServerOrigin } from '@/src/components/AuthenticatedServerOriginProvider';

const PBigImageComponent = ({
  file,
  style,
  setIsZoomed,
}: {
  file: Image;
  style?: ViewStyle;
  setIsZoomed: (z: boolean) => void;
}) => {
  // console.log('PBIGImage rendering ' + file.name);
  const ref = useRef(null);
  const thumbnailVariants = useThumbnailVariants();
  const { height, width } = useWindowDimensions();
  const sourceSize = thumbnailRouteSizeForWidth(
    thumbnailVariants,
    PixelRatio.getPixelSizeForLayoutSize(Math.max(width, height)),
  );
  const uri = useLocalImageUrl(file, sourceSize);
  const [, setFullScreen] = useAtom(fileViewFullscreenAtom);
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
        onError={(_e) => {
          /* console.log(_e) */
        }}
      />
    </Zoomable>
  );
};

export const PBigImage = memo(PBigImageComponent);
PBigImage.displayName = 'PBigImage';

export const useLocalImageUrl = (
  file: Partial<Pick<File, 'id' | 'fileHash' | 'name' | 'type'>>,
  // undefined until the server-published variant ladder is known; callers show
  // their blurhash placeholder rather than requesting a fabricated token.
  size: AllSize | ThumbnailVariantToken | undefined,
) => {
  const [cachedImage, setCachedImage] = useState<{
    source: string;
    uri: string | null;
  } | null>(null);
  const origin = useAuthenticatedServerOrigin();
  const source = size ? origin.mediaUrl(file, size) : null;

  useEffect(() => {
    if (!source) return;

    let cancelled = false;
    CacheManager.get(source, undefined)
      .getPath()
      .then((path) => {
        if (!cancelled) setCachedImage({ source, uri: path ?? null });
      })
      .catch(() => {
        if (!cancelled) setCachedImage({ source, uri: null });
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (!source || cachedImage?.source !== source || !cachedImage.uri)
    return null;
  return Platform.OS === 'android'
    ? `file://${cachedImage.uri}`
    : cachedImage.uri;
};

const styles = StyleSheet.create({
  image: {
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
  },
});
