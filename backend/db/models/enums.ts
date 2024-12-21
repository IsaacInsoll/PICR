import { pgEnum } from 'drizzle-orm/pg-core';

//TODO: merge this with graphQL enums so we aren't "double defining"

const commentPermissionsOptions = ['edit', 'none', 'read'] as const;
export const commentPermissionsEnum = pgEnum(
  'enum_Users_commentPermissions',
  commentPermissionsOptions,
);

const fileFlagOptions = ['approved', 'none', 'rejected'] as const;
export const fileFlagEnum = pgEnum('enum_Files_flag', fileFlagOptions);

const fileTypeOptions = ['File', 'Image', 'Video'] as const;
export const fileTypeEnum = pgEnum('enum_Files_type', fileTypeOptions);
