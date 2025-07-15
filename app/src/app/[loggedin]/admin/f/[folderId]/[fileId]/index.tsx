import { Stack, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { SafeAreaView, View } from 'react-native';
import { fileCache } from '@/src/helpers/folderCache';
import { useQuery } from 'urql';
import { viewFileQuery } from '@frontend/urql/queries/viewFileQuery';
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

export const fileViewFullscreenAtom = atom(false);

export default function AppFileView() {
  const theme = useAppTheme();
  const [fullScreen, setFullScreen] = useAtom(fileViewFullscreenAtom);
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const skeleton = fileCache[fileId];
  const [result] = useQuery({ query: viewFileQuery, variables: { fileId } });
  const file = result.data?.file;

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
        <PaginatedBigImage file={file} />
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
