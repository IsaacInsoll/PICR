import { ReactNode } from 'react';
import { useIsLoggedIn } from '../atoms/authAtom';

// Doesn't do much yet, but will eventually catch "logged in but don't have access to this item" issues
export const UserProvider = ({ children }: { children: ReactNode }) => {
  // const loggedIn = useIsLoggedIn();
  return <>{children}</>;
};
