import type { PicrFile } from '@shared/types/picr';
import { PixelRatio, View } from 'react-native';
import { useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { useThumbnailVariants } from '@/src/hooks/useMe';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';
import { useAuthenticatedServerOrigin } from '@/src/components/AuthenticatedServerOriginProvider';

type AppImageFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio' | 'blurHash'
>;

// Show an image but cache it to device
//TODO: copy PBIGImage and use ExpoImage so we can do BlurRadius prop, and progressively load higher res images?
export const AppImage = ({
  file,
  width,
}: {
  file: AppImageFile;
  width?: number;
}) => {
  const origin = useAuthenticatedServerOrigin();
  const thumbnailVariants = useThumbnailVariants();

  const [viewWidth, setViewWidth] = useState(0);
  const w = width ?? viewWidth;
  const height = w / (file.imageRatio ?? 1);

  const sourceSize = thumbnailRouteSizeForWidth(
    thumbnailVariants,
    PixelRatio.getPixelSizeForLayoutSize(w),
  );

  const source =
    w === 0 || !sourceSize ? undefined : origin.mediaUrl(file, sourceSize);

  // console.log(width, viewWidth, height, file.fileHash);

  return (
    <View
      onLayout={(e) => {
        const ww = e.nativeEvent.layout.width;
        // console.log('AppImage layout w is ', ww);
        if (!width && ww !== viewWidth) setViewWidth(ww);
      }}
      style={{ height }}
    >
      <ExpoImage
        cachePolicy="memory-disk"
        contentFit="contain"
        placeholder={file.blurHash ?? undefined}
        placeholderContentFit="contain"
        source={source ? { uri: source } : undefined}
        style={{ width: w, height }}
        transition={200}
        onError={() => {
          // console.log('Error getting image: ' + source);
        }}
      />
    </View>
  );
};
