module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      unknown(node, name) {
        if (node.source?.input?.file?.includes('/node_modules/')) {
          return `$${name}`;
        }

        throw node.error(`Undefined variable $${name}`);
      },
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
