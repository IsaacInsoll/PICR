import { Stack } from 'expo-router';
import { ThemeProvider } from '@/src/components/themeProvider';

export default function AppLayout() {
  // This is the 'entrypoint' for the app :)
  console.log('PICR App Booting');

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
