import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { Anchor, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  fetchDeployedEntryHash,
  getLoadedEntryHash,
} from '../helpers/versionWatcher';

// How often to check whether a new build has been deployed.
const POLL_INTERVAL_MS = 5 * 60 * 1000;
// Once an update is available, auto-reload after this much continuous inactivity.
// A hidden/backgrounded tab has no activity so it reaches this too, but only
// after the full delay — a quick tab-switch mid-edit returns (and any keystroke
// resets the timer) well before then, so we don't discard unsaved work.
const IDLE_RELOAD_MS = 3 * 60 * 1000;
const NOTIFICATION_ID = 'picr-new-version';

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const;

const translatedNotification = (
  t: TFunction<'common'>,
  reload: () => void,
) => ({
  title: t('update.available'),
  message: (
    <Text size="sm">
      {t('update.autoRefresh')}{' '}
      <Anchor component="button" type="button" onClick={reload}>
        {t('update.refreshNow')}
      </Anchor>
    </Text>
  ),
});

// Proactively recovers from the stale-chunk problem: rather than waiting for a
// navigation to fail on a missing chunk (handled by chunkReload as a last
// resort), this notices a new deploy and reloads the page while the user isn't
// actively doing anything, so they rarely see the mid-action reload.
export const VersionWatcher = () => {
  const { t } = useTranslation('common');
  const tRef = useRef(t);
  const reloadRef = useRef<(() => void) | null>(null);

  // The watcher is intentionally mount-only. Update its translator ref and any
  // visible notification without cancelling timers or invalidating reload's
  // closure when the user changes language.
  useEffect(() => {
    tRef.current = t;
    if (reloadRef.current) {
      notifications.update({
        id: NOTIFICATION_ID,
        ...translatedNotification(t, reloadRef.current),
      });
    }
  }, [t]);

  useEffect(() => {
    // Dev builds serve unhashed modules from Vite, so there is nothing to diff.
    if (import.meta.env.DEV) return;

    const baseline = getLoadedEntryHash();
    if (!baseline) return;

    // Held in an object rather than a plain `let` so that reads after an `await`
    // aren't narrowed to a stale literal by control-flow analysis (cleanup can
    // flip it while a version check is in flight).
    const cancelled = { current: false };
    // Read through a function so control-flow analysis can't narrow the value to
    // a stale literal across an `await` (the cleanup below flips it while a
    // version check may be in flight).
    const isCancelled = () => cancelled.current;
    let updateAvailable = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const reload = () => {
      if (isCancelled()) return;
      cancelled.current = true;
      window.location.reload();
    };

    // (Re)start the visible-idle countdown; user activity keeps pushing it out,
    // so it only fires once the user has been inactive for IDLE_RELOAD_MS.
    const resetIdleTimer = () => {
      if (!updateAvailable || isCancelled()) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(reload, IDLE_RELOAD_MS);
    };

    const onVisibilityChange = () => {
      // While hidden we do nothing: the idle timer keeps counting so a genuinely
      // abandoned tab still reloads, but we never reload out from under a user
      // who only briefly switched away (which could drop unsaved edits).
      if (document.visibilityState !== 'visible') return;
      // Back on the tab: give an active user a fresh idle window before we
      // reload, otherwise poll for a new build.
      if (updateAvailable) resetIdleTimer();
      else void check();
    };

    const onUpdateAvailable = () => {
      if (updateAvailable) return;
      updateAvailable = true;
      reloadRef.current = reload;
      notifications.show({
        id: NOTIFICATION_ID,
        ...translatedNotification(tRef.current, reload),
        color: 'blue',
        autoClose: false,
        withCloseButton: true,
      });
      ACTIVITY_EVENTS.forEach((event) =>
        window.addEventListener(event, resetIdleTimer, { passive: true }),
      );
      resetIdleTimer();
    };

    const check = async () => {
      if (isCancelled() || updateAvailable) return;
      // No point polling a backgrounded tab; it re-checks when it becomes
      // visible again via onVisibilityChange.
      if (document.visibilityState !== 'visible') return;
      const deployed = await fetchDeployedEntryHash();
      if (!isCancelled() && deployed && deployed !== baseline)
        onUpdateAvailable();
    };

    const interval = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    void check();

    return () => {
      cancelled.current = true;
      reloadRef.current = null;
      notifications.hide(NOTIFICATION_ID);
      clearInterval(interval);
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer),
      );
    };
  }, []);

  return null;
};
