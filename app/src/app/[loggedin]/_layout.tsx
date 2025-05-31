import { Tabs } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';

export default function TabLayout() {
  return (
    <PicrUserProvider>
      <Tabs screenOptions={{ headerShown: true }}>
        <Tabs.Screen
          name="dashboard"
          options={{ title: 'PICR', headerTitle: 'PICR Home' }}
        />
        {/*<Tabs.Screen name="feed" options={{ title: 'Files' }} />*/}
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', headerTitle: 'PICR Settings' }}
        />
      </Tabs>
    </PicrUserProvider>
  );
}
