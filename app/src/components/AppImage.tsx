import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize';
import type { PicrFile } from '@shared/types/picr';
import type { ImageUrlFileInput } from '@shared/types/ui';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { View } from 'react-native';
import { useState } from 'react';
import { Image as ExpoImage } from 'expo-image';

type AppImageFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio' | 'blurHash'
>;

// Show an image but cache it to device
//TODO: copy PBIGImage and use ExpoImage so we can do BlurRadius prop, and progressively load higher res images?
export const AppImage = ({
  file,
  size,
  width,
}: {
  file: AppImageFile;
  size?: ThumbnailSize;
  width?: number;
}) => {
  const baseUrl = useLoginDetails()?.server;

  const [viewWidth, setViewWidth] = useState(0);
  const w = width ?? viewWidth;
  const height = w / (file.imageRatio ?? 1);

  const sourceSize: ThumbnailSize = size ?? (w > 250 ? 'lg' : 'md');

  const source =
    w === 0 || !baseUrl ? undefined : baseUrl + imageURL(file, sourceSize);

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

// copied from imageURL in frontend because we were having import issues
// but then I had to add the base URL anyway so whatever
export const imageURL = (
  file: ImageUrlFileInput,
  size: AllSize,
  extension?: string,
) => {
  const { id, fileHash, name, type } = file;
  const path = `image/${id}/${size}/${fileHash}/`;
  if (type === 'Video' && size !== 'raw') {
    return path + (extension === '.avif' ? 'poster.avif' : 'poster.jpg');
  }

  return path + (extension ? name + extension : name);
};
