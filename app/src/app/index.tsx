import { Button, Text, View } from 'react-native';
import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { Stack } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { Suspense } from 'react';

export default function index() {
  const logout = useSetLoggedOut();
  const me = useLoginDetails();

  return (
    <Suspense>
      <PicrUserProvider>
        <View>
          <Stack.Screen options={{ headerTitle: 'PICR' }} />
          <Text>this is index for {me?.username}</Text>
          <Button onPress={logout} title="Log Out" />
        </View>
      </PicrUserProvider>
    </Suspense>
  );
}
