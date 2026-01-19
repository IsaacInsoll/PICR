const normalizeBasePathname = (pathname: string) => {
  if (!pathname || pathname === '/') return '';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

export const getBaseHrefPathname = () => {
  if (typeof document === 'undefined') return '';
  try {
    const baseUrl = new URL(document.baseURI);
    return normalizeBasePathname(baseUrl.pathname);
  } catch {
    return '';
  }
};

export const withBasePath = (path: string) => {
  const basePathname = getBaseHrefPathname();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  console.log({ basePathname, normalizedPath });
  if (!basePathname) return normalizedPath;
  return `${basePathname}${normalizedPath}`;
};
