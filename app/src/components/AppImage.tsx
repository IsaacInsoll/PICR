import { CachedImage } from '@georstat/react-native-image-cache';
import { File } from '@shared/gql/graphql';
import { AllSize, ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { View } from 'react-native';
import { useState } from 'react';
import { Image } from '../../../graphql-types';

// Show an image but cache it to device
//TODO: copy PBIGImage and use ExpoImage so we can do BlurRadius prop, and progressively load higher res images?
export const AppImage = ({
  file,
  size,
  width,
}: {
  file: Image;
  size?: ThumbnailSize;
  width?: number;
}) => {
  const baseUrl = useLoginDetails()?.server;

  const [viewWidth, setViewWidth] = useState(0);
  const w = width ?? viewWidth;
  const height = w / (file.imageRatio ?? 1);

  const sourceSize: ThumbnailSize = size ?? (w > 250 ? 'lg' : 'md');

  const source = w == 0 ? null : baseUrl + imageURL(file, sourceSize);

  // console.log(width, viewWidth, height, file.fileHash);

  return (
    <View
      onLayout={(e) => {
        const ww = e.nativeEvent.layout.width;
        // console.log('AppImage layout w is ', ww);
        if (!width && ww != viewWidth) setViewWidth(ww);
      }}
      style={{ height }}
    >
      {/*TODO: this is only instance of CachedImage in entire codebase, refactor to be Expo Image powered by the cache like we are doing elsewhere? */}
      <CachedImage
        source={source}
        style={{ width: w, height }}
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
export const imageURL = (
  file: Partial<Pick<File, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
  extension?: string,
) => {
  const { id, fileHash, name, type } = file;
  const path = `image/${id}/${size}/${fileHash}/`;
  if (type == 'Video' && size != 'raw') return path + `joined.jpg`;

  return path + (extension ? name + extension : name);
};
