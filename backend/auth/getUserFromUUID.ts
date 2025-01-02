import { CustomJwtPayload } from '../types/CustomJwtPayload';
import UserModel from '../db/UserModel';

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<UserModel | undefined> => {
  const hasUUID = !!context.uuid && context.uuid !== '';
  if (hasUUID) {
    const user = await UserModel.findOne({ where: { uuid: context.uuid } });
    //todo: check expiry dates etc
    if (user && user.enabled) {
      return user;
    }
  }
};
