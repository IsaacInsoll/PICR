import { Text, View } from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { useMe } from '@/src/hooks/useMe';
import { useQuery } from 'urql';
import { recentUsersQuery } from '@frontend/urql/queries/recentUsersQuery';
import { PicrAvatar } from '@/src/components/PicrAvatar';

export default function dashboard() {
  const me = useMe();
  const login = useLoginDetails();
  //TODO: can't do this as it's a https:// url so we need to redirect to just <servername>
  // return <Redirect href={me?.server} />;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/*<Stack.Screen options={{ headerTitle: 'PICR3' }} />*/}
      <Text style={{ fontFamily: 'Signika-Bold', fontSize: 36 }}>
        PICR is the best
      </Text>
      <Text style={{ fontSize: 36, color: 'red' }}>PICR is the best</Text>
      <Text>
        Dashboard for U be logged in with folderId {me?.folderId} as{' '}
        {login?.username}
      </Text>
      {/*<RecentUsers />*/}
    </View>
  );
}

const RecentUsers = () => {
  const me = useMe();
  const [result] = useQuery({
    query: recentUsersQuery,
    variables: { folderId: me?.folderId },
  });
  return (
    <View>
      {result.data?.users.map((user, index) => (
        <View key={index}>
          <PicrAvatar user={user} />
          <Text>{user.name}</Text>
        </View>
      ))}
    </View>
  );
};
