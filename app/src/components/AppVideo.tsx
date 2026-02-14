import { Video } from '@shared/gql/graphql';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useVideoPlayer, VideoView } from 'expo-video';
import { imageURL } from '@/src/components/AppImage';

export const AppVideo = ({ file, width }: { file: Video; width?: number }) => {
  //todo: lots of overlap with PBigVideo, refactor?

  const baseUrl = useLoginDetails()?.server;
  const videoSource = baseUrl + imageURL(file, 'raw');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });
  return (
    <VideoView
      style={{ width, height: width / file?.imageRatio }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};
