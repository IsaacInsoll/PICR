import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:6900/graphql',
  // `src/gql/*` for useQuery/useMutation to return typed object
  generates: {
    // used by codegen to add proper typescript typing to results from a gql query/mutation
    'shared/gql/': {
      preset: 'client',
      documents: ['./shared/**/*.tsx', './shared/**/*.ts'],
      presetConfig: { fragmentMasking: false },
      plugins: [],
      config: {
        strictScalars: true,
        defaultScalarType: 'unknown',
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          JSON: 'unknown',
        },
      },
    },
    //graphql.schema.json used by URQL for caching
    'shared/urql/graphql.schema.json': {
      plugins: ['introspection'],
    },
    // `schema.graphql` for phpStorm GQL plugin to auto complete queries
    './schema.graphql': {
      schema: 'http://localhost:6900/graphql',
      plugins: ['schema-ast'],
    },
  },
};

export default config;
