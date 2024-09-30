import type { CodegenConfig } from '@graphql-codegen/cli';
import { type } from 'node:os';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:6900/graphql',
  // `src/gql/*` for useQuery/useMutation to return typed object
  generates: {
    'src/gql/': {
      preset: 'client',
      documents: ['src/**/*.tsx', 'src/**/*.ts'],
      presetConfig: {
        fragmentMasking: false,
      },
      plugins: [],
    },
    './public/graphql.schema.json': {
      plugins: ['introspection'],
    },
    // `schema.graphql` for phpStorm GQL plugin to auto complete queries, consider moving to top (server) folder
    '../schema.graphql': {
      schema: 'http://localhost:6900/graphql',
      plugins: ['schema-ast'],
    },
    // for importing types into server TS files
    '../graphql-types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        // declarationKind: {
        //   union: type,
        //   type: 'interface',
        //   input: 'interface',
        //   scalar: 'interface',
        //   arguments: 'interface',
        //   interface: 'interface',
        // },
        // includeDirectives: true,
        // commentDescriptions: true,
        // flattenGeneratedTypes: true,
        // avoidOptionals: {
        //   field: false,
        //   object: false,
        //   inputValue: false,
        // },
      },
    },
  },
};

export default config;
