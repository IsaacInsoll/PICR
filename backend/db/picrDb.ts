// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import * as schema from './models/index.js';
import {
  dbAccessLog,
  dbBranding,
  dbComment,
  dbFile,
  dbFolder,
  dbServerOptions,
  dbUser,
} from './models/index.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import type { AccessType } from '@shared/gql/graphql.js';
import { fileToJSON } from '../graphql/helpers/fileToJSON.js';
import { picrConfig } from '../config/picrConfig.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';

export let db: NodePgDatabase<typeof schema>;

export const initDb = () => {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL environment variable is required');
  db = drizzle(url, {
    schema,
    logger: picrConfig.debugSql,
  });
  // console.log('🚀 Connected to Database');
};

export type ServerOptionsFields = typeof dbServerOptions.$inferSelect;
export type UserFields = typeof dbUser.$inferSelect;
export type FileFields = typeof dbFile.$inferSelect;
export type FolderFields = typeof dbFolder.$inferSelect;
export type CommentFields = typeof dbComment.$inferSelect;

export const ACCESS_LOG_HEADER_MAX_LENGTH = 1024;

export const normalizeAccessLogHeader = (value: string | undefined): string => {
  if (value == null) return '';
  const trimmed = value.trim();
  return trimmed.slice(0, ACCESS_LOG_HEADER_MAX_LENGTH);
};

export const dbFolderForId = async (
  id: number | undefined,
): Promise<FolderFields | undefined> => {
  if (!id) return undefined;
  return db.query.dbFolder.findFirst({
    where: and(eq(dbFolder.id, id), eq(dbFolder.exists, true)),
  });
};
export const dbFileForId = async (
  id: number | undefined | null,
): Promise<FileFields | undefined> => {
  if (!id) return undefined;
  return db.query.dbFile.findFirst({
    where: and(eq(dbFile.id, id), eq(dbFile.exists, true)),
  });
};

export const dbUserForId = async (
  id: number | undefined,
): Promise<UserFields | undefined> => {
  if (!id) return undefined;
  return db.query.dbUser.findFirst({ where: eq(dbUser.id, id) });
};

// TODO: better organisation of these functions

export const getServerOptions = async (): Promise<ServerOptionsFields> => {
  const opts = await db.query.dbServerOptions.findFirst({
    where: ({ id }, { eq }) => eq(id, 1),
  });
  if (!opts) {
    return db
      .insert(dbServerOptions)
      .values({
        id: 1,
        updatedAt: new Date(),
        createdAt: new Date(),
        avifEnabled: false,
      })
      .returning()
      .then((f) => f[0]);
  }
  return opts;
};

export const setServerOptions = async (
  opts: Partial<typeof dbServerOptions.$inferInsert>,
) => {
  return db.update(dbServerOptions).set({ ...opts, updatedAt: new Date() });
};

export const brandingForId = async (id: number) => {
  return db.query.dbBranding.findFirst({
    where: eq(dbBranding.id, id),
  });
};

// TODO: Remove once Branding.folderId is removed - kept for backwards compatibility
export const brandingForFolderId = async (folderId: number) => {
  return db.query.dbBranding.findFirst({
    where: eq(dbBranding.folderId, folderId),
  });
};

export const createAccessLog = async (
  user: UserFields,
  folder: FolderFields,
  context: PicrRequestContext,
  type: AccessType,
) => {
  if (picrConfig.disableAccessLogs) return false;

  //Check if sessionId/ipAddress/user already accessed this in last hour and don't create if so

  const h = context.headers;

  const props = {
    userId: user.id,
    folderId: folder.id,
    type: type,
    ipAddress: normalizeAccessLogHeader(h.ipAddress),
    sessionId: normalizeAccessLogHeader(h.sessionId),
    userAgent: normalizeAccessLogHeader(h.userAgent),
  };

  const recent = await db.query.dbAccessLog.findFirst({
    where: and(
      eq(dbAccessLog.userId, props.userId),
      eq(dbAccessLog.folderId, props.folderId),
      eq(dbAccessLog.type, props.type),
      eq(dbAccessLog.ipAddress, props.ipAddress),
      eq(dbAccessLog.sessionId, props.sessionId),
      eq(dbAccessLog.userAgent, props.userAgent),
      gte(dbAccessLog.createdAt, new Date(Date.now() - 3600 * 1000)),
    ),
  });

  if (recent) return false;

  await db
    .insert(dbAccessLog)
    .values({ ...props, createdAt: new Date(), updatedAt: new Date() });

  return true;
};

export const getAccessLogs = async (
  folderIds: number[],
  userId: number | number[],
) => {
  const data = await db.query.dbAccessLog.findMany({
    where: and(
      inArray(dbAccessLog.folderId, folderIds),
      !Array.isArray(userId)
        ? eq(dbAccessLog.userId, userId)
        : inArray(dbAccessLog.userId, userId),
    ),
    orderBy: [desc(dbAccessLog.createdAt)],
    limit: 100,
  });
  return data;
};

export const addCommentDB = async (
  file: FileFields,
  user: UserFields,
  systemGenerated?: object,
  userComment?: string,
) => {
  const props: typeof dbComment.$inferInsert = {
    folderId: file.folderId,
    fileId: file.id,
    userId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (systemGenerated) {
    props.systemGenerated = true;
    props.comment = JSON.stringify(systemGenerated);
  } else {
    props.systemGenerated = false;
    props.comment = userComment;
  }

  return db
    .insert(dbComment)
    .values(props)
    .returning()
    .then((f) => f[0]);
};

export const updateUserLastAccess = async (userId: number) => {
  return db
    .update(dbUser)
    .set({ lastAccess: new Date() })
    .where(eq(dbUser.id, userId));
};

export const getFilesForFolder = async (folderId: number) => {
  const files = await db.query.dbFile.findMany({
    where: and(eq(dbFile.folderId, folderId), eq(dbFile.exists, true)),
    orderBy: asc(dbFile.name),
  });

  return files.map((f) => {
    return fileToJSON(f);
  });
};

// Fetch a specific set of files by id (used to attach `file` to comments without
// loading every file in a folder subtree).
export const getFilesForIds = async (ids: number[]) => {
  if (ids.length === 0) return [];
  const files = await db.query.dbFile.findMany({
    where: and(inArray(dbFile.id, ids), eq(dbFile.exists, true)),
  });
  return files.map((f) => fileToJSON(f));
};
