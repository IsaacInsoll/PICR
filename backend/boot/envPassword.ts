import User from '../models/User';
import { hashPassword } from '../helpers/hashPassword';

export const envPassword = async () => {
  const totalUsers = await User.count();
  if (totalUsers == 0) {
    User.create({
      name: 'PICR Admin',
      username: 'admin',
      hashedPassword: hashPassword('picr1234'),
      enabled: true,
      folderId: 1,
    }).then(() =>
      console.log(
        '🔐 No users found so "admin" user created with password "picr1234"',
      ),
    );
  }
};
