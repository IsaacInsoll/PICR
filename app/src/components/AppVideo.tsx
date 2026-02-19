import { Video } from '@shared/gql/graphql';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useVideoPlayer, VideoView } from 'expo-video';
import { imageURL } from '@/src/components/AppImage';

export const AppVideo = ({ file, width }: { file: Video; width?: number }) => {
  //todo: lots of overlap with PBigVideo, refactor?

  const baseUrl = useLoginDetails()?.server ?? '';
  const safeWidth = width ?? 0;
  const safeRatio = file.imageRatio ?? 1;
  const videoSource = baseUrl + imageURL(file, 'raw');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });
  return (
    <VideoView
      style={{ width: safeWidth, height: safeWidth / safeRatio }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};
