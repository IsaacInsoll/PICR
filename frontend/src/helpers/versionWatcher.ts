import { withBasePath } from './baseHref';

// Detects when a newer frontend build has been deployed by comparing the hashed
// entry-chunk filename (e.g. "index-DFdHOPWz.js") this client loaded against the
// one referenced by the currently-served index.html. The hash changes on every
// build, so a mismatch means a new deploy. This only reads the public
// index.html, so it works for every user (including unauthenticated gallery
// viewers) with no backend changes.

// Vite names the app entry chunk after its `index.html` input, so it is always
// `assets/index-<hash>.js`.
const ENTRY_RE = /assets\/(index-[A-Za-z0-9_-]+\.js)/;

export const parseEntryHash = (html: string): string | null =>
  html.match(ENTRY_RE)?.[1] ?? null;

// The entry chunk this running client was loaded from, read from the module
// script tags already present in the document.
export const getLoadedEntryHash = (): string | null => {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="module"][src]',
  );
  for (const script of scripts) {
    const match = script.getAttribute('src')?.match(ENTRY_RE);
    if (match) return match[1];
  }
  return null;
};

// Fetches the currently-deployed index.html (cache-busted) and returns its entry
// hash, or null on any failure (offline, 5xx, parse miss) so callers can skip
// this round rather than acting on bad data.
export const fetchDeployedEntryHash = async (): Promise<string | null> => {
  try {
    const url = `${withBasePath('/')}?_versionCheck=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return parseEntryHash(await res.text());
  } catch {
    return null;
  }
};
