import { Router } from '../Router';
import { useMe } from '../hooks/useMe';
import { usePublicLinkPasscodeGate } from './PublicLinkPasscodeGate';

// Doesn't do much yet, but will eventually catch "logged in but don't have access to this item" issues
export const UserProvider = () => {
  const passcodeGate = usePublicLinkPasscodeGate();
  const me = useMe({ pause: passcodeGate.pauseMe });

  if (passcodeGate.element) return passcodeGate.element;

  return (
    <>
      <Router loggedIn={!!me?.id} />
    </>
  );
};
