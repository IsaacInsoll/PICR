import { memo } from 'react';
import type { ImageProps } from 'expo-image';
import { Image as ExpoImage } from 'expo-image';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import type { PicrFile } from '@shared/types/picr';

type VideoThumbnailFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio' | 'blurHash'
>;

// Basically an Video Thumbnail
const PFileVideoComponent = ({
  file,
  ...props
}: { file: VideoThumbnailFile } & ImageProps) => {
  const uri = useLocalImageUrl(
    {
      id: file.id,
      fileHash: file.fileHash,
      name: file.name ?? undefined,
      type: file.type,
    },
    'md',
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
