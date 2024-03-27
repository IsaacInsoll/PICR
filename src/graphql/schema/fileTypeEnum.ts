import { GraphQLEnumType } from 'graphql';

export const fileTypeEnum = new GraphQLEnumType({
  name: 'FileType',
  values: {
    Image: { value: 'Image' },
    Video: { value: 'Video' },
    File: { value: 'File' },
  },
});
