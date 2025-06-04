import { ScrollView, View } from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useMe } from '@/src/hooks/useMe';
import { useQuery } from 'urql';
import { recentUsersQuery } from '@frontend/urql/queries/recentUsersQuery';
import { PicrAvatar } from '@/src/components/PicrAvatar';
import { DateDisplay } from '@/src/components/DateDisplay';
import { useTheme } from '@/src/hooks/useTheme';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';

export default function dashboard() {
  const me = useMe();
  const login = useLoginDetails();
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.backgroundColor }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/*<Stack.Screen options={{ headerTitle: 'PICR3' }} />*/}
        {/*<Title>PICR Home</Title>*/}
        <PText>
          Dashboard for U be logged in with folderId {me?.folderId} as{' '}
          {login?.username}
        </PText>
        <RecentUsers />
      </View>
    </ScrollView>
  );
}

const RecentUsers = () => {
  const me = useMe();
  const [result] = useQuery({
    query: recentUsersQuery,
    variables: { folderId: me?.folderId },
  });
  return (
    <View style={{ gap: 8 }}>
      <PTitle level={2}>Recent Clients</PTitle>
      {result.data?.users.map((user, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
          <PicrAvatar user={user} />
          <View style={{ justifyContent: 'center', gap: 4 }}>
            <PText>{user.name}</PText>
            <DateDisplay dateString={user.lastAccess} />
          </View>
        </View>
      ))}
    </View>
  );
};
