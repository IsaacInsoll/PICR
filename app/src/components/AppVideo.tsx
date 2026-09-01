import type { PicrFile } from '@shared/types/picr';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuthenticatedServerOrigin } from '@/src/components/AuthenticatedServerOriginProvider';

type AppVideoFile = Pick<
  PicrFile,
  'id' | 'fileHash' | 'name' | 'type' | 'imageRatio'
>;

export const AppVideo = ({
  file,
  width,
}: {
  file: AppVideoFile;
  width?: number;
}) => {
  //todo: lots of overlap with PBigVideo, refactor?

  const origin = useAuthenticatedServerOrigin();
  const safeWidth = width ?? 0;
  const safeRatio = file.imageRatio ?? 1;
  const videoSource = origin.mediaUrl(file, 'raw');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });
  return (
    <VideoView
      style={{ width: safeWidth, height: safeWidth / safeRatio }}
      player={player}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
    />
  );
};
