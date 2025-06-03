import { Stack } from 'expo-router';
import { ThemeProvider } from '@/src/components/themeProvider';

export default function AppLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
