import User from '../../models/User';
import { userToJSON } from './userToJSON';

type UserRelationship = { userId: string }[];

// Takes a list of objects with `userId` relationship and adds *BASIC* user details to each object
export const addUserRelationship = async (
  list: UserRelationship,
): Promise<UserRelationship> => {
  const ids = list.map((b) => b.userId).filter((v, i, a) => a.indexOf(v) === i);
  if (ids.length == 0) return list;

  const users = await User.findAll({ where: { id: ids } });
  console.log('second map');
  return list.map((obj) => {
    const user = userToJSON(users.find((f) => f.id == obj.userId));
    const userLimitedDetails = {
      id: user.id,
      name: user.name,
      gravatar: user.gravatar,
    };
    return { ...obj, user: userLimitedDetails };
  });
};
