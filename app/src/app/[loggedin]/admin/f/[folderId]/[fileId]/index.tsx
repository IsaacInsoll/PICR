import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { addToFileCache, fileCache } from '@/src/helpers/folderCache';
import { useQuery } from 'urql';
import { PBigImage, useLocalImageUrl } from '@/src/components/PBigImage';
import { atom, useAtom, useSetAtom } from 'jotai';
import * as MediaLibrary from 'expo-media-library';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useCallback, useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { HeaderButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { navBarIconProps } from '@/src/constants';
import { ViewFolderQuery } from '@shared/gql/graphql';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import {
  getHeadingFontFamilyForLevel,
  normalizeHeadingFontKey,
} from '@/src/helpers/headingFont';
import { FileCommentsBottomSheet } from '@/src/components/FileCommentsBottomSheet';
import { FolderBrandingProvider } from '@/src/components/FolderBrandingProvider';
import { useScreenOrientation } from '@/src/hooks/useScreenOrientation';
import { PTitle } from '@/src/components/PTitle';
import { PBigVideo } from '@/src/components/PBigVideo';
import { useNavigationScreenOptions } from '@/src/hooks/useNavigationScreenOptions';
import { FileInfoBottomSheet } from '@/src/components/FileInfoBottomSheet';

interface ItemProps {
  index: number;
  animationValue: SharedValue<number>;
  setIsZoomed: (value: boolean) => void;
}

type ViewFolderFile = ViewFolderQuery['folder']['files'][number];

const showCommentsAtom = atom(false);
const showFileInfoAtom = atom(false);

export default function AppFileView() {
  const theme = useAppTheme();

  const router = useRouter();
  const [fullScreen] = useAtom(fileViewFullscreenAtom);
  const params = useLocalSearchParams<{
    fileId?: string | string[];
    folderId?: string | string[];
  }>();
  const fileId =
    (Array.isArray(params.fileId) ? params.fileId[0] : params.fileId) ?? '';
  const folderId = Array.isArray(params.folderId)
    ? params.folderId[0]
    : (params.folderId ?? '');
  const skeleton = fileCache[fileId];

  // We query folder instead of file because (a) probably already loaded and (b) we will be swiping between images in this gallery
  const [result] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const files = result.data?.folder.files ?? [];
  const file = files.find((f) => f.id === fileId);
  const fileIndex = files.findIndex((f) => f.id === fileId);
  const branding = result.data?.folder?.branding;
  const fontKey = normalizeHeadingFontKey(branding?.headingFontKey);
  const headerFontFamily = getHeadingFontFamilyForLevel(fontKey, 3);

  const [showComments, setShowComments] = useAtom(showCommentsAtom);
  const [showInfo, setShowInfo] = useAtom(showFileInfoAtom);
  const selectedFile = file;

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

  const [orientation] = useScreenOrientation();
  const headerOptions = useNavigationScreenOptions();
  const headerTitleStyle = StyleSheet.flatten([
    headerOptions.headerTitleStyle,
    { fontFamily: headerFontFamily },
  ]);

  return (
    <FolderBrandingProvider fontKey={fontKey}>
      <View style={{ backgroundColor: theme.tabColor }}>
        <Stack.Screen
          options={{
            ...headerOptions,
            headerTransparent: true, //overriding the 'false on android' so when we toggle it on and off there is no layout shift
            headerTitle: skeleton?.name ?? 'Loading File...',
            headerTitleStyle,
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                {file ? (
                  <>
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
                    <AppFileCommentsButton file={file} />
                    <AppFileInfoButton file={file} />
                  </>
                ) : null}
              </View>
            ),
            headerShown: !fullScreen, //toggling this causes ugly image jump behaviour
          }}
        />
        {/* Don't do safe area view because then the image can't 'fill' the screen (both bottom and under transparent top nav). If you want a bottom bar then float it over the top, not inside safe area view */}
        <Carousel
          loop={false}
          // autoPlay={!isZoomed}
          key={orientation} //force rerender if screen changes orientation, otherwise it's blank
          defaultIndex={fileIndex >= 0 ? fileIndex : 0}
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
            if (!f) return;
            addToFileCache({ id: f.id, name: f.name, fileHash: f.fileHash });
            router.setParams({ folderId, fileId: f.id });
          }}
          scrollAnimationDuration={150}
          windowSize={10} // lazy loading
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#fff', zIndex: 1000, opacity: flash },
          ]}
        />
        {selectedFile ? (
          <FileCommentsBottomSheet
            file={selectedFile}
            open={showComments}
            onClose={() => setShowComments(false)}
          />
        ) : null}
        {selectedFile ? (
          <FileInfoBottomSheet
            file={selectedFile}
            open={showInfo}
            onClose={() => setShowInfo(false)}
          />
        ) : null}
      </View>
    </FolderBrandingProvider>
  );
}

const CustomItem = ({
  index,
  file,
  animationValue,
  setIsZoomed,
}: ItemProps & { file?: ViewFolderFile }) => {
  const { fileId } = useLocalSearchParams<{
    fileId: string;
    folderId: string;
  }>();
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
  if (!file) return null;
  const isSelected = file.id === fileId;

  return (
    <View style={{ flex: 1 }}>
      {file.__typename === 'Image' ? (
        <PBigImage file={file} setIsZoomed={setIsZoomed} />
      ) : file.__typename === 'Video' ? (
        <PBigVideo
          file={file}
          setIsZoomed={setIsZoomed}
          selected={isSelected}
        />
      ) : (
        <PTitle level={4} style={{ color: 'red' }}>
          TODO File {file.name} of type {file.type} not supported (yet!)
        </PTitle>
      )}
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
  file: ViewFolderFile;
  onPress?: () => void;
}) => {
  const theme = useAppTheme();
  const uri = useLocalImageUrl(file, 'raw');
  const onClick = async () => {
    if (onPress) onPress();
    if (!uri) return;
    try {
      //saveToLibraryAsync was stripping metadata? The following line is untested (so far!)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Media library access is needed to perform this action.',
        );
      } else {
        await MediaLibrary.createAssetAsync(uri);
        console.log('Saved!!');
      }
      // MediaLibrary.saveToLibraryAsync(uri).then(() => console.log('Saved!!'));
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

const AppFileCommentsButton = ({ file }: { file: ViewFolderFile }) => {
  const setShowComments = useSetAtom(showCommentsAtom);
  const { totalComments } = file;
  const theme = useAppTheme();
  return (
    <HeaderButton onPress={() => setShowComments((c) => !c)}>
      <Ionicons
        name={
          totalComments && totalComments > 0
            ? 'chatbox-ellipses-outline'
            : 'chatbox-outline'
        }
        size={25}
        color={theme.brandColor}
        style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
      />
    </HeaderButton>
  );
};

const AppFileInfoButton = ({ file }: { file: ViewFolderFile }) => {
  const setShowInfo = useSetAtom(showFileInfoAtom);
  // const { totalComments } = file;
  const theme = useAppTheme();
  return (
    <HeaderButton onPress={() => setShowInfo((c) => !c)}>
      <Ionicons
        name="information-circle-outline"
        size={25}
        color={theme.brandColor}
        style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
      />
    </HeaderButton>
  );
};
