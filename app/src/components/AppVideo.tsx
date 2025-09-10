import { CachedImage } from '@georstat/react-native-image-cache';
import { File, Video } from '@shared/gql/graphql';
import { AllSize, ThumbnailSize } from '@frontend/helpers/thumbnailSize';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { View } from 'react-native';
import { useState } from 'react';
import { Image } from '../../../graphql-types';
import { useVideoPlayer, VideoView } from 'expo-video';
import { imageURL } from '@/src/components/AppImage';

export const AppVideo = ({ file, width }: { file: Video; width?: number }) => {
  //todo: lots of overlap with PBigVideo, refactor?

  const baseUrl = useLoginDetails()?.server;
  const videoSource = baseUrl + imageURL(file, 'raw');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });
  console.log(file);
  console.log('videoSource', width, width / file?.imageRatio, videoSource);
  return (
    <VideoView
      style={{ width, height: width / file?.imageRatio }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};
