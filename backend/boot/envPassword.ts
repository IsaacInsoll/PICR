import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { hashPassword } from '../helpers/hashPassword.js';
import { defaultCredentials } from '../auth/defaultCredentials.js';
import { picrConfig } from '../config/picrConfig.js';
import { db } from '../db/picrDb.js';
import { dbUser } from '../db/models/index.js';
import { log } from '../logger.js';

// On first boot (no users yet) create the initial admin account. Otherwise,
// loudly warn if any enabled admin still uses the legacy default password.
// We never force a change or alter an existing login.
export const envPassword = async () => {
  const totalUsers = await db.$count(dbUser);

  if (totalUsers === 0) {
    await createInitialAdmin();
  } else {
    await warnIfDefaultPassword();
  }
};

const generatePassword = () => randomBytes(18).toString('base64url');

const createInitialAdmin = async () => {
  const username = picrConfig.adminUsername ?? defaultCredentials.username;
  const fromEnv = picrConfig.adminPassword;
  const password = fromEnv ?? generatePassword();

  await db.insert(dbUser).values({
    name: 'PICR Admin',
    username,
    hashedPassword: hashPassword(password),
    enabled: true,
    folderId: 1,
    commentPermissions: 'edit',
    createdAt: new Date(),
    updatedAt: new Date(),
    userType: 'Admin',
  });

  if (fromEnv) {
    log(
      'info',
      `🔐 No users found, so admin user "${username}" was created using ADMIN_PASSWORD from the environment.`,
      true,
    );
  } else {
    log(
      'warn',
      `\n🔐 No users found, so admin user "${username}" was created with a generated password:\n\n    ${password}\n\nLog in and change it now, or set ADMIN_PASSWORD in your environment to choose your own.\n`,
      true,
    );
  }
};

const warnIfDefaultPassword = async () => {
  const legacyHash = hashPassword(defaultCredentials.password);
  const insecure = await db
    .select({ username: dbUser.username })
    .from(dbUser)
    .where(
      and(
        eq(dbUser.enabled, true),
        eq(dbUser.deleted, false),
        eq(dbUser.hashedPassword, legacyHash),
      ),
    );

  if (insecure.length === 0) return;

  const names = insecure
    .map((u) => u.username)
    .filter(Boolean)
    .join(', ');
  log(
    'warn',
    `\n⚠️  SECURITY: ${insecure.length} user account(s) still use the default PICR password${names ? ` (${names})` : ''}.\n    Anyone who can reach this server can sign in with it — log in and change the password now.\n`,
    true,
  );
};
