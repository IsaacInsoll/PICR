import { Text, View } from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';

export default function dashboard() {
  const me = useLoginDetails();
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
      <Text>
        Dashboard for U be logged in to {me?.hostname} as {me?.username}
      </Text>
    </View>
  );
}
