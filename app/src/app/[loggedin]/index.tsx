import { Text, View } from 'react-native';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect, Stack } from 'expo-router';

export default function index() {
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
      <Stack.Screen options={{ headerTitle: 'PICR' }} />
      <Text>
        U be logged in to {me?.hostname} as {me?.username}
      </Text>
    </View>
  );
}
