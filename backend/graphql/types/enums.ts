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
import {
  BANNER_H_ALIGNS,
  BANNER_SIZES,
  BANNER_V_ALIGNS,
  HEADING_ALIGNMENT_OPTIONS,
} from '@shared/branding/galleryPresets.js';

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
export const headingAlignmentEnum = new GraphQLEnumType(
  enumToGQL('HeadingAlignment', HEADING_ALIGNMENT_OPTIONS),
);
export const bannerSizeEnum = new GraphQLEnumType(
  enumToGQL('BannerSize', BANNER_SIZES),
);
export const bannerTextHAlignEnum = new GraphQLEnumType(
  enumToGQL('BannerTextHAlign', BANNER_H_ALIGNS),
);
export const bannerTextVAlignEnum = new GraphQLEnumType(
  enumToGQL('BannerTextVAlign', BANNER_V_ALIGNS),
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
