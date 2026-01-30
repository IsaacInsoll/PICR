import { Stack } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { useNavigationScreenOptions } from '@/src/hooks/useNavigationScreenOptions';

export default function TabLayout() {
  const screenOptions = useNavigationScreenOptions();

  return (
    <PicrUserProvider>
      <Stack screenOptions={screenOptions} />
    </PicrUserProvider>
  );
}
