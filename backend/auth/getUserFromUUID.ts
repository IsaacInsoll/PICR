import { CustomJwtPayload } from '../types/CustomJwtPayload';
import User from '../models/User';

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<User | undefined> => {
  const hasUUID = !!context.uuid && context.uuid !== '';
  if (hasUUID) {
    const user = await User.findOne({ where: { uuid: context.uuid } });
    //todo: check expiry dates etc
    if (user && user.enabled) {
      return user;
    }
  }
};
