import User from '../models/User';
import { hashPassword } from '../helpers/hashPassword';
import { defaultCredentials } from '../auth/defaultCredentials';

export const envPassword = async () => {
  const totalUsers = await User.count();
  if (totalUsers == 0) {
    User.create({
      name: 'PICR Admin',
      username: defaultCredentials.username,
      hashedPassword: hashPassword(defaultCredentials.password),
      enabled: true,
      folderId: 1,
      commentPermissions: 'edit',
    }).then(() =>
      console.log(
        `🔐 No users found so "${defaultCredentials.username}" user created with password "${defaultCredentials.password}"`,
      ),
    );
  }
};
