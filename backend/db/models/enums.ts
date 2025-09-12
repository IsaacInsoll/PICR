import { pgEnum } from 'drizzle-orm/pg-core';

export const commentPermissionsOptions = ['edit', 'none', 'read'] as const;
export const commentPermissionsEnum = pgEnum(
  'user_commentPermissions',
  commentPermissionsOptions,
);

export const fileFlagOptions = ['approved', 'none', 'rejected'] as const;
export const fileFlagEnum = pgEnum('file_flag', fileFlagOptions);

export const fileTypeOptions = ['File', 'Image', 'Video'] as const;
export const fileTypeEnum = pgEnum('file_type', fileTypeOptions);

export const userTypeOptions = ['Admin', 'All', 'Link', 'User'] as const;
export const userTypeEnum = pgEnum('user_type', userTypeOptions);

export const accessTypeOptions = ['Download', 'View'] as const;
export const accessTypeEnum = pgEnum('accesslogs_type', accessTypeOptions);

export const themeModeOptions = ['auto', 'light', 'dark'] as const;
export const themeModeEnum = pgEnum('theme_mode', themeModeOptions);

export const primaryColorOptions = [
  'blue',
  'cyan',
  'dark',
  'grape',
  'gray',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'teal',
  'violet',
  'yellow',
] as const;
export const primaryColorEnum = pgEnum('theme_color', primaryColorOptions);
