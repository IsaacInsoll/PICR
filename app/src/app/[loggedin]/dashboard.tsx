import { RefreshControl, ScrollView, View } from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useMe } from '@/src/hooks/useMe';
import { useQuery } from 'urql';
import { recentUsersQuery } from '@frontend/urql/queries/recentUsersQuery';
import { AppAvatar } from '@/src/components/AppAvatar';
import { DateDisplay } from '@/src/components/DateDisplay';
import { useTheme } from '@/src/hooks/useTheme';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppFolderLink } from '@/src/components/AppFolderLink';
import { HeaderButton } from '@react-navigation/elements';

const HomeFolderButton = () => {
  const me = useMe();
  const theme = useTheme();
  return (
    <HeaderButton>
      <AppFolderLink folder={{ id: me.folderId, name: 'Home' }} asChild={true}>
        <Ionicons
          name="folder-outline"
          size={25}
          color={theme.brandColor}
          style={{ minWidth: 32 }} // we need this for Android otherwise it gets cropped to 1px wide :/
        />
      </AppFolderLink>
    </HeaderButton>
  );
};

export default function dashboard() {
  const me = useMe();
  const login = useLoginDetails();
  const theme = useTheme();

  const [recentUsersResult, requery] = useQuery({
    query: recentUsersQuery,
    variables: { folderId: me?.folderId },
    // context: { suspense: false },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'PICR',
          headerLeft: () => <HomeFolderButton />,
        }}
      />
      <ScrollView
        style={{
          backgroundColor: theme.backgroundColor,
        }}
        refreshControl={
          <RefreshControl
            refreshing={recentUsersResult.fetching}
            onRefresh={() => requery({ requestPolicy: 'network-only' })}
          />
        }
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {recentUsersResult.data ? (
            <RecentUsers result={recentUsersResult} />
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const RecentUsers = ({ result }) => {
  return (
    <View style={{ gap: 8 }}>
      <PTitle level={2}>Recent Clients</PTitle>
      {result.data?.users.map((user, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
          <AppAvatar user={user} />
          <View style={{ justifyContent: 'center', gap: 4 }}>
            <PText>{user.name}</PText>
            <DateDisplay dateString={user.lastAccess} />
          </View>
        </View>
      ))}
    </View>
  );
};
