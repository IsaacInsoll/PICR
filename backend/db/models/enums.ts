import { pgEnum } from 'drizzle-orm/pg-core';

export const commentPermissionsOptions = ['edit', 'none', 'read'] as const;
export const commentPermissionsEnum = pgEnum(
  'enum_Users_commentPermissions',
  commentPermissionsOptions,
);

export const fileFlagOptions = ['approved', 'none', 'rejected'] as const;
export const fileFlagEnum = pgEnum('enum_Files_flag', fileFlagOptions);

export const fileTypeOptions = ['File', 'Image', 'Video'] as const;
export const fileTypeEnum = pgEnum('enum_Files_type', fileTypeOptions);

export const userTypeOptions = ['Admin', 'All', 'Link', 'User'] as const;
export const userTypeEnum = pgEnum('enum_Users_userType', userTypeOptions);

export const accessTypeOptions = ['Download', 'View'] as const;
export const accessTypeEnum = pgEnum('enum_AccessLogs_type', accessTypeOptions);

export const themeModeOptions = ['Auto', 'Light', 'Dark'] as const;
export const themeModeEnum = pgEnum('enum_Brandings_mode', themeModeOptions);

export const primaryColorOptions = [
  'Blue',
  'Cyan',
  'Dark',
  'Grape',
  'Gray',
  'Green',
  'Indigo',
  'Lime',
  'Orange',
  'Pink',
  'Red',
  'Teal',
  'Violet',
  'Yellow',
] as const;
export const primaryColorEnum = pgEnum(
  'enum_Brandings_primaryColor',
  primaryColorOptions,
);
