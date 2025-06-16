import { CachedImage } from '@georstat/react-native-image-cache';
import { File } from '@frontend/gql/graphql';
import { AllSize, ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { View } from 'react-native';
import { useState } from 'react';
import { Image } from '../../../graphql-types';

// Show an image but cache it to device
export const AppImage = ({
  file,
  size,
}: {
  file: Image;
  size?: ThumbnailSize;
}) => {
  const baseUrl = useLoginDetails()?.server;

  const [viewWidth, setViewWidth] = useState(0);
  const height = viewWidth / (file.imageRatio ?? 1);

  const source =
    viewWidth == 0
      ? null
      : baseUrl + imageURL(file, (size ?? viewWidth > 250) ? 'lg' : 'md');

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w != viewWidth) setViewWidth(w);
      }}
      style={{ height }}
    >
      <CachedImage
        source={source}
        style={{ width: viewWidth, height }}
        thumbnailSource={baseUrl + imageURL(file, 'sm')}
        onError={(e) => {
          console.log('Error getting image: ' + source);
          console.log(e);
        }}
      />
    </View>
  );
};

// copied from imageURL in frontend because we were having import issues
// but then I had to add the base URL anyway so whatever
const imageURL = (
  file: Partial<Pick<File, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
  extension?: string,
) => {
  const { id, fileHash, name, type } = file;
  const path = `image/${id}/${size}/${fileHash}/`;
  if (type == 'Video' && size != 'raw') return path + `joined.jpg`;

  return path + (extension ? name + extension : name);
};
