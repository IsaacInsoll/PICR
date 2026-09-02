import type { CodegenConfig } from '@graphql-codegen/cli';

const scalarConfig = {
  strictScalars: true,
  defaultScalarType: 'unknown',
  scalars: {
    DateTime: 'string',
    BigInt: 'string',
    JSON: 'unknown',
  },
};

const config: CodegenConfig = {
  overwrite: true,
  schema: '../.scratch/codegen-schema.json',
  // `shared/gql/*` lets useQuery/useMutation return typed objects.
  generates: {
    // Used by codegen to add TypeScript types to query/mutation results.
    '../shared/gql/': {
      preset: 'client',
      // Keep this scoped to handwritten operation files. Codegen 7's loader
      // otherwise attempts to parse shared/gql/*.ts as source documents.
      documents: [
        '../shared/urql/fragments/**/*.ts',
        '../shared/urql/mutations/**/*.ts',
        '../shared/urql/queries/**/*.ts',
      ],
      presetConfig: { fragmentMasking: false },
      // Preserve the existing generated-module API while Codegen 6 emits
      // complete schema models into a separate file.
      plugins: [{ add: { content: "export type * from './schema.js';" } }],
      config: {
        ...scalarConfig,
        // Preserve runtime enum objects such as FileFlag.Approved.
        enumType: 'native',
      },
    },
    // Codegen 6's client preset emits operation types only. Shared utilities
    // also use complete schema types such as Query and ImageMetadataSummary.
    '../shared/gql/schema.ts': {
      plugins: ['typescript'],
      config: scalarConfig,
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
