import { useMe } from '@/src/hooks/useMe';
import { useTheme } from '@/src/hooks/useTheme';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense } from 'react';
import { viewFolderQuery } from '@frontend/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { FlashList } from '@shopify/flash-list';
import { File, Folder } from '@frontend/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import { Ionicons } from '@expo/vector-icons';

export default function f() {
  const me = useMe();
  const theme = useTheme();
  const x = usePathname();
  const { folderId } = useLocalSearchParams();

  if (!folderId) {
    return <Redirect href={x + '/' + me.folderId} />;
  }

  return (
    <ScrollView style={{ backgroundColor: theme.backgroundColor }}>
      <View
        style={{
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
        <Suspense>
          {folderId ? <FolderBody folderId={folderId} /> : null}
        </Suspense>
        {/*<PText variant="dimmed">{x}</PText>*/}
      </View>
    </ScrollView>
  );
}

const FolderBody = ({ folderId }: { folderId: string }) => {
  const router = useRouter();
  const [result, requery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const f = result.data?.folder;
  if (!f) return <PText>Not Found</PText>;
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

      <FlashList
        style={{ flex: 1, backgroundColor: '#0f0', width: '100%', flexGrow: 1 }}
        data={items}
        renderItem={({ item, index }) => {
          const isFolder = item['__typename'] == 'Folder';

          return isFolder ? (
            <FlashFolder folder={item} key={item.id} />
          ) : (
            <FlashFile file={item} key={item.id} />
          );
        }}
      />
    </>
  );
};

const FlashFolder = ({ folder }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => {
        router.push('./' + folder.id);
      }}
    >
      <PText style={[styles.flashView, { backgroundColor: '#00f' }]}>
        {folder.id} {folder.name}
      </PText>
    </TouchableOpacity>
  );
};

const FlashFile = ({ file }: { file: File }) => {
  const router = useRouter();
  const isImage = file.type == 'Image';
  return (
    <TouchableOpacity
    // onPress={() => {
    //   router.push('./' + folder.id);
    // }}
    >
      {isImage ? <AppImage file={file} /> : null}
      <PText style={[styles.flashView, { backgroundColor: '#00f' }]}>
        {file.id} {file.type} {file.name}
      </PText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flashView: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
