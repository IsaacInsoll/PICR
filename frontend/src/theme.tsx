import { createTheme } from '@mantine/core';

export const fonts =
  '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji';

export const theme = createTheme({
  fontFamily: 'Roboto, ' + fonts,
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  headings: {
    fontFamily: 'var(--picr-heading-font, Signika), ' + fonts,
  },
  components: {
    // ActionIcon: ActionIcon.extend({
    //   defaultProps: {
    //     size: 'xl',
    //   },
    // }),
  },
});

export const actionIconSize = 20;
