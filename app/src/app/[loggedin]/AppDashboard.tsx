import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useMe } from '@/src/hooks/useMe';
import { useQuery } from 'urql';
import { recentUsersQuery } from '@frontend/urql/queries/recentUsersQuery';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppDateDisplay } from '@/src/components/AppDateDisplay';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppFolderLink } from '@/src/components/AppFolderLink';
import { HeaderButton } from '@react-navigation/elements';
import { readAllFoldersQuery } from '@frontend/urql/queries/readAllFoldersQuery';
import { FolderFragmentFragment, FoldersSortType } from '@frontend/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import { useHostname } from '@/src/hooks/useHostname';
import { navBarIconProps } from '@/src/constants';

const HomeFolderButton = () => {
  const me = useMe();
  const theme = useAppTheme();
  return (
    <HeaderButton>
      <AppFolderLink folder={{ id: me.folderId, name: 'Home' }} asChild={true}>
        <Ionicons
          name="folder-outline"
          size={25}
          color={theme.brandColor}
          style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
        />
      </AppFolderLink>
    </HeaderButton>
  );
};
const SettingsButton = () => {
  const theme = useAppTheme();
  const hostname = useHostname();
  return (
    <HeaderButton>
      <Link href={hostname + '/admin/settings'} asChild={true}>
        <Ionicons
          name="settings"
          size={25}
          color={theme.brandColor}
          style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
        />
      </Link>
    </HeaderButton>
  );
};

export default function AppDashboard() {
  const me = useMe();
  const theme = useAppTheme();

  const [recentUsersResult, requery] = useQuery({
    query: recentUsersQuery,
    variables: { folderId: me?.folderId },
    // context: { suspense: false },
  });

  const [recentFoldersResult, requery2] = useQuery({
    query: readAllFoldersQuery,
    variables: {
      id: me?.folderId,
      limit: 10,
      sort: FoldersSortType.FolderLastModified,
    },
  });

  const doRefresh = () => {
    requery({ requestPolicy: 'network-only' });
    requery2({ requestPolicy: 'network-only' });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'PICR',
          headerLeft: () => <HomeFolderButton />,
          headerRight: () => <SettingsButton />,
        }}
      />
      <ScrollView
        style={{
          backgroundColor: theme.backgroundColor,
        }}
        refreshControl={
          <RefreshControl
            refreshing={recentUsersResult.fetching}
            onRefresh={doRefresh}
          />
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 32,
            width: '100%',
            paddingHorizontal: 32,
          }}
        >
          {recentUsersResult.data ? (
            <RecentUsers result={recentUsersResult} />
          ) : null}
          {recentFoldersResult.data ? (
            <RecentFolders folders={recentFoldersResult.data.allFolders} />
          ) : null}
        </SafeAreaView>
      </ScrollView>
    </>
  );
}

const RecentUsers = ({ result }) => {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      <PTitle level={2}>Recent Clients</PTitle>
      {result.data?.users.map((user, index) => (
        <AppFolderLink folder={user.folder} key={user.id} asChild>
          <TouchableOpacity>
            <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
              <AppAvatar user={user} />
              <View style={{ justifyContent: 'center', gap: 4 }}>
                <PText>{user.name}</PText>
                <AppDateDisplay dateString={user.lastAccess} />
              </View>
            </View>
          </TouchableOpacity>
        </AppFolderLink>
      ))}
    </View>
  );
};
const RecentFolders = ({ folders }: { folders: FolderFragmentFragment[] }) => {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      <PTitle level={2}>Recently Modified Folders</PTitle>
      {folders.map((f, index) => (
        <AppFolderLink folder={f} key={f.id} asChild>
          <TouchableOpacity>
            <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
              {/*<AppAvatar user={f} />*/}
              <View style={{ justifyContent: 'center', gap: 4 }}>
                <AppImage file={f.heroImage} size="sm" width={64} />
                <PText>{f.name}</PText>
                {/*<DateDisplay dateString={f.lastAccess} />*/}
              </View>
            </View>
          </TouchableOpacity>
        </AppFolderLink>
      ))}
    </View>
  );
};
