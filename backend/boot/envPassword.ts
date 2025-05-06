import { hashPassword } from '../helpers/hashPassword.js';
import { defaultCredentials } from '../auth/defaultCredentials.js';
import { db } from '../db/picrDb.js';
import { dbUser } from '../db/models/index.js';

export const envPassword = async () => {
  const totalUsers = await db.$count(dbUser);

  if (totalUsers == 0) {
    await db
      .insert(dbUser)
      .values({
        name: 'PICR Admin',
        username: defaultCredentials.username,
        hashedPassword: hashPassword(defaultCredentials.password),
        enabled: true,
        folderId: 1,
        commentPermissions: 'edit',
        createdAt: new Date(),
        updatedAt: new Date(),
        userType: 'Admin',
      })
      .then(() =>
        console.log(
          `🔐 No users found so "${defaultCredentials.username}" user created with password "${defaultCredentials.password}"`,
        ),
      );
  }
};
