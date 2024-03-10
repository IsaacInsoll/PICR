import User from '../models/User';
import { hashPassword } from '../helpers/hashPassword';
import { generateAccessToken } from '../auth/jwt-auth';

export const authMutation = async (params, context) => {
  const p = params.password;
  if (!p || p === '') return '';
  const user = await User.findOne({
    where: {
      username: params.user,
      hashedPassword: hashPassword(p),
    },
  });
  if (!user) return '';
  return generateAccessToken({ userId: user.id });
};
