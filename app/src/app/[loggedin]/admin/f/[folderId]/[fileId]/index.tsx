import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import {
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { addToFileCache, fileCache } from '@/src/helpers/folderCache';
import { useQuery } from 'urql';
import { PBigImage, useLocalImageUrl } from '@/src/components/PBigImage';
import { atom, useAtom, useAtomValue } from 'jotai';
import { PText } from '@/src/components/PText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { PView } from '@/src/components/PView';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useCallback, useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { useAppFolderLink } from '@/src/components/AppFolderLink';
import { BlurView } from 'expo-blur';
import { useHostname } from '@/src/hooks/useHostname';
import { HeaderButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { navBarIconProps } from '@/src/constants';
import { File } from '@shared/gql/graphql';
export const fileViewFullscreenAtom = atom(false);

interface ItemProps {
  index: number;
  animationValue: Animated.SharedValue<number>;
  setIsZoomed: (value: boolean) => void;
}

export default function AppFileView() {
  const theme = useAppTheme();
  const safe = useSafeAreaInsets();

  const router = useRouter();
  const [fullScreen, setFullScreen] = useAtom(fileViewFullscreenAtom);
  const { folderId, fileId } = useLocalSearchParams<{
    fileId: string;
    folderId: string;
  }>();
  const folderLink = useAppFolderLink({ id: folderId });
  const skeleton = fileCache[fileId];

  // We query folder instead of file because (a) probably already loaded and (b) we will be swiping between images in this gallery
  const [result] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const files = result.data?.folder.files;
  const file = files?.find((f) => f.id == fileId);
  const fileIndex = files?.findIndex((f) => f.id == fileId);

  const { width } = useWindowDimensions();
  const [isZoomed, setIsZoomed] = useState(false);

  const flash = useSharedValue(0);

  const customAnimation = useCallback(
    (value: number) => {
      'worklet';

      const zIndex = Math.round(interpolate(value, [-1, 0, 1], [10, 20, 30]));
      const translateX = Math.round(
        interpolate(value, [-2, 0, 1], [-width, 0, width]),
      );

      return {
        transform: [{ translateX }],
        zIndex,
      };
    },
    [width],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.name ?? 'Loading File...',
          headerRight: () => (
            <AppDownloadFileButton
              file={file}
              onPress={() => {
                flash.value = 0.8;
                flash.value = withTiming(0, {
                  duration: 300,
                  easing: Easing.out(Easing.circle),
                });
              }}
            />
          ),
          // headerShown: !fullScreen, //toggling this causes ugly image jump behaviour
        }}
      />
      <SafeAreaView
        style={{
          flexGrow: 1,
          marginBottom: safe.bottom,
          backgroundColor: theme.tabColor,
        }}
      >
        <Carousel
          loop={false}
          // autoPlay={!isZoomed}
          defaultIndex={fileIndex}
          style={{ flexGrow: 1 }}
          width={width}
          data={files}
          renderItem={({ index, animationValue }) => {
            return (
              <CustomItem
                key={index}
                file={files[index]}
                index={index}
                animationValue={animationValue}
                setIsZoomed={setIsZoomed}
              />
            );
          }}
          customAnimation={customAnimation}
          enabled={!isZoomed}
          onSnapToItem={(index) => {
            const f = files[index];
            addToFileCache(f);
            router.setParams({ folderId, fileId: f.id });
          }}
          scrollAnimationDuration={150}
          windowSize={5} // lazy loading
        />
        <FileBottomBar file={file} />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#fff', zIndex: 1000, opacity: flash },
          ]}
        />
        {/*<Suspense fallback={<AppLoadingIndicator />}>*/}
        {/*  <FolderBody folderId={folderId} key={folderId} />*/}
        {/*</Suspense>*/}
        {/*<PText variant="dimmed">{x}</PText>*/}
      </SafeAreaView>
    </>
  );
}

const FileBottomBar = ({ file }) => {
  const theme = useAppTheme();
  const fullScreen = useAtomValue(fileViewFullscreenAtom);
  // const safe = useSafeAreaInsets();
  if (fullScreen) return null;
  return (
    <BlurView
      intensity={90}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={{
        position: 'absolute',
        // bottom: safe.bottom,
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        // backgroundColor: theme.backgroundColor,
      }}
    >
      <PText variant="code">
        Viewing file {file.id} with ratio {file.imageRatio}
      </PText>
    </BlurView>
  );
};

const CustomItem = ({
  index,
  file,
  animationValue,
  setIsZoomed,
}: ItemProps) => {
  console.log('CustomItem rendering' + index);
  const maskStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animationValue.value,
      [-1, 0, 1],
      ['#00000066', 'transparent', '#00000066'],
    );

    return {
      backgroundColor,
    };
  }, [animationValue]);

  return (
    <View style={{ flex: 1 }}>
      <PBigImage file={file} setIsZoomed={setIsZoomed} />
      <Animated.View
        pointerEvents="none"
        // style={[StyleSheet.absoluteFill]}
        style={[StyleSheet.absoluteFill, maskStyle]}
      />
    </View>
  );
};

const AppDownloadFileButton = ({
  file,
  onPress,
}: {
  file: File;
  onPress?: () => void;
}) => {
  const theme = useAppTheme();
  const uri = useLocalImageUrl(file, 'raw');
  const onClick = () => {
    if (onPress) onPress();
    try {
      MediaLibrary.saveToLibraryAsync(uri).then(() => console.log('Saved!!'));
    } catch (e) {
      console.log('error saving file');
      console.log(e);
    }
  };
  return (
    <HeaderButton onPress={onClick}>
      <Ionicons
        name="download"
        size={25}
        color={theme.brandColor}
        style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
      />
    </HeaderButton>
  );
};
