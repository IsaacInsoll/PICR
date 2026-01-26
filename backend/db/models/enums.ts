import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL enum definitions for the database schema.
 *
 * Pattern: Each enum has an `Options` array (for TypeScript) and an `Enum` (for Drizzle/Postgres).
 * When adding a new enum value, add to BOTH the options array and regenerate migrations.
 *
 * @example
 * // Using in a table definition:
 * import { userTypeEnum } from './enums.js';
 * const table = pgTable('example', { type: userTypeEnum() });
 *
 * // Using for TypeScript types:
 * import { userTypeOptions } from './enums.js';
 * type UserType = (typeof userTypeOptions)[number]; // 'Admin' | 'All' | 'Link' | 'User'
 */

/** Controls what comment actions a user can perform: edit (create), read (view only), none */
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

// linkModeOptions: presumably this will grow over time to end up with < 7 options
// if this grows large we should probably swap to a "roles are their own table mapping permissions and then each link has a RoleID
export const linkModeOptions = [
  'final_delivery',
  'proof_no_downloads',
] as const;
export const linkModeEnum = pgEnum('link_mode', linkModeOptions);

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
