import { Slot } from 'expo-router';
import { ThemeProvider } from '@/src/components/themeProvider';

import { CacheManager } from '@georstat/react-native-image-cache';
import { Dirs } from 'react-native-file-access';

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  maxRetries: 3,
  retryDelay: 3000, //ms
  sourceAnimationDuration: 100,
  thumbnailAnimationDuration: 100,
};

export default function AppLayout() {
  // This is the 'entrypoint' for the app :)
  console.log('PICR App Booting');

  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
