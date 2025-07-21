import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PICR',
  slug: 'picr',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/picr-logo-1024.png',
  scheme: 'picr',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.isaacinsoll.picr',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: {
      light: './assets/images/picr-logo-1024.png',
      dark: './assets/images/dark/picr-logo-dark-1024.png',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/picr-logo-1024.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    package: 'com.isaacinsoll.picr',
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
        image: './assets/images/picr-logo-1024.png',
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
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '17.0',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '5f55a8a5-d73d-4066-8a91-5d4e211af5fb',
    },
  },
  owner: 'isaacinsoll',
});
