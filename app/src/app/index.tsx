import { Button, Text, View } from 'react-native';
import { useSetLoggedOut, useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect, Stack } from 'expo-router';
export default function index() {
  const me = useLoginDetails();
  const logout = useSetLoggedOut();
  console.log(me ? 'Logged In' : 'Not Logged In');
  if (!me) return <Redirect href="/login" />;
  console.log(me);
  return (
    <View>
      <Stack.Screen options={{ headerTitle: 'PICR' }} />
      <Text>this is index for {me.username}</Text>
      <Button
        onPress={() => {
          console.log('pressed');
          logout();
        }}
        title="Log Out"
      />
    </View>
  );
}
