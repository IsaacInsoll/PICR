import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../.scratch/codegen-schema.json',
  // `shared/gql/*` lets useQuery/useMutation return typed objects.
  generates: {
    // Used by codegen to add TypeScript types to query/mutation results.
    '../shared/gql/': {
      preset: 'client',
      documents: ['../shared/**/*.tsx', '../shared/**/*.ts'],
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
    // Used by URQL for caching.
    '../shared/urql/graphql.schema.json': {
      plugins: ['introspection'],
    },
    // Used by IDE GraphQL plugins to autocomplete queries.
    '../schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
};

export default config;
