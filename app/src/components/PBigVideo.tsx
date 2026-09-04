import type { ViewStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import type { Video } from '@shared/gql/graphql';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useEffect } from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuthenticatedServerOrigin } from '@/src/components/AuthenticatedServerOriginProvider';

export const PBigVideo = ({
  file,
  style,
  setIsZoomed,
  selected,
}: {
  file: Video;
  style?: ViewStyle;
  setIsZoomed: (z: boolean) => void;
  selected?: boolean;
}) => {
  const theme = useAppTheme();

  const origin = useAuthenticatedServerOrigin();
  const videoSource = origin.mediaUrl(file, 'raw');
  // console.log('videoSource', file.imageRatio, videoSource);
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  //start playing if focused, and pause if we swipe away from this video
  useEffect(() => {
    if (selected && !isPlaying) player.play();
    if (!selected && isPlaying) player.pause();
  }, [file.id, isPlaying, player, selected]);

  return (
    <View
      accessibilityLabel="Video player"
      testID={isPlaying ? 'video-player-playing' : 'video-player-paused'}
      style={[styles.contentContainer, { backgroundColor: theme.tabColor }]}
    >
      <VideoView
        style={styles.video}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />
      {/*<View>*/}
      {/*  <Button*/}
      {/*    title={isPlaying ? 'Pause' : 'Play'}*/}
      {/*    onPress={() => {*/}
      {/*      if (isPlaying) {*/}
      {/*        player.pause();*/}
      {/*      } else {*/}
      {/*        player.play();*/}
      {/*      }*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</View>*/}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor:
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
