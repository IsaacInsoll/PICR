import { Stack, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Image, SafeAreaView } from 'react-native';
import { fileCache } from '@/src/helpers/folderCache';
import { useQuery } from 'urql';
import { PBigImage } from '@/src/components/PBigImage';
import { atom, useAtom, useAtomValue } from 'jotai';
import { PText } from '@/src/components/PText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PView } from '@/src/components/PView';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import {
  ImageGallery,
  ImageObject,
} from '@/src/components/react-native-image-gallery';
import { AppImage, imageURL } from '@/src/components/AppImage';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';

export const fileViewFullscreenAtom = atom(false);

export default function AppFileView() {
  const theme = useAppTheme();
  const [fullScreen, setFullScreen] = useAtom(fileViewFullscreenAtom);
  const { folderId, fileId } = useLocalSearchParams<{
    fileId: string;
    folderId: string;
  }>();
  const skeleton = fileCache[fileId];

  // We query folder instead of file because (a) probably already loaded and (b) we will be swiping between images in this gallery
  const [result] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const baseUrl = useLoginDetails()?.server;

  const files = result.data?.folder.files;
  const file = files.find((f) => f.id == fileId);

  const images = files.map((f) => ({
    ...f,
    thumbUrl: baseUrl + imageURL(file, 'sm'),
  })); //.map((f)=> {id: f.id, url: 123});

  // I didn't use <AppImage> here as it does all the weird 'detect width' stuff
  const renderCustomImage = (file: ImageObject) => {
    return (
      <CachedImage
        source={baseUrl + imageURL(file, 'raw')}
        style={{ width: '100%', height: '100%' }}
        thumbnailSource={baseUrl + imageURL(file, 'sm')}
      />
    );
  };

  //this kept causing weird behavior so i'm using the default
  // const renderCustomThumb = (image: ImageObject, index, activeIndex) => {
  //   const selected = activeIndex === index;
  //   return (
  //     <CachedImage
  //       source={baseUrl + imageURL(file, 'sm')}
  //       style={{
  //         width: 48,
  //         height: 48,
  //         borderRadius: 12,
  //         marginRight: 10,
  //         borderWidth: selected ? 3 : 0,
  //         borderColor: theme.brandColor, //TODO: the folders brand color
  //         // opacity: selected ? 1 : 0.3,
  //       }}
  //       resizeMode="cover"
  //       // thumbnailSource={baseUrl + imageURL(file, 'sm')}
  //       // activeIndex === index
  //       //   ? [
  //       //       styles.thumb,
  //       //       styles.activeThumb,
  //       //       { borderColor: thumbColor },
  //       //       { width: thumbSize, height: thumbSize },
  //       //     ]
  //       //   : [styles.thumb, { width: thumbSize, height: thumbSize }]
  //     />
  //   );
  // };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.name ?? 'Loading File...',
          headerShown: !fullScreen,
        }}
      />
      <SafeAreaView
        style={{
          backgroundColor: theme.tabColor, //'#000', // theme.backgroundColor we want absolute black, not dark grey
          flex: 1,
          gap: 16,
        }}
      >
        {/*<AppImage file={file} size="lg" width={width} key={file.id} />*/}
        <ImageGallery
          close={() => {}}
          isOpen={true}
          images={images}
          renderCustomImage={renderCustomImage}
          // TODO: thumbColor folder brand color
          hideThumbs={fullScreen}
        />

        {/*<PaginatedBigImage file={file} />*/}
        <FileBottomBar file={file} />
        {/*<Suspense fallback={<AppLoadingIndicator />}>*/}
        {/*  <FolderBody folderId={folderId} key={folderId} />*/}
        {/*</Suspense>*/}
        {/*<PText variant="dimmed">{x}</PText>*/}
      </SafeAreaView>
    </>
  );
}

const PaginatedBigImage = ({ file }) => {
  const [transform, setTransform] = useState(0);
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd((evt) => {
      console.log('fling left');
    });
  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd((evt) => {
      console.log('fling right');
    });

  const gestures = Gesture.Race(flingLeft, flingRight);
  return (
    <GestureDetector gesture={gestures}>
      <PBigImage file={file} />
    </GestureDetector>
  );
};

const FileBottomBar = ({ file }) => {
  const theme = useAppTheme();
  const fullScreen = useAtomValue(fileViewFullscreenAtom);
  const safe = useSafeAreaInsets();
  if (fullScreen) return null;
  return (
    <PView
      style={{
        position: 'absolute',
        bottom: safe.bottom,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: theme.backgroundColor,
      }}
    >
      <PText variant="code">
        Viewing file {file.id} with ratio {file.imageRatio}
      </PText>
    </PView>
  );
};
