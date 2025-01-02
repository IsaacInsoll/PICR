import { GraphQLEnumType } from 'graphql';

export const accessTypeEnum = new GraphQLEnumType({
  name: 'AccessType',
  values: {
    View: { value: 'View' },
    Download: { value: 'Download' },
  },
});
