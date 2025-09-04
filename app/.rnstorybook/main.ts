import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  // not sure if i need parent folder or not so lets do both for now :/
  stories: [
    './stories/**/*.stories.?(ts|tsx|js|jsx)',
    '../stories/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
};

export default main;
