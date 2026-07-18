// Recovery for the "stale chunk" problem: when a new frontend build is deployed
// while an old client is still open, the old client's hashed chunk filenames no
// longer exist on the server. Navigating to a lazily-loaded route then fails the
// dynamic import with a 404. We detect that failure and hard-reload the page so
// the client picks up the newly-deployed index.html and its current chunk names.

const RELOAD_FLAG_KEY = 'picr-chunk-reload-at';
// Only allow one recovery reload per window: if a chunk still fails to load
// right after reloading (a genuinely broken deploy, not a stale one), we must
// not loop forever.
const RELOAD_COOLDOWN_MS = 10_000;

// Reads the timestamp of the last recovery reload. Prefers sessionStorage, but
// falls back to a marker in the URL (which survives a reload) when storage is
// unavailable (private mode / sandboxed), so the cooldown still prevents a
// reload loop on a genuinely broken deploy.
const readLastReloadAt = (): number => {
  try {
    const stored = sessionStorage.getItem(RELOAD_FLAG_KEY);
    if (stored != null) return Number(stored) || 0;
  } catch {
    // storage unavailable; fall through to the URL marker
  }
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(
      RELOAD_FLAG_KEY,
    );
    return fromUrl ? Number(fromUrl) || 0 : 0;
  } catch {
    return 0;
  }
};

// Records a recovery reload at `now`. Uses sessionStorage when possible,
// otherwise stamps the timestamp into the URL as a fallback guard.
const writeLastReloadAt = (now: number): void => {
  try {
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(now));
    return;
  } catch {
    // storage unavailable; fall through to the URL marker
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(RELOAD_FLAG_KEY, String(now));
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // nothing more we can safely do; a single extra reload is the worst case
  }
};

// Whether a recovery reload is currently allowed (i.e. we are outside the
// cooldown window). Pure — no side effects — so callers can decide what UI to
// render before triggering the reload.
export const canReloadForNewVersion = (): boolean =>
  Date.now() - readLastReloadAt() >= RELOAD_COOLDOWN_MS;

// Detects the errors browsers/Vite throw when a dynamically-imported chunk can't
// be fetched. Message text varies across Chrome, Firefox and Safari, so we match
// the known variants plus the `ChunkLoadError` name some bundlers still emit.
export const isChunkLoadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('importing a module script failed')
  );
};

// Reloads to pick up the newly-deployed build, but at most once per cooldown
// window. Returns true if a reload was triggered, false if suppressed by the
// cooldown (so the caller can fall back to surfacing the error instead).
export const reloadForNewVersion = (): boolean => {
  if (!canReloadForNewVersion()) return false;
  writeLastReloadAt(Date.now());
  window.location.reload();
  return true;
};
