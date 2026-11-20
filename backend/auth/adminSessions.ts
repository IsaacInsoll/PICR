import type { AdminAuthErrorCode } from '@shared/auth/adminAuth.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { and, eq, gt, lt } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  db,
  getServerOptions,
  type UserFields,
  type ServerOptionsExecutor,
} from '../db/picrDb.js';
import {
  dbAdminSecurity,
  dbAuthChallenge,
  dbAuthSession,
  dbRefreshToken,
  dbUser,
  dbNativeAuthorization,
} from '../db/models/index.js';
import { picrConfig } from '../config/picrConfig.js';
import { hashAuthToken, randomAuthToken } from './mfaCrypto.js';
import { logger } from '../logger.js';

export type AuthTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export const refreshLifetimeMs = 28 * 24 * 60 * 60 * 1000;
export const accessLifetimeSeconds = 15 * 60;
export class AdminAuthError extends Error {
  constructor(
    public code: AdminAuthErrorCode,
    public status = 401,
  ) {
    super(code);
  }
}
const accessClaims = z
  .object({
    kind: z.literal('admin_access'),
    sessionId: z.uuid(),
    userId: z.number().int(),
    authVersion: z.number().int(),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .refine(
    (claims) =>
      claims.exp > claims.iat &&
      claims.exp - claims.iat <= accessLifetimeSeconds,
  );
export const validAdmin = (user: UserFields | undefined): user is UserFields =>
  !!user &&
  user.userType === 'Admin' &&
  user.enabled &&
  !user.deleted &&
  !!user.hashedPassword;
export const lockAdmin = async (
  tx: AuthTransaction,
  userId: number,
): Promise<UserFields> => {
  const user = (
    await tx.select().from(dbUser).where(eq(dbUser.id, userId)).for('update')
  ).at(0);
  if (!validAdmin(user)) throw new AdminAuthError('session_expired');
  return user;
};

export async function sessionAllowed(
  user: UserFields,
  secondFactor: boolean,
  executor: ServerOptionsExecutor = db,
): Promise<boolean> {
  const security = await executor.query.dbAdminSecurity.findFirst({
    where: eq(dbAdminSecurity.userId, user.id),
  });
  const required = (await getServerOptions(executor)).requireAdminMfa;
  return (
    !(security?.enabled || required) || (!!security?.enabled && secondFactor)
  );
}

export async function createAdminSession(
  tx: AuthTransaction,
  user: UserFields,
  secondFactor: boolean,
) {
  const session = {
    id: randomUUID(),
    userId: user.id,
    authVersion: user.authVersion,
    secondFactor,
    expiresAt: new Date(Date.now() + refreshLifetimeMs),
    revoked: false,
  };
  const refreshToken = randomAuthToken();
  await tx.insert(dbAuthSession).values(session);
  await tx
    .insert(dbRefreshToken)
    .values({ hash: hashAuthToken(refreshToken), sessionId: session.id });
  return { accessToken: signSession(session), refreshToken };
}

function signSession(session: typeof dbAuthSession.$inferSelect): string {
  if (!picrConfig.tokenSecret) throw new Error('Token secret not initialized');
  return jwt.sign(
    {
      kind: 'admin_access',
      sessionId: session.id,
      userId: session.userId,
      authVersion: session.authVersion,
    },
    picrConfig.tokenSecret,
    {
      algorithm: 'HS256',
      expiresIn: accessLifetimeSeconds,
    },
  );
}

export async function getAdminSession(
  auth?: string,
): Promise<
  { user: UserFields; session: typeof dbAuthSession.$inferSelect } | undefined
> {
  if (!auth?.startsWith('Bearer ') || !picrConfig.tokenSecret) return undefined;
  let claims: z.infer<typeof accessClaims>;
  try {
    claims = accessClaims.parse(
      jwt.verify(auth.slice(7), picrConfig.tokenSecret, {
        algorithms: ['HS256'],
      }),
    );
  } catch {
    return undefined;
  }
  const user = await db.query.dbUser.findFirst({
    where: eq(dbUser.id, claims.userId),
  });
  const session = await db.query.dbAuthSession.findFirst({
    where: eq(dbAuthSession.id, claims.sessionId),
  });
  if (
    !validAdmin(user) ||
    !session ||
    session.revoked ||
    session.expiresAt.getTime() <= Date.now() ||
    session.userId !== user.id ||
    session.authVersion !== user.authVersion ||
    claims.authVersion !== user.authVersion
  )
    return undefined;
  if (!(await sessionAllowed(user, session.secondFactor))) return undefined;
  return { user, session };
}

export async function refreshAdminSession(token: string, active = true) {
  const hash = hashAuthToken(token);
  const stored = await db.query.dbRefreshToken.findFirst({
    where: eq(dbRefreshToken.hash, hash),
  });
  if (!stored) throw new AdminAuthError('session_expired');
  const initial = await db.query.dbAuthSession.findFirst({
    where: eq(dbAuthSession.id, stored.sessionId),
  });
  if (!initial) throw new AdminAuthError('session_expired');
  const result = await db.transaction(async (tx) => {
    const user = await lockAdmin(tx, initial.userId);
    const session = (
      await tx
        .select()
        .from(dbAuthSession)
        .where(eq(dbAuthSession.id, initial.id))
        .for('update')
    ).at(0);
    const current = (
      await tx
        .select()
        .from(dbRefreshToken)
        .where(eq(dbRefreshToken.hash, hash))
    ).at(0);
    if (
      !session ||
      session.revoked ||
      session.expiresAt.getTime() <= Date.now() ||
      session.authVersion !== user.authVersion
    )
      return undefined;
    if (current?.usedAt && Date.now() - current.usedAt.getTime() < 10_000)
      return 'refresh_in_progress';
    if (!current || current.usedAt) {
      await tx
        .update(dbAuthSession)
        .set({ revoked: true })
        .where(eq(dbAuthSession.id, session.id));
      logger.warn('Admin refresh token reuse: session revoked', {
        userId: user.id,
        sessionId: session.id,
      });
      return undefined;
    }
    if (!(await sessionAllowed(user, session.secondFactor, tx)))
      return undefined;
    await tx
      .update(dbRefreshToken)
      .set({ usedAt: new Date() })
      .where(eq(dbRefreshToken.hash, hash));
    const refreshToken = randomAuthToken();
    await tx
      .insert(dbRefreshToken)
      .values({ hash: hashAuthToken(refreshToken), sessionId: session.id });
    if (active)
      await tx
        .update(dbAuthSession)
        .set({ expiresAt: new Date(Date.now() + refreshLifetimeMs) })
        .where(eq(dbAuthSession.id, session.id));
    return { accessToken: signSession(session), refreshToken };
  });
  if (result === 'refresh_in_progress')
    throw new AdminAuthError('refresh_in_progress', 409);
  if (!result) throw new AdminAuthError('session_expired');
  return result;
}

export async function revokeRefreshSession(token: string): Promise<void> {
  const stored = await db.query.dbRefreshToken.findFirst({
    where: eq(dbRefreshToken.hash, hashAuthToken(token)),
  });
  if (stored)
    await db
      .update(dbAuthSession)
      .set({ revoked: true })
      .where(eq(dbAuthSession.id, stored.sessionId));
}

export async function revokeAdminSessions(
  tx: AuthTransaction,
  userId: number,
): Promise<void> {
  await tx
    .update(dbAuthSession)
    .set({ revoked: true })
    .where(eq(dbAuthSession.userId, userId));
  await tx.delete(dbAuthChallenge).where(eq(dbAuthChallenge.userId, userId));
}

// Replay detection covers the last 28 days. Older hashes are removed even for active sessions; unknown tokens still fail authentication.
export async function cleanupAdminAuth(): Promise<void> {
  await db
    .delete(dbNativeAuthorization)
    .where(lt(dbNativeAuthorization.expiresAt, new Date()));
  await db
    .delete(dbRefreshToken)
    .where(lt(dbRefreshToken.usedAt, new Date(Date.now() - refreshLifetimeMs)));
  await db
    .delete(dbAuthChallenge)
    .where(lt(dbAuthChallenge.expiresAt, new Date()));
  await db.delete(dbAuthSession).where(lt(dbAuthSession.expiresAt, new Date()));
}

export async function createAuthChallenge(
  tx: AuthTransaction,
  user: UserFields,
  purpose: 'second_factor' | 'enrollment',
) {
  const challenge = randomAuthToken();
  await tx.insert(dbAuthChallenge).values({
    hash: hashAuthToken(challenge),
    userId: user.id,
    authVersion: user.authVersion,
    purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  return challenge;
}

export async function getAuthChallenge(challenge: string) {
  const row = await db.query.dbAuthChallenge.findFirst({
    where: and(
      eq(dbAuthChallenge.hash, hashAuthToken(challenge)),
      gt(dbAuthChallenge.expiresAt, new Date()),
      lt(dbAuthChallenge.attempts, 5),
    ),
  });
  if (!row) throw new AdminAuthError('challenge_expired');
  return row;
}
