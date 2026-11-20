import express from 'express';
import { adminOriginAllowed } from './adminAuthOrigin.js';
import type { Request, Response, Router } from 'express';
import { z } from 'zod';
import { and, count, eq, gt, isNotNull, lt, ne, sql } from 'drizzle-orm';
import { db, getServerOptions } from '../db/picrDb.js';
import {
  dbAdminSecurity,
  dbAuthChallenge,
  dbUser,
} from '../db/models/index.js';
import {
  AdminAuthError,
  getAdminSession,
  getAuthChallenge,
  refreshAdminSession,
  refreshLifetimeMs,
  revokeRefreshSession,
} from '../auth/adminSessions.js';
import {
  changeMfa,
  completeSecondFactor,
  confirmAuthenticator,
  passwordLogin,
  passwordMatches,
  setupAuthenticator,
} from '../auth/adminFactors.js';
import { getBasePrefix } from './basePath.js';
import { picrConfig } from '../config/picrConfig.js';
import { logger } from '../logger.js';
import {
  isLoginBlocked,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from '../auth/loginRateLimit.js';
import type { AdminSecurityStatus } from '@shared/auth/adminAuth.js';
import {
  nativeRedirectUris,
  type NativeAccount,
} from '@shared/auth/nativeAuth.js';
import { userToJSON } from '../graphql/helpers/userToJSON.js';
import {
  authorizeNativeApp,
  exchangeNativeCode,
} from '../auth/nativeAuthorization.js';

const credentials = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(1024),
});
const factorInput = z.object({
  challenge: z.string().min(1).max(128),
  code: z.string().min(1).max(128),
});
const securityInput = z.object({
  password: z.string().min(1).max(1024),
  code: z.string().min(1).max(128),
  action: z.enum(['disable', 'recovery', 'policy']),
  required: z.boolean().optional(),
});
const cookieName = 'picr_refresh';
const refreshCookie = (req: Request): string | undefined =>
  req.headers.cookie
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
const cookieOptions = (req: Request) => ({
  httpOnly: true,
  secure: req.secure,
  sameSite: 'strict' as const,
  path: `${getBasePrefix()}/api/auth`,
  maxAge: refreshLifetimeMs,
});

function sendSession<T extends object>(
  res: Response,
  result: T,
  req: Request,
): void {
  if (
    req.get('x-picr-client') !== 'native' &&
    'refreshToken' in result &&
    typeof result.refreshToken === 'string'
  )
    res.cookie(cookieName, result.refreshToken, cookieOptions(req));
  // Native support uses SecureStore rather than browser cookies; no CORS is enabled.
  res.json(
    req.get('x-picr-client') === 'native'
      ? result
      : { ...result, refreshToken: undefined },
  );
}

async function currentAdmin(req: Request) {
  const auth = await getAdminSession(req.get('authorization'));
  if (!auth) throw new AdminAuthError('session_expired');
  return auth.user;
}

async function enrollmentIdentity(req: Request) {
  const authorization = req.get('authorization');
  if (authorization?.startsWith('Enrollment ')) {
    const challenge = authorization.slice(11);
    const row = await getAuthChallenge(challenge);
    const user = await db.query.dbUser.findFirst({
      where: and(
        eq(dbUser.id, row.userId),
        eq(dbUser.authVersion, row.authVersion),
        eq(dbUser.enabled, true),
        eq(dbUser.deleted, false),
        eq(dbUser.userType, 'Admin'),
      ),
    });
    if (!user || row.purpose !== 'enrollment')
      throw new AdminAuthError('challenge_expired');
    return { user, challenge };
  }
  return { user: await currentAdmin(req), challenge: undefined };
}

