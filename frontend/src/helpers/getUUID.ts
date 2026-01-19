import { matchPath } from 'react-router';
import { getBaseHrefPathname } from './baseHref';

export const getUUID = () => {
  const basePathname = getBaseHrefPathname();
  const path = basePathname ? `${basePathname}/s/:uuid/*` : '/s/:uuid/*';
  const match = matchPath({ path }, window.location.pathname);
  return match?.params.uuid;
};
