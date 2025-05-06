import { User } from "../../graphql-types.js";

export interface ExtraUserProps {
  isUser?: boolean;
  isAdmin?: boolean;
  isLink?: boolean;
}

export const extraUserProps = (
  user?: Pick<User, 'userType'> | null,
): ExtraUserProps => {
  return {
    isUser: user?.userType == 'User' || user?.userType == 'Admin',
    isAdmin: user?.userType == 'Admin',
    isLink: user?.userType == 'Link',
  };
};
