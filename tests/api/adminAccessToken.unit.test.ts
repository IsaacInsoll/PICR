import { createHmac } from 'node:crypto';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAdminSession } from '../../backend/auth/adminSessions';

const database = vi.hoisted(() => ({
  query: {
    dbUser: { findFirst: vi.fn() },
    dbAuthSession: { findFirst: vi.fn() },
    dbAdminSecurity: { findFirst: vi.fn() },
  },
}));
vi.mock('../../backend/db/picrDb.js', () => ({
  db: database,
  getServerOptions: async () => ({ requireAdminMfa: false }),
}));
vi.mock('../../backend/config/picrConfig.js', () => ({
  picrConfig: { tokenSecret: 'access-token-test-secret' },
}));
vi.mock('../../backend/logger.js', () => ({
  logger: { warn: vi.fn() },
  log: vi.fn(),
}));
const sessionId = '00000000-0000-4000-8000-000000000001';
const user = {
  id: 1,
  userType: 'Admin',
  enabled: true,
  deleted: false,
  hashedPassword: 'test-hash',
  authVersion: 1,
};
function signedToken(lifetime?: number) {
  const issued = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      kind: 'admin_access',
      sessionId,
      userId: 1,
      authVersion: 1,
      iat: issued,
      ...(lifetime === undefined ? {} : { exp: issued + lifetime }),
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', 'access-token-test-secret')
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `Bearer ${header}.${payload}.${signature}`;
}
beforeEach(() => {
  vi.clearAllMocks();
  database.query.dbUser.findFirst.mockResolvedValue(user);
  database.query.dbAuthSession.findFirst.mockResolvedValue({
    id: sessionId,
    userId: 1,
    authVersion: 1,
    secondFactor: false,
    revoked: false,
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
  });
  database.query.dbAdminSecurity.findFirst.mockResolvedValue(undefined);
});
test('current short-lived access tokens remain valid', async () => {
  expect((await getAdminSession(signedToken(15 * 60)))?.user).toEqual(user);
});
test('previously issued 28-day compatibility tokens are rejected on upgrade', async () => {
  expect(await getAdminSession(signedToken(28 * 24 * 60 * 60))).toBeUndefined();
  expect(database.query.dbUser.findFirst).not.toHaveBeenCalled();
});
test('access tokens without an expiry are rejected', async () => {
  expect(await getAdminSession(signedToken())).toBeUndefined();
});
