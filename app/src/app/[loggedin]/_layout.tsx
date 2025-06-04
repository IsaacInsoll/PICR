import { Tabs } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { useTheme } from '@/src/hooks/useTheme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <PicrUserProvider>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerBackgroundContainerStyle: {
            backgroundColor: '#f00',
          },
          headerStyle: { backgroundColor: theme.tabColor },
          //android tabs look wrong if you set tabColor in light mode
          tabBarStyle: theme.tabColor
            ? { backgroundColor: theme.tabColor }
            : undefined,
          sceneStyle: { backgroundColor: theme.backgroundColor },
          // headerTitleContainerStyle: { backgroundColor: '#0f0' },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{ title: 'Home', headerTitle: 'PICR' }}
        />
        <Tabs.Screen
          name="admin/f/[folderId]"
          options={{ title: 'Folders', headerTitle: 'PICR' }}
        />
        <Tabs.Screen
          name="admin/settings"
          options={{ title: 'Settings', headerTitle: 'PICR Settings' }}
        />
      </Tabs>
    </PicrUserProvider>
  );
}
