import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:6900/graphql',
  // `src/gql/*` for useQuery/useMutation to return typed object
  generates: {
    // used by codegen to add proper typescript typing to results from a gql query/mutation
    'frontend/src/gql/': {
      preset: 'client',
      documents: ['./frontend/src/**/*.tsx', './frontend/src/**/*.ts'],
      presetConfig: { fragmentMasking: false },
      plugins: [],
    },
    //graphql.schema.json used by URQL for caching
    'frontend/public/graphql.schema.json': {
      plugins: ['introspection'],
    },
    // `schema.graphql` for phpStorm GQL plugin to auto complete queries, consider moving to top (server) folder
    './schema.graphql': {
      schema: 'http://localhost:6900/graphql',
      plugins: ['schema-ast'],
    },
    // for importing types into server TS files
    './graphql-types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {},
    },
  },
};

export default config;
