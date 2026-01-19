import { picrConfig } from '../config/picrConfig.js';

export const getBasePrefix = () => {
  if (picrConfig.baseUrlPathname === '/') return '';
  return picrConfig.baseUrlPathname.replace(/\/$/, '');
};

export const stripBasePrefix = (originalUrl: string) => {
  const basePrefix = getBasePrefix();
  const path = originalUrl.split('?')[0];
  if (basePrefix && path.startsWith(basePrefix)) {
    return path.slice(basePrefix.length) || '/';
  }
  return path;
};
