const { getDefaultConfig } = require('expo/metro-config');

// Since SDK 52, Expo auto-detects monorepo workspaces for watchFolders
// and nodeModulesPaths. We only need extraNodeModules for our path aliases.

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@frontend': __dirname + '/../frontend/src',
  '@shared': __dirname + '/../shared',
};

module.exports = config;
