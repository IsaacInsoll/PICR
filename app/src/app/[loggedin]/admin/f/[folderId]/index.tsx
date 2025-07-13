import { useMe } from '@/src/hooks/useMe';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { File, Folder, Image } from '@frontend/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import {
  AppFileLink,
  AppFolderLink,
  useAppFileLink,
} from '@/src/components/AppFolderLink';
import { folderCache } from '@/src/helpers/folderCache';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { AspectView } from '@/src/components/AspectView';

export default function FolderMasterView() {
  const me = useMe();
  const theme = useAppTheme();
  const x = usePathname();
  const { folderId } = useLocalSearchParams();
  const skeleton = folderCache[folderId];

  if (!folderId) {
    console.log(
      '[folderId.tsx] redirecting to home folder as no folder specified',
    );
    return <Redirect href={x + '/' + me.folderId} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.name ?? 'Loading Folder...',
        }}
      />
      <View style={{ ...styles.main, backgroundColor: theme.backgroundColor }}>
        <Suspense fallback={<AppLoadingIndicator />}>
          <FolderBody folderId={folderId} key={folderId} />
        </Suspense>
        {/*<PText variant="dimmed">{x}</PText>*/}
      </View>
    </>
  );
}

const FolderBody = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });

  const f = result.data?.folder;
  if (!f) {
    return <PText>Folder {folderId} Not Found</PText>;
  }
  const items = [...f.subFolders, ...f.files];
  return (
    <>
      <Stack.Screen options={{ headerTitle: f.name }} />

      <FlatList
        style={{ flex: 1, width: '100%', flexGrow: 1 }}
        data={items}
        numColumns={1}
        keyExtractor={(item) => item['__typename'] + item.id}
        renderItem={renderItem}
      />
    </>
  );
};

const renderItem = ({ item, index }) => {
  const isFolder = item['__typename'] == 'Folder';

  return isFolder ? (
    <FlashFolder folder={item} key={item.id} />
  ) : (
    <FlashFile file={item} key={item.id} />
  );
};

const FlashFolder = ({ folder }) => {
  return (
    <AppFolderLink folder={folder} asChild>
      <TouchableOpacity
      // onPress={() => {
      //   router.navigate('./' + folder.id, { withAnchor: true });
      // }}
      >
        {folder.heroImage?.id ? <AppImage file={folder.heroImage} /> : null}
        <PText style={[styles.flashView]}>
          {folder.id} {folder.name}
        </PText>
      </TouchableOpacity>
    </AppFolderLink>
  );
};

const FlashFile = ({ file }: { file: File | Image }) => {
  const isImage = file.type == 'Image';

  return (
    <AppFileLink file={file} asChild>
      <TouchableOpacity
      // onPress={() => {
      //   router.push('./' + folder.id);
      // }}
      >
        {isImage ? (
          <AspectView ratio={file.imageRatio}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppImage file={file} />
            </Suspense>
          </AspectView>
        ) : null}
        <PText style={[styles.flashView]}>
          {file.id} {file.type} {file.name}
        </PText>
      </TouchableOpacity>
    </AppFileLink>
  );
};

const styles = StyleSheet.create({
  flashView: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});
