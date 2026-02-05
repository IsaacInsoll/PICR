import { Stack } from 'expo-router';
import { PicrPublicUserProvider } from '@/src/components/PicrPublicUserProvider';
import { useNavigationScreenOptions } from '@/src/hooks/useNavigationScreenOptions';

export default function TabLayout() {
  const screenOptions = useNavigationScreenOptions();

  return (
    <PicrPublicUserProvider>
      <Stack screenOptions={screenOptions} />
    </PicrPublicUserProvider>
  );
}
