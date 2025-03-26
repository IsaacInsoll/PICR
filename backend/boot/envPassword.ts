import UserModel from '../db/UserModel';
import { hashPassword } from '../helpers/hashPassword';
import { defaultCredentials } from '../auth/defaultCredentials';

export const envPassword = async () => {
  const totalUsers = await UserModel.count();
  if (totalUsers == 0) {
    UserModel.create({
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
