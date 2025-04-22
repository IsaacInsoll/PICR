// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import * as schema from './models';
import {
  dbAccessLog,
  dbBranding,
  dbComment,
  dbFile,
  dbFolder,
  dbServerOptions,
  dbUser,
} from './models';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { AccessType } from '../../graphql-types';
import { fileToJSON } from '../graphql/helpers/fileToJSON';
import { picrConfig } from '../config/picrConfig';
import { sendFolderViewedNotification } from '../notifications/notifications';

export let db: NodePgDatabase<typeof schema>;

export const initDb = () => {
  db = drizzle(process.env.DATABASE_URL!, {
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
  return db.query.dbUser.findFirst({ where: eq(dbFolder.id, id) });
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

//
export const brandingForFolderId = async (folderId: number) => {
  return db.query.dbBranding.findFirst({
    where: eq(dbBranding.folderId, folderId),
  });
};

export const createAccessLog = async (
  user: UserFields,
  folder: FolderFields,
  context: IncomingCustomHeaders,
  type: AccessType,
) => {
  //Check if sessionId/ipAddress/user already accessed this in last hour and don't create if so

  const props = {
    userId: user.id,
    folderId: folder.id,
    type: type,
    ipAddress: context.ipAddress!,
    sessionId: context.sessionId!,
    userAgent: context.userAgent!,
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

  if (recent) return;

  await db
    .insert(dbAccessLog)
    .values({ ...props, createdAt: new Date(), updatedAt: new Date() });

  // we don't want to send a notification for every folder view as that means navigating folders would cause lots of notifications
  // so ignore folderId, sessionId and userAgent
  // EG: view on desktop, then view on mobile while still at home, browsing different folders = same IP and User so no dupe notifications within the hour
  const recentSession = await db.query.dbAccessLog.findFirst({
    where: and(
      eq(dbAccessLog.userId, props.userId),
      eq(dbAccessLog.type, props.type),
      eq(dbAccessLog.ipAddress, props.ipAddress),
      gte(dbAccessLog.createdAt, new Date(Date.now() - 3600 * 1000)),
    ),
  });
  if (type == 'View' && recentSession) return;
  await sendFolderViewedNotification(folder, user, type);
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
