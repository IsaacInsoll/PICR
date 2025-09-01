import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMe } from '@/src/hooks/useMe';
import { useQuery } from 'urql';
import { recentUsersQuery } from '@shared/urql/queries/recentUsersQuery';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppDateDisplay } from '@/src/components/AppDateDisplay';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppFolderLink } from '@/src/components/AppFolderLink';
import { HeaderButton } from '@react-navigation/elements';
import { readAllFoldersQuery } from '@shared/urql/queries/readAllFoldersQuery';
import { FolderFragmentFragment, FoldersSortType } from '@shared/gql/graphql';
import { AppImage } from '@/src/components/AppImage';
import { useHostname } from '@/src/hooks/useHostname';
import { navBarIconProps } from '@/src/constants';
import { PView } from '@/src/components/PView';
import { AppFileListItem } from '@/src/components/FolderContents/AppFolderFileList';
import { PFileImage } from '@/src/components/PFileImage';
import { Suspense } from 'react';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { AppTaskSummary } from '@/src/components/AppTaskSummary';
import { PFileView } from '@/src/components/PFileView';

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
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'PICR',
          headerLeft: () => <HomeFolderButton />,
          headerRight: () => <SettingsButton />,
        }}
      />
      <Suspense fallback={<AppLoadingIndicator />}>
        <DashboardBody />
      </Suspense>
    </>
  );
}

const DashboardBody = () => {
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
        <Suspense>
          <AppTaskSummary folderId={me?.folderId} />
        </Suspense>
        {recentUsersResult.data ? (
          <RecentUsers users={recentUsersResult.data?.users.slice(0, 5)} />
        ) : null}
        {recentFoldersResult.data ? (
          <RecentFolders folders={recentFoldersResult.data.allFolders} />
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
};

const RecentUsers = ({ users }) => {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      <PTitle level={2}>Recent Clients</PTitle>
      <View style={[styles.indent]}>
        {users.map((user, index) => (
          <AppFolderLink folder={user.folder} key={user.id} asChild>
            <TouchableOpacity>
              <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
                <PFileView
                  file={user.folder.heroImage}
                  style={{ width: 80, height: 80 }}
                  contentFit="contain"
                  size="sm"
                />
                <View style={{ justifyContent: 'center', gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <AppAvatar user={user} size={24} />
                    <View style={{ gap: 4 }}>
                      <PTitle level={4}>{user.name}</PTitle>
                      <AppDateDisplay dateString={user.lastAccess} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </AppFolderLink>
        ))}
      </View>
    </View>
  );
};
const RecentFolders = ({ folders }: { folders: FolderFragmentFragment[] }) => {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      <PTitle level={2}>Recently Modified Folders</PTitle>
      <View style={styles.indent}>
        {folders.map((f, index) => (
          <AppFileListItem item={f} key={index}>
            <AppDateDisplay dateString={f.folderLastModified} />
          </AppFileListItem>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  indent: { paddingLeft: 16 },
});
