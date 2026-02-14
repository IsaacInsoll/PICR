import { Router } from '../Router';
import { useMe } from '../hooks/useMe';

// Doesn't do much yet, but will eventually catch "logged in but don't have access to this item" issues
export const UserProvider = () => {
  const me = useMe();
  return (
    <>
      <Router loggedIn={!!me?.id} />
    </>
  );
};
