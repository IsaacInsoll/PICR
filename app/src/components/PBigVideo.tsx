import { Button, View, ViewStyle, StyleSheet } from 'react-native';
import { Video } from '@shared/gql/graphql';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { imageURL } from '@/src/components/AppImage';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useEffect } from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';

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

  const baseUrl = useLoginDetails()?.server;
  const videoSource = baseUrl + imageURL(file, 'raw');
  console.log('videoSource', file.imageRatio, videoSource);
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
  }, [file.id, selected]);

  return (
    <View
      style={[styles.contentContainer, { backgroundColor: theme.tabColor }]}
    >
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
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
