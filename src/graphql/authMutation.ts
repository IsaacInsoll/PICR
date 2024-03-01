import User from '../models/User';
import { hashPassword } from '../helpers/hashPassword';
import { generateAccessToken } from '../auth/jwt-auth';

export const authMutation = async (params, context) => {
  const user = await User.findOne({
    where: {
      username: params.user,
      hashedPassword: hashPassword(params.password),
    },
  });
  if (!user) return '';
  return generateAccessToken({ userId: user.id });
};
