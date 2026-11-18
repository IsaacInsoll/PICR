import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { db, getServerOptions, type UserFields } from '../db/picrDb.js';
import {
  dbAdminSecurity,
  dbAuthChallenge,
  dbServerOptions,
  dbUser,
} from '../db/models/index.js';
import { picrConfig } from '../config/picrConfig.js';
import {
  decryptMfaSecret,
  encryptMfaSecret,
  hashAuthToken,
} from './mfaCrypto.js';
import {
  AdminAuthError,
  createAdminSession,
  createAuthChallenge,
  getAuthChallenge,
  lockAdmin,
  revokeAdminSessions,
  validAdmin,
  type AuthTransaction,
} from './adminSessions.js';
import { hashPassword } from '../helpers/hashPassword.js';
import {
  isLoginBlocked,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from './loginRateLimit.js';
import { logger } from '../logger.js';

export const requireMfaKey = () => {
  if (!picrConfig.mfaEncryptionKey)
    throw new AdminAuthError('mfa_unavailable', 503);
};
export function passwordMatches(user: UserFields, password: string): boolean {
  const supplied = Buffer.from(hashPassword(password));
  const expected = Buffer.from(user.hashedPassword ?? '');
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

export async function passwordLogin(
  username: string,
  password: string,
  ipAddress?: string,
  client: 'web' | 'legacy_app' = 'web',
) {
  const identity = { username, ipAddress };
  if (isLoginBlocked(identity)) throw new AdminAuthError('rate_limited', 429);
  const found = await db.query.dbUser.findFirst({
    where: and(
      eq(dbUser.username, username),
      eq(dbUser.userType, 'Admin'),
      eq(dbUser.deleted, false),
    ),
  });
  if (!validAdmin(found) || !passwordMatches(found, password)) {
    recordFailedLoginAttempt(identity);
    throw new AdminAuthError('invalid_credentials');
  }
  return db.transaction(async (tx) => {
    const user = await lockAdmin(tx, found.id);
    if (!passwordMatches(user, password))
      throw new AdminAuthError('invalid_credentials');
    const security = (
      await tx
        .select()
        .from(dbAdminSecurity)
        .where(eq(dbAdminSecurity.userId, user.id))
    ).at(0);
    if (security?.enabled) {
      requireMfaKey();
      return {
        status: 'second_factor_required' as const,
        challenge: await createAuthChallenge(tx, user, 'second_factor'),
      };
    }
    if ((await getServerOptions(tx)).requireAdminMfa) {
      requireMfaKey();
      return {
        status: 'enrollment_required' as const,
        challenge: await createAuthChallenge(tx, user, 'enrollment'),
      };
    }
    recordSuccessfulLogin(identity);
    return {
      status: 'authenticated' as const,
      ...(await createAdminSession(
        tx,
        user,
        false,
        client === 'legacy_app' ? 'session' : 'short',
      )),
    };
  });
}

export async function verifyFactor(
  tx: AuthTransaction,
  userId: number,
  code: string,
): Promise<void> {
  requireMfaKey();
  const security = (
    await tx
      .select()
      .from(dbAdminSecurity)
      .where(eq(dbAdminSecurity.userId, userId))
  ).at(0);
  if (!security?.enabled || !security.secret)
    throw new AdminAuthError('invalid_code');
  if (/^\d{6}$/.test(code)) {
    let secret: string;
    try {
      secret = decryptMfaSecret(security.secret, userId);
    } catch {
      logger.error(
        'Cannot decrypt admin authenticator secret; check MFA encryption key',
        { userId },
      );
      throw new AdminAuthError('mfa_unavailable', 503);
    }
    const result = await verify({
      secret,
      token: code,
      epochTolerance: 30,
      afterTimeStep: security.lastTimeStep,
    });
    if (!result.valid || !('timeStep' in result))
      throw new AdminAuthError('invalid_code');
    await tx
      .update(dbAdminSecurity)
      .set({ lastTimeStep: result.timeStep })
      .where(eq(dbAdminSecurity.userId, userId));
  } else {
    const hash = hashAuthToken(code.replace(/[\s-]/g, '').toUpperCase());
    if (!security.recoveryHashes.includes(hash))
      throw new AdminAuthError('invalid_code');
    await tx
      .update(dbAdminSecurity)
      .set({
        recoveryHashes: security.recoveryHashes.filter((item) => item !== hash),
      })
      .where(eq(dbAdminSecurity.userId, userId));
  }
}

export async function completeSecondFactor(
  challenge: string,
  code: string,
  ipAddress?: string,
) {
  const row = await getAuthChallenge(challenge);
  const user = await db.query.dbUser.findFirst({
    where: eq(dbUser.id, row.userId),
  });
  const identity = { username: user?.username ?? undefined, ipAddress };
  if (isLoginBlocked(identity)) throw new AdminAuthError('rate_limited', 429);
  // Increment outside the verification transaction: failed verification must retain its attempt count.
  const attempt = (
    await db
      .update(dbAuthChallenge)
      .set({ attempts: sql`${dbAuthChallenge.attempts} + 1` })
      .where(
        and(
          eq(dbAuthChallenge.hash, row.hash),
          lt(dbAuthChallenge.attempts, 5),
          gt(dbAuthChallenge.expiresAt, new Date()),
        ),
      )
      .returning()
  ).at(0);
  if (!attempt) throw new AdminAuthError('challenge_expired');
  try {
    const session = await db.transaction(async (tx) => {
      const currentUser = await lockAdmin(tx, row.userId);
      const consumed = (
        await tx
          .delete(dbAuthChallenge)
          .where(
            and(
              eq(dbAuthChallenge.hash, row.hash),
              gt(dbAuthChallenge.expiresAt, new Date()),
            ),
          )
          .returning()
      ).at(0);
      if (
        consumed?.purpose !== 'second_factor' ||
        consumed.authVersion !== currentUser.authVersion
      )
        throw new AdminAuthError('challenge_expired');
      await verifyFactor(tx, currentUser.id, code);
      return createAdminSession(tx, currentUser, true);
    });
    recordSuccessfulLogin(identity);
    return { status: 'authenticated' as const, ...session };
  } catch (error) {
    if (error instanceof AdminAuthError && error.code === 'invalid_code')
      recordFailedLoginAttempt(identity);
    throw error;
  }
}

export async function setupAuthenticator(userId: number) {
  requireMfaKey();
  const secret = generateSecret();
  const user = await db.transaction(async (tx) => {
    const user = await lockAdmin(tx, userId);
    const existing = (
      await tx
        .select()
        .from(dbAdminSecurity)
        .where(eq(dbAdminSecurity.userId, userId))
    ).at(0);
    if (existing?.enabled) throw new AdminAuthError('invalid_request', 400);
    const pending = {
      pendingSecret: encryptMfaSecret(secret, userId),
      pendingExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    await tx
      .insert(dbAdminSecurity)
      .values({ userId, ...pending })
      .onConflictDoUpdate({ target: dbAdminSecurity.userId, set: pending });
    return user;
  });
  const uri = generateURI({
    issuer: `PICR (${new URL(picrConfig.baseUrl).host})`,
    label: user.username ?? String(user.id),
    secret,
  });
  return {
    secret,
    qrCode: await QRCode.toDataURL(uri, { margin: 2, width: 240 }),
  };
}

export const generateRecoveryCodes = () =>
  Array.from(
    { length: 10 },
    () =>
      randomBytes(10)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,5}/g)
        ?.join('-') ?? '',
  );
export const recoveryHashes = (codes: string[]) =>
  codes.map((code) => hashAuthToken(code.replaceAll('-', '')));

export async function confirmAuthenticator(
  userId: number,
  code: string,
  enrollmentChallenge?: string,
) {
  requireMfaKey();
  return db.transaction(async (tx) => {
    const user = await lockAdmin(tx, userId);
    const security = (
      await tx
        .select()
        .from(dbAdminSecurity)
        .where(eq(dbAdminSecurity.userId, userId))
    ).at(0);
    if (
      !security?.pendingSecret ||
      !security.pendingExpiresAt ||
      security.pendingExpiresAt.getTime() <= Date.now() ||
      security.enabled
    )
      throw new AdminAuthError('challenge_expired');
    let secret: string;
    try {
      secret = decryptMfaSecret(security.pendingSecret, userId);
    } catch {
      logger.error(
        'Cannot decrypt pending admin authenticator secret; check MFA encryption key',
        { userId },
      );
      throw new AdminAuthError('mfa_unavailable', 503);
    }
    const result = await verify({
      secret,
      token: code,
      epochTolerance: 30,
    });
    if (!result.valid || !('timeStep' in result))
      throw new AdminAuthError('invalid_code');
    if (enrollmentChallenge) {
      const row = (
        await tx
          .delete(dbAuthChallenge)
          .where(
            and(
              eq(dbAuthChallenge.hash, hashAuthToken(enrollmentChallenge)),
              gt(dbAuthChallenge.expiresAt, new Date()),
            ),
          )
          .returning()
      ).at(0);
      if (
        row?.userId !== userId ||
        row.authVersion !== user.authVersion ||
        row.purpose !== 'enrollment'
      )
        throw new AdminAuthError('challenge_expired');
    }
    const codes = generateRecoveryCodes();
    await tx
      .update(dbAdminSecurity)
      .set({
        enabled: true,
        secret: security.pendingSecret,
        pendingSecret: null,
        pendingExpiresAt: null,
        lastTimeStep: result.timeStep,
        recoveryHashes: recoveryHashes(codes),
      })
      .where(eq(dbAdminSecurity.userId, userId));
    const updated = (
      await tx
        .update(dbUser)
        .set({ authVersion: sql`${dbUser.authVersion} + 1` })
        .where(eq(dbUser.id, userId))
        .returning()
    ).at(0);
    if (!updated) throw new AdminAuthError('session_expired');
    await revokeAdminSessions(tx, userId);
    logger.info('Admin 2FA enabled', { userId });
    return {
      status: 'authenticated' as const,
      ...(await createAdminSession(tx, updated, true)),
      recoveryCodes: codes,
    };
  });
}

export async function changeMfa(
  userId: number,
  password: string,
  code: string,
  action: 'disable' | 'recovery' | 'policy',
  required?: boolean,
) {
  return db.transaction(async (tx) => {
    const user = await lockAdmin(tx, userId);
    if (!passwordMatches(user, password))
      throw new AdminAuthError('invalid_credentials');
    await verifyFactor(tx, userId, code);
    if (action === 'policy') {
      if (user.folderId !== 1) throw new AdminAuthError('invalid_request', 403);
      await tx
        .update(dbServerOptions)
        .set({ requireAdminMfa: required })
        .where(eq(dbServerOptions.id, 1));
      logger.info('Admin 2FA enforcement changed', { userId, required });
      return { recoveryCodes: [] };
    }
    if (action === 'disable') {
      if ((await getServerOptions(tx)).requireAdminMfa)
        throw new AdminAuthError('enrollment_required', 403);
      await tx
        .delete(dbAdminSecurity)
        .where(eq(dbAdminSecurity.userId, userId));
    }
    const codes = action === 'recovery' ? generateRecoveryCodes() : [];
    if (action === 'recovery')
      await tx
        .update(dbAdminSecurity)
        .set({ recoveryHashes: recoveryHashes(codes) })
        .where(eq(dbAdminSecurity.userId, userId));
    const updated = (
      await tx
        .update(dbUser)
        .set({ authVersion: sql`${dbUser.authVersion} + 1` })
        .where(eq(dbUser.id, userId))
        .returning()
    ).at(0);
    if (!updated) throw new AdminAuthError('session_expired');
    await revokeAdminSessions(tx, userId);
    logger.info('Admin 2FA security changed', { userId, action });
    return {
      ...(await createAdminSession(tx, updated, action !== 'disable')),
      recoveryCodes: codes,
    };
  });
}
