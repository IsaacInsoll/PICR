import { useMe } from '@/src/hooks/useMe';
import { useTheme } from '@/src/hooks/useTheme';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { PTitle } from '@/src/components/PTitle';
import { Suspense } from 'react';
import { viewFolderQuery } from '@frontend/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';

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
        <PTitle>Folder ID {folderId ?? 'Unknown'}</PTitle>
        <PText>
          Dashboard for U be logged in with folderId {me?.folderId} as{' '}
          {me?.name}
        </PText>
        <Suspense>
          {folderId ? <FolderBody folderId={folderId} /> : null}
        </Suspense>
        <PText variant="dimmed">{x}</PText>
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
  return (
    <>
      <Stack.Screen
        options={{
          // title: f.name,
          // headerStyle: { backgroundColor: '#f4511e' },
          // headerTintColor: '#fff',
          // headerTitleStyle: {
          //   fontWeight: 'bold',
          // },
          headerTitle: f.name,
        }}
      />
      <View style={{ gap: 16 }}>
        {f?.subFolders.map((sf) => (
          <TouchableOpacity
            onPress={() => {
              router.push('./' + sf.id);
            }}
            key={sf.id}
          >
            <PText key={sf.id}>{sf.name}</PText>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};
