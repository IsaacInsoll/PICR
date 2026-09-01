import { memo } from 'react';
import type { ImageProps } from 'expo-image';
import { PFileVideo } from '@/src/components/PFileVideo';
import { StyleSheet, View } from 'react-native';
import { PFileImage } from '@/src/components/PFileImage';
import { FolderIcon } from '@/src/components/AppIcons';
import { getInitialsColor } from '@/src/helpers/get-initials-color';
import type { ThumbnailFolderItem, ThumbnailItem } from '@shared/types/ui';

const isThumbnailFolder = (
  file: ThumbnailItem | null | undefined,
): file is ThumbnailFolderItem => file?.__typename === 'Folder';

// Used for thumbnails and gallery, presents image/video/folder thumbnail
const PFileViewComponent = ({
  file,
  targetWidth,
  variant,
  ...props
}: {
  file?: ThumbnailItem | null;
  targetWidth: number;
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
  if (file?.__typename === 'Video') {
    return <PFileVideo {...p} file={file} targetWidth={targetWidth} />;
  }
  if (file?.__typename === 'Image') {
    return <PFileImage targetWidth={targetWidth} {...p} file={file} />;
  }

  if (isFolder && file.heroImage?.type === 'Image') {
    return (
      <PFileImage
        targetWidth={targetWidth}
        {...p}
        file={{ ...file.heroImage, name: file.heroImage.name ?? undefined }}
      />
    );
  }
  if (isFolder && file.heroImage?.type === 'Video') {
    return (
      <PFileVideo
        {...p}
        targetWidth={targetWidth}
        file={{ ...file.heroImage, name: file.heroImage.name ?? undefined }}
      />
    );
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
  folder: ThumbnailFolderItem;
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
