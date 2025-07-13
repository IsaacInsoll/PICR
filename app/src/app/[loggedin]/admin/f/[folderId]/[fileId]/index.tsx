import { Stack, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { View } from 'react-native';
import { Suspense, useState } from 'react';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { fileCache } from '@/src/helpers/folderCache';
import { PText } from '@/src/components/PText';
import { AppImage } from '@/src/components/AppImage';
import { useQuery } from 'urql';
import { viewFileQuery } from '@shared/urql/queries/viewFileQuery';

export default function AppFileView() {
  const theme = useAppTheme();
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const skeleton = fileCache[fileId];
  const [result] = useQuery({ query: viewFileQuery, variables: { fileId } });
  const file = result.data?.file;
  const [width, setWidth] = useState(0);
  console.log(width);
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.name ?? 'Loading File...',
        }}
      />
      <View
        style={{
          backgroundColor: theme.backgroundColor,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setWidth(w);
        }}
      >
        <AppImage file={file} size="lg" width={width} key={file.id} />

        <PText variant="code">
          Viewing file {fileId} with width {width} and ratio {file.imageRatio}
        </PText>
        {/*<Suspense fallback={<AppLoadingIndicator />}>*/}
        {/*  <FolderBody folderId={folderId} key={folderId} />*/}
        {/*</Suspense>*/}
        {/*<PText variant="dimmed">{x}</PText>*/}
      </View>
    </>
  );
}
