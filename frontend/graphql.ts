import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:6900/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  // `src/gql/*` for useQuery/useMutation to return typed object
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      plugins: [],
    },
    './graphql.schema.json': {
      plugins: ['introspection'],
    },
    // `schema.graphql` for phpStorm GQL plugin to auto complete queries
    'schema.graphql': {
      schema: 'http://localhost:6900/graphql',
      plugins: ['schema-ast'],
    },
  },
};

export default config;
