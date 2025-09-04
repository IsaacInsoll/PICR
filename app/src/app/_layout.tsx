import { Slot } from 'expo-router';
import { ThemeProvider } from '@/src/components/themeProvider';

import { CacheManager } from '@georstat/react-native-image-cache';
import { Dirs } from 'react-native-file-access';
//full sreen image zoom
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/src/components/AppErrorBoundary';
import Constants from 'expo-constants';

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  maxRetries: 3,
  retryDelay: 3000, //ms
  sourceAnimationDuration: 1,
  thumbnailAnimationDuration: 1,
};

function PicrApp() {
  // This is the 'entrypoint' for the app :)
  console.log('PICR App Booting');

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <ThemeProvider>
            <Slot />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

export default PicrApp;
// let AppEntryPoint = PicrApp;
// console.log(Constants.expoConfig?.extra);
// if (Constants.expoConfig?.extra?.storybookEnabled === 'true') {
//   console.log('[app index.tsx] Engaging STORYBOOK MODE!!!');
//   AppEntryPoint = () => <StorybookUIRoot />;
// }
// export default AppEntryPoint;
