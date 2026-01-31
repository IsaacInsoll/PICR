import {
  accessTypeOptions,
  commentPermissionsOptions,
  enumToGQL,
  fileFlagOptions,
  fileTypeOptions,
  linkModeOptions,
  primaryColorOptions,
  themeModeOptions,
  userTypeOptions,
} from '../../db/models/index.js';
import { GraphQLEnumType } from 'graphql';
import { headingFontKeyOptions } from './headingFontKeyOptions.js';

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

export const linkModeEnum = new GraphQLEnumType(
  enumToGQL('LinkMode', linkModeOptions),
);
export const themeModeEnum = new GraphQLEnumType(
  enumToGQL('ThemeMode', themeModeOptions, true),
);
export const primaryColorEnum = new GraphQLEnumType(
  enumToGQL('PrimaryColor', primaryColorOptions, true),
);

const toCamelCase = (str: string) =>
  str.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());

const headingFontKeyValues = headingFontKeyOptions.reduce(
  (acc, value) => {
    const name = toCamelCase(value);
    acc[name] = { value };
    return acc;
  },
  {} as Record<string, { value: string }>,
);

export const headingFontKeyEnum = new GraphQLEnumType({
  name: 'HeadingFontKey',
  values: headingFontKeyValues,
});
