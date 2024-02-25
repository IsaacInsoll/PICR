import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://localhost:6900/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  overwrite: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};
export default config;
