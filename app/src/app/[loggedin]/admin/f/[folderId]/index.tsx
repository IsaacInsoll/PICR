import { useMe } from '@/src/hooks/useMe';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense, useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { File, Folder, Image } from '@frontend/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import { AppFileLink, AppFolderLink } from '@/src/components/AppFolderLink';
import { folderCache } from '@/src/helpers/folderCache';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { AspectView } from '@/src/components/AspectView';
import { PView } from '@/src/components/PView';

export default function FolderMasterView() {
  const me = useMe();
  const theme = useAppTheme();
  const x = usePathname();
  const { folderId } = useLocalSearchParams();
  const skeleton = folderCache[folderId];
  const [width, setViewWidth] = useState(0);

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
        <PView style={{ width: '100%', flex: 1 }} onWidthChange={setViewWidth}>
          <Suspense fallback={<AppLoadingIndicator />}>
            <FolderBody folderId={folderId} key={folderId} width={width} />
          </Suspense>
          {/*<PText variant="dimmed">{x}</PText>*/}
        </PView>
      </View>
    </>
  );
}

const FolderBody = ({
  folderId,
  width,
}: {
  folderId: string;
  width: number;
}) => {
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
        renderItem={(props) => renderItem({ ...props, width })}
      />
    </>
  );
};

const renderItem = ({ item, index, width }) => {
  const isFolder = item['__typename'] == 'Folder';

  return isFolder ? (
    <FlashFolder folder={item} key={item.id} width={width} />
  ) : (
    <FlashFile file={item} key={item.id} width={width} />
  );
};

const FlashFolder = ({ folder, width }) => {
  return (
    <AppFolderLink folder={folder} asChild>
      <TouchableOpacity
      // onPress={() => {
      //   router.navigate('./' + folder.id, { withAnchor: true });
      // }}
      >
        {folder.heroImage?.id ? (
          <AppImage file={folder.heroImage} width={width} />
        ) : null}
        <PText style={[styles.flashView]}>
          {folder.id} {folder.name}
        </PText>
      </TouchableOpacity>
    </AppFolderLink>
  );
};

const FlashFile = ({ file, width }: { file: File | Image; width: number }) => {
  const isImage = file.type == 'Image';

  return (
    <AppFileLink file={file} asChild>
      <TouchableOpacity
      // onPress={() => {
      //   router.push('./' + folder.id);
      // }}
      >
        {isImage ? (
          <AspectView ratio={file.imageRatio} width={width}>
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
