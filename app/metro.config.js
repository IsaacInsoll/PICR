const { getDefaultConfig } = require('expo/metro-config');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

// Metro doesn't support importing from above the root folder
// So all of this is to allow importing of @frontend so we aren't duplicating code

const config = getDefaultConfig(__dirname);

module.exports = withStorybook({
  ...config,
  resolver: {
    ...config.resolver,
    extraNodeModules: {
      '@frontend': __dirname + '/../frontend/src',
      '@shared': __dirname + '/../shared',
    },
    // enableGlobalPackages: true,
  },
  watchFolders: [__dirname + '/../frontend/src', __dirname + '/../shared'],
});
