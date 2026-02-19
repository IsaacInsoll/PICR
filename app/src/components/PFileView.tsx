import { memo } from 'react';
import { ImageProps } from 'expo-image';
import { ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { PFileVideo } from '@/src/components/PFileVideo';
import { StyleSheet, View } from 'react-native';
import { PFileImage } from '@/src/components/PFileImage';
import { FolderIcon } from '@/src/components/AppIcons';
import { getInitialsColor } from '@/src/helpers/get-initials-color';
import { FileType } from '@shared/gql/graphql';

type ThumbnailMedia = {
  __typename?: string;
  id?: string;
  fileHash?: string;
  name?: string;
  type?: FileType | null;
  folderId?: string;
  imageRatio?: number | null;
  blurHash?: string | null;
};

type ThumbnailFolder = {
  __typename: 'Folder';
  id: string;
  name: string;
  heroImage?: ThumbnailMedia | null;
};

const isThumbnailFolder = (
  file: ThumbnailMedia | ThumbnailFolder | null | undefined,
): file is ThumbnailFolder => file?.__typename === 'Folder';

// Used for thumbnails and gallery, presents image/video/folder thumbnail
const PFileViewComponent = ({
  file,
  size,
  variant,
  ...props
}: {
  file?: ThumbnailMedia | ThumbnailFolder | null;
  size: ThumbnailSize;
  variant?: 'rounded-fit';
} & ImageProps) => {
  // I had this in here and it worked, but I prefer the idea of the parent deciding how to render this (IE: if it's a folder)
  // as different views have different needs (EG: blurring, overlaying text etc)

  const p: ImageProps =
    variant === 'rounded-fit'
      ? {
          contentFit: 'cover',
          style: [styles.roundedFit, props.style],
          ...props,
        }
      : { ...props };

  const isFolder = isThumbnailFolder(file);
  //     const uri = useLocalImageUrl(isFolder ? file.heroImage : file, size);
  if (file?.__typename === 'Video') {
    return <PFileVideo {...p} file={file} />;
  }
  if (file?.__typename === 'Image') {
    return <PFileImage size={size} {...p} file={file} />;
  }

  if (isFolder && file.heroImage?.type === 'Image') {
    return <PFileImage size={size} {...p} file={file.heroImage} />;
  }

  if (isFolder) return <PFileFolderThumbnail {...p} folder={file} />;

  return <View {...p} />;
};

export const PFileView = memo(PFileViewComponent);
PFileView.displayName = 'PFileView';

export const PFileFolderThumbnail = ({
  folder,
  ...props
}: {
  folder: ThumbnailFolder;
} & ImageProps) => {
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

const styles = StyleSheet.create({
  roundedFit: { borderRadius: 12, overflow: 'hidden', width: 80, height: 80 },
});
