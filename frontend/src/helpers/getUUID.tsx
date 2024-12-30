import { matchPath } from 'react-router';

export const getUUID = () => {
  const match = matchPath({ path: '/s/:uuid/*' }, window.location.pathname);
  return match?.params.uuid;
};