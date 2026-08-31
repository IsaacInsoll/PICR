import { CachedImage } from '@georstat/react-native-image-cache';
import type { AllSize } from '@shared/thumbnailSize';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import type { PicrFile } from '@shared/types/picr';
import type { ImageUrlFileInput } from '@shared/types/ui';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { PixelRatio, View } from 'react-native';
import { useState } from 'react';
import { useThumbnailVariants } from '@/src/hooks/useMe';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';

type AppImageFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio'
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
  const baseUrl = useLoginDetails()?.server;
  const thumbnailVariants = useThumbnailVariants();

  const [viewWidth, setViewWidth] = useState(0);
  const w = width ?? viewWidth;
  const height = w / (file.imageRatio ?? 1);

  const sourceSize = thumbnailRouteSizeForWidth(
    thumbnailVariants,
    PixelRatio.getPixelSizeForLayoutSize(w),
  );
  const thumbnailSourceSize = thumbnailRouteSizeForWidth(
    thumbnailVariants,
    250,
  );

  const source =
    w === 0 || !baseUrl || !sourceSize
      ? undefined
      : baseUrl + imageURL(file, sourceSize);

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
      {/*TODO: this is only instance of CachedImage in entire codebase, refactor to be Expo Image powered by the cache like we are doing elsewhere? */}
      <CachedImage
        source={source ?? ''}
        style={{ width: w, height }}
        thumbnailSource={
          baseUrl && thumbnailSourceSize
            ? baseUrl + imageURL(file, thumbnailSourceSize)
            : ''
        }
        onError={() => {
          // console.log('Error getting image: ' + source);
        }}
      />
    </View>
  );
};

// copied from imageURL in frontend because we were having import issues
// but then I had to add the base URL anyway so whatever
export const imageURL = (
  file: ImageUrlFileInput,
  size: AllSize | ThumbnailVariantToken,
  extension?: string,
) => {
  const { id, fileHash, name, type } = file;
  const path = `image/${id}/${size}/${fileHash}/`;
  if (type === 'Video' && size !== 'raw') {
    return path + 'poster.jpg';
  }

  return path + (extension ? name + extension : name);
};
