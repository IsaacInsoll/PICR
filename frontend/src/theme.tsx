import { Anchor, createTheme, Switch } from '@mantine/core';
import { bodyFontFamily, defaultHeadingFontFamily } from './helpers/fontFamily';

export const theme = createTheme({
  defaultRadius: 'sm',
  fontFamily: bodyFontFamily,
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  headings: {
    fontFamily: `var(--picr-heading-font, ${defaultHeadingFontFamily})`,
  },
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        underline: 'never',
      },
    }),
    Switch: Switch.extend({
      defaultProps: {
        withThumbIndicator: false,
      },
    }),
  },
});

export const actionIconSize = 20;
