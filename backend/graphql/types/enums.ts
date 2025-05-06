import {
  accessTypeOptions,
  commentPermissionsOptions,
  enumToGQL,
  fileFlagOptions,
  fileTypeOptions,
  primaryColorOptions,
  themeModeOptions,
  userTypeOptions,
} from '../../db/models/index.js';
import { GraphQLEnumType } from 'graphql';

export const accessTypeEnum = new GraphQLEnumType(
  enumToGQL('AccessType', accessTypeOptions),
);
export const commentPermissionsEnum = new GraphQLEnumType(
  enumToGQL('CommentPermissions', commentPermissionsOptions),
);
export const fileFlagEnum = new GraphQLEnumType(
  enumToGQL('FileFlag', fileFlagOptions),
);
export const fileTypeEnum = new GraphQLEnumType(
  enumToGQL('FileType', fileTypeOptions),
);
export const userTypeEnum = new GraphQLEnumType(
  enumToGQL('UserType', userTypeOptions),
);
export const themeModeEnum = new GraphQLEnumType(
  enumToGQL('ThemeMode', themeModeOptions, true),
);
export const primaryColorEnum = new GraphQLEnumType(
  enumToGQL('PrimaryColor', primaryColorOptions, true),
);
