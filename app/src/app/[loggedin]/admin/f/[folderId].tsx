import { useMe } from '@/src/hooks/useMe';
import { useTheme } from '@/src/hooks/useTheme';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense } from 'react';
import { viewFolderQuery } from '@frontend/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { File, Folder } from '@frontend/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import { AppFolderLink } from '@/src/components/AppFolderLink';
import { folderCache } from '@/src/helpers/folderCache';

export default function FolderMasterView() {
  const me = useMe();
  const theme = useTheme();
  const x = usePathname();
  const { folderId } = useLocalSearchParams();
  const folderName = folderCache[folderId]?.name ?? undefined;

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
          headerTitle: folderName ?? 'Loading Folder...',
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
      >
        {/*<Stack.Screen options={{ headerTitle: 'PICR3' }} />*/}
        {/*<PTitle>Folder ID {folderId ?? 'Unknown'}</PTitle>*/}
        {/*<PText>*/}
        {/*  Dashboard for U be logged in with folderId {me?.folderId} as{' '}*/}
        {/*  {me?.name}*/}
        {/*</PText>*/}
        <Suspense fallback={<PText>Loading folder {folderId}</PText>}>
          <FolderBody folderId={folderId} key={folderId} />
        </Suspense>
        {/*<PText variant="dimmed">{x}</PText>*/}
      </View>
    </>
  );
}

const FolderBody = ({ folderId }: { folderId: string }) => {
  // return <PText>FolderBody for {folderId}</PText>;
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
      <Stack.Screen
        options={{
          headerTitle: f.name,
          // headerLeft: () => (
          //   <Ionicons
          //     name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back-sharp'}
          //     size={25}
          //     color="white"
          //     onPress={() => router.back()}
          //   />
          // ),
        }}
      />

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

const FlashFile = ({ file }: { file: File }) => {
  const isImage = file.type == 'Image';
  return (
    <TouchableOpacity
    // onPress={() => {
    //   router.push('./' + folder.id);
    // }}
    >
      {isImage ? (
        <Suspense fallback={<PText>Loading image</PText>}>
          <AppImage file={file} />
        </Suspense>
      ) : null}
      <PText style={[styles.flashView]}>
        {file.id} {file.type} {file.name}
      </PText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flashView: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
