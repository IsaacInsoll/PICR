import { Navigate, useParams } from 'react-router';
import { useMe } from '../hooks/useMe';
import { LoadingIndicator } from '../components/LoadingIndicator';

// A public link URL with no folder id (`/s/<uuid>`) is what people end up with
// when they copy the Link ID out of the admin UI by hand rather than using
// 'Copy Link'. Send them to the link's home folder instead of the 'page not
// found' screen. Links that don't exist or are disabled never reach here: the
// passcode gate in UserProvider renders 'Gallery unavailable' first.
export const PublicLinkHomeRedirect = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const me = useMe();
  if (!uuid) return <Navigate to="/" replace />;
  if (!me) return <LoadingIndicator size="large" />;
  return <Navigate to={`/s/${uuid}/${me.folderId}`} replace />;
};
