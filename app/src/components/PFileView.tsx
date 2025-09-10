import { memo } from 'react';
import { ImageProps } from 'expo-image';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { File, Folder, Video, Image } from '@shared/gql/graphql';
import { PFileVideo } from '@/src/components/PFileVideo';
import { View } from 'react-native';
import { PFileImage } from '@/src/components/PFileImage';
import { FolderIcon } from '@/src/components/AppIcons';
import { getInitialsColor } from '@/src/helpers/get-initials-color';

// Used for thumbnails and gallery, presents image/video/folder thumbnail
export const PFileView = memo(
  ({
    file,
    size,
    ...props
  }: {
    file?: File | Image | Video | Folder | null;
    size: ThumbnailSize;
  } & ImageProps) => {
    // I had this in here and it worked, but I prefer the idea of the parent deciding how to render this (IE: if it's a folder)
    // as different views have different needs (EG: blurring, overlaying text etc)
    const isFolder = file?.__typename == 'Folder';
    //     const uri = useLocalImageUrl(isFolder ? file.heroImage : file, size);
    if (file?.type == 'Video') {
      return <PFileVideo {...props} file={file} />;
    }
    if (file?.type == 'Image') {
      return <PFileImage size={size} {...props} file={file} />;
    }

    if (isFolder && file.heroImage?.type == 'Image') {
      return <PFileImage size={size} {...props} file={file.heroImage} />;
    }

    if (isFolder) return <PFileFolderThumbnail {...props} folder={file} />;

    return <View {...props} />;
  },
);

export const PFileFolderThumbnail = ({
  folder,
  ...props
}: {
  folder: Folder;
}) => {
  const color = getInitialsColor(folder.name);
  return (
    <View
      {...props}
      style={[
        props.style,
        {
          backgroundColor: color + '11',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <FolderIcon size={32} color={color} />
    </View>
  );
};