export function registerAdminAuthRoutes(router: Router): void {
  const auth = express.Router();
  auth.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // A custom header + JSON requires a browser preflight cross-origin. Never enable CORS here.
    if (
      req.method !== 'POST' ||
      req.get('x-picr-auth') !== '1' ||
      !req.is('application/json')
    ) {
      res.status(403).json({ error: 'invalid_request' });
      return;
    }
    if (!adminOriginAllowed(req, res)) return;
    next();
  });
  auth.use(express.json({ limit: '8kb' }));
  const route = (
    path: string,
    handler: (req: Request, res: Response) => Promise<void>,
  ) =>
    auth.post(path, async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        if (error instanceof AdminAuthError)
          res.status(error.status).json({ error: error.code });
        else if (error instanceof z.ZodError)
          res.status(400).json({ error: 'invalid_request' });
        else {
          logger.error('Admin authentication operation failed', {
            operation: path,
            error: error instanceof Error ? error.message : String(error),
          });
          res.status(500).json({ error: 'server_error' });
        }
      }
    });
  route('/login', async (req, res) => {
    const input = credentials.parse(req.body);
    sendSession(
      res,
      await passwordLogin(input.username, input.password, req.ip),
      req,
    );
  });
  route('/native/config', async (_req, res) => {
    res.json({ version: 1 });
  });
  route('/native/account', async (req, res) => {
    const user = await currentAdmin(req);
    const { name, username, gravatar } = userToJSON(user);
    res.json({ name, username, gravatar } satisfies NativeAccount);
  });
  route('/native/authorize', async (req, res) => {
    const input = z
      .object({
        redirectUri: z.enum(nativeRedirectUris),
        codeChallenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        state: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
      })
      .parse(req.body);
    res.json(await authorizeNativeApp(req.get('authorization'), input));
  });
  route('/native/token', async (req, res) => {
    if (req.get('x-picr-client') !== 'native')
      throw new AdminAuthError('invalid_request', 400);
    const input = z
      .object({
        code: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        codeVerifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
        redirectUri: z.enum(nativeRedirectUris),
      })
      .parse(req.body);
    // A native session must never replace the browser's refresh cookie.
    res.json(
      await exchangeNativeCode(
        input.code,
        input.codeVerifier,
        input.redirectUri,
      ),
    );
  });
  route('/verify', async (req, res) => {
    const input = factorInput.parse(req.body);
    sendSession(
      res,
      await completeSecondFactor(input.challenge, input.code, req.ip),
      req,
    );
  });
  route('/refresh', async (req, res) => {
    const input = z
      .object({
        refreshToken: z.string().max(128).optional(),
        active: z.boolean().default(true),
      })
      .parse(req.body);
    const token =
      req.get('x-picr-client') === 'native'
        ? input.refreshToken
        : refreshCookie(req);
    if (!token) {
      res.json({ status: 'anonymous' });
      return;
    }
    sendSession(res, await refreshAdminSession(token, input.active), req);
  });
  route('/logout', async (req, res) => {
    const input = z
      .object({ refreshToken: z.string().max(128).optional() })
      .parse(req.body);
    const token =
      req.get('x-picr-client') === 'native'
        ? input.refreshToken
        : refreshCookie(req);
    if (token) await revokeRefreshSession(token);
    if (req.get('x-picr-client') !== 'native')
      res.clearCookie(cookieName, cookieOptions(req));
    res.json({ success: true });
  });
  route('/security', async (req, res) => {
    const user = await currentAdmin(req);
    const security = await db.query.dbAdminSecurity.findFirst({
      where: eq(dbAdminSecurity.userId, user.id),
    });
    const total = (
      await db
        .select({ value: count() })
        .from(dbUser)
        .leftJoin(dbAdminSecurity, eq(dbAdminSecurity.userId, dbUser.id))
        .where(
          and(
            eq(dbUser.userType, 'Admin'),
            eq(dbUser.enabled, true),
            eq(dbUser.deleted, false),
            isNotNull(dbUser.hashedPassword),
            ne(dbUser.hashedPassword, ''),
            isNotNull(dbUser.username),
            ne(dbUser.username, ''),
            sql`coalesce(${dbAdminSecurity.enabled}, false) = false`,
          ),
        )
    ).at(0);
    const status: AdminSecurityStatus = {
      available: !!picrConfig.mfaEncryptionKey,
      enabled: !!security?.enabled,
      required: (await getServerOptions()).requireAdminMfa,
      canManagePolicy: user.folderId === 1,
      unenrolledAdmins: user.folderId === 1 ? (total?.value ?? 0) : 0,
      recoveryCodesRemaining: security?.recoveryHashes.length ?? 0,
    };
    res.json(status);
  });
  route('/setup', async (req, res) => {
    const { user, challenge } = await enrollmentIdentity(req);
    const input = z
      .object({ password: z.string().max(1024).optional() })
      .parse(req.body);
    if (!challenge) {
      const identity = {
        username: user.username ?? undefined,
        ipAddress: req.ip,
      };
      if (isLoginBlocked(identity))
        throw new AdminAuthError('rate_limited', 429);
      if (!input.password || !passwordMatches(user, input.password)) {
        recordFailedLoginAttempt(identity);
        throw new AdminAuthError('invalid_credentials');
      }
    }
    res.json(await setupAuthenticator(user.id));
  });
  route('/confirm', async (req, res) => {
    const { user, challenge } = await enrollmentIdentity(req);
    const { code } = z
      .object({ code: z.string().regex(/^\d{6}$/) })
      .parse(req.body);
    const identity = {
      username: user.username ?? undefined,
      ipAddress: req.ip,
    };
    if (isLoginBlocked(identity)) throw new AdminAuthError('rate_limited', 429);
    if (challenge) {
      const row = await getAuthChallenge(challenge);
      const reserved = (
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
      if (!reserved) throw new AdminAuthError('challenge_expired');
    }
    try {
      sendSession(
        res,
        await confirmAuthenticator(user.id, code, challenge),
        req,
      );
      recordSuccessfulLogin(identity);
    } catch (error) {
      if (error instanceof AdminAuthError && error.code === 'invalid_code')
        recordFailedLoginAttempt(identity);
      throw error;
    }
  });
  route('/change', async (req, res) => {
    const user = await currentAdmin(req);
    const input = securityInput.parse(req.body);
    if (input.action === 'policy' && input.required === undefined)
      throw new AdminAuthError('invalid_request', 400);
    const identity = {
      username: user.username ?? undefined,
      ipAddress: req.ip,
    };
    if (isLoginBlocked(identity)) throw new AdminAuthError('rate_limited', 429);
    try {
      sendSession(
        res,
        await changeMfa(
          user.id,
          input.password,
          input.code,
          input.action,
          input.required,
        ),
        req,
      );
      recordSuccessfulLogin(identity);
    } catch (error) {
      if (
        error instanceof AdminAuthError &&
        ['invalid_code', 'invalid_credentials'].includes(error.code)
      )
        recordFailedLoginAttempt(identity);
      throw error;
    }
  });
  router.use('/api/auth', auth);
}
