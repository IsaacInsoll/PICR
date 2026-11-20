import { createHash, timingSafeEqual } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import {
  dbAuthSession,
  dbNativeAuthorization,
} from '../db/models/dbAdminAuth.js';
import {
  AdminAuthError,
  createAdminSession,
  getAdminSession,
  lockAdmin,
  sessionAllowed,
} from './adminSessions.js';
import { hashAuthToken, randomAuthToken } from './mfaCrypto.js';
import type { NativeAuthorizationRequest } from '@shared/auth/nativeAuth.js';

export async function authorizeNativeApp(
  authorization: string | undefined,
  request: NativeAuthorizationRequest,
) {
  const current = await getAdminSession(authorization);
  if (!current) throw new AdminAuthError('session_expired');
  const code = randomAuthToken();
  await db.transaction(async (tx) => {
    const user = await lockAdmin(tx, current.user.id);
    if (
      user.authVersion !== current.session.authVersion ||
      !(await sessionAllowed(user, current.session.secondFactor, tx))
    )
      throw new AdminAuthError('session_expired');
    await tx.insert(dbNativeAuthorization).values({
      hash: hashAuthToken(code),
      sessionId: current.session.id,
      codeChallenge: request.codeChallenge,
      redirectUri: request.redirectUri,
      expiresAt: new Date(Date.now() + 60_000),
    });
  });
  return { code };
}

export async function exchangeNativeCode(
  code: string,
  verifier: string,
  redirectUri: string,
) {
  const hash = hashAuthToken(code);
  const pending = await db.query.dbNativeAuthorization.findFirst({
    where: eq(dbNativeAuthorization.hash, hash),
  });
  if (!pending) throw new AdminAuthError('session_expired');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  if (
    pending.redirectUri !== redirectUri ||
    !timingSafeEqual(Buffer.from(pending.codeChallenge), Buffer.from(challenge))
  )
    throw new AdminAuthError('invalid_request', 400);
  const source = await db.query.dbAuthSession.findFirst({
    where: eq(dbAuthSession.id, pending.sessionId),
  });
  if (!source) throw new AdminAuthError('session_expired');
  return db.transaction(async (tx) => {
    const user = await lockAdmin(tx, source.userId);
    const session = (
      await tx
        .select()
        .from(dbAuthSession)
        .where(eq(dbAuthSession.id, source.id))
        .for('update')
    ).at(0);
    if (
      !session ||
      session.revoked ||
      session.expiresAt.getTime() <= Date.now() ||
      session.authVersion !== user.authVersion ||
      !(await sessionAllowed(user, session.secondFactor, tx))
    )
      throw new AdminAuthError('session_expired');
    const consumed = await tx
      .delete(dbNativeAuthorization)
      .where(
        and(
          eq(dbNativeAuthorization.hash, hash),
          gt(dbNativeAuthorization.expiresAt, new Date()),
        ),
      )
      .returning();
    if (!consumed.length) throw new AdminAuthError('session_expired');
    return {
      status: 'authenticated' as const,
      username: user.username,
      ...(await createAdminSession(tx, user, session.secondFactor)),
    };
  });
}
