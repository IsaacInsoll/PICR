import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

const appName = 'PICR' + (IS_DEV ? ' [Dev]' : '');
const bundle = 'com.isaacinsoll.picr' + (IS_DEV ? '.dev' : '');
const scheme = !IS_DEV ? 'picr' : 'picrdev';
const icon =
  './assets/images/picr-logo' + (IS_DEV ? '-beta' : '') + '-1024.png';

if (IS_DEV) {
  console.log('== PICR: Using [Dev] App name and Bundle ID ==');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: 'picr',
  version: '1.0.3',
  orientation: 'default',
  icon: icon,
  scheme: scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundle,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: {
      light: icon,
      dark: './assets/images/dark/picr-logo-dark-1024.png',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: icon,
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    package: bundle,
    blockedPermissions: [
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ],
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON, // ?? './google-services.json',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.ico',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: icon,
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow PICR to access your photos.',
        savePhotosPermission: 'Allow PICR to save photos.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'expo-video',
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    'expo-secure-store',
    'expo-notifications',
    'expo-web-browser',
    'expo-font',
    ['react-native-edge-to-edge'],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.0',
        },
      },
    ],
    [
      'expo-screen-orientation',
      {
        initialOrientation: 'DEFAULT',
      },
    ],
    ['@rnrepo/expo-config-plugin'],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '5f55a8a5-d73d-4066-8a91-5d4e211af5fb',
    },
    isDev: IS_DEV,
  },
  owner: 'isaacinsoll',
});
