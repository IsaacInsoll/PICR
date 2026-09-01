import { createContext, useContext, type ReactNode } from 'react';
import type { AuthenticatedServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

const AuthenticatedServerOriginContext =
  createContext<AuthenticatedServerOrigin | null>(null);

export const AuthenticatedServerOriginProvider = ({
  origin,
  children,
}: {
  origin: AuthenticatedServerOrigin;
  children: ReactNode;
}) => (
  <AuthenticatedServerOriginContext.Provider value={origin}>
    {children}
  </AuthenticatedServerOriginContext.Provider>
);

export const useAuthenticatedServerOrigin = (): AuthenticatedServerOrigin => {
  const origin = useContext(AuthenticatedServerOriginContext);
  if (!origin) {
    throw new Error(
      'useAuthenticatedServerOrigin must be used inside PicrUserProvider',
    );
  }
  return origin;
};
