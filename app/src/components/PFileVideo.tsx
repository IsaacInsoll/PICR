import { memo } from 'react';
import type { ImageProps } from 'expo-image';
import { Image as ExpoImage } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import type { PicrFile } from '@shared/types/picr';
import { useThumbnailVariants } from '@/src/hooks/useMe';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';

type VideoThumbnailFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio' | 'blurHash'
>;

// Basically an Video Thumbnail
const PFileVideoComponent = ({
  file,
  targetWidth,
  ...props
}: { file: VideoThumbnailFile; targetWidth: number } & ImageProps) => {
  const thumbnailVariants = useThumbnailVariants();
  const sourceSize = thumbnailRouteSizeForWidth(thumbnailVariants, targetWidth);
  const uri = useLocalImageUrl(
    {
      id: file.id,
      fileHash: file.fileHash,
      name: file.name ?? undefined,
      type: file.type,
    },
    sourceSize,
  );
  const blurHash = file.blurHash ?? undefined;
  if (!uri) return null;

  return (
    <ExpoImage
      {...props}
      source={{ uri }}
      placeholder={blurHash}
      contentFit={props.contentFit ?? 'cover'}
      onError={(_e) => {
        /* console.log(_e) */
      }}
    />
  );
};

export const PFileVideo = memo(PFileVideoComponent);
PFileVideo.displayName = 'PFileVideo';
