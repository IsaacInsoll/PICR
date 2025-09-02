import { Stack } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { mainFont } from '@/src/constants';
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
