const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const repositoryRoot = path.resolve(__dirname, '..');
const sharedRoot = path.resolve(__dirname, '../shared');

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    extraNodeModules: {
      '@shared': sharedRoot,
    },
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(repositoryRoot, 'node_modules'),
    ],
  },
  watchFolders: [repositoryRoot],
};
