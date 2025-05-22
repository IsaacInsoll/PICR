import { Text, View } from 'react-native';
import { PicrLogo } from '@/src/components/PicrLogo';
import { Stack } from 'expo-router';

export default function index() {
  return (
    <Stack.Screen
      name="Login"
      options={
        {
          // headerShown: false,
        }
      }
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PicrLogo />
        <Text>xU are NOT logged in</Text>
      </View>
    </Stack.Screen>
  );
}
