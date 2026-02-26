const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    extraNodeModules: {
      '@shared': __dirname + '/../shared',
    },
  },
  watchFolders: [__dirname + '/../shared'],
};
