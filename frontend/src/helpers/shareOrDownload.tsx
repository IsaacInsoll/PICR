import { notifications } from '@mantine/notifications';
import {
  Button,
  Group,
  Loader,
  Modal,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import type { PicrFile } from '@shared/types/picr';
import { prettyBytes } from '@shared/prettyBytes';
import { useSyncExternalStore } from 'react';
import { useLanguage } from '../i18n/useLanguage';

// iOS (including iPadOS, which reports itself as desktop Safari) does not honor the
// HTML5 anchor `download` attribute for same-origin files — it opens the "Save to
// Files" document picker instead. For photos/videos users expect the native share
// sheet ("Save to Photos"), which we get via the Web Share API. Android/desktop keep
// the working anchor-download behavior untouched.
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

// Only iOS gets the share-sheet path. We deliberately gate on iOS rather than plain
// `navigator.canShare` support because Android Chrome also supports canShare, but its
// anchor download already works and must not change.
export const canUseShareSheet = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  isIOS();

// Media that belongs in the Photos library. Documents keep the "Save to Files" flow.
export const isShareableMediaFile = (file: Pick<PicrFile, 'type'>): boolean =>
  file.type === 'Image' || file.type === 'Video';

// Fallback download: a plain anchor click (mirrors triggerDownload in TaskSummary.tsx).
export const anchorDownload = (url: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? '';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface DownloadProgress {
  received: number;
  total?: number;
  bytesPerSecond?: number;
}

interface SharePromptState {
  id: string;
  filename: string;
  file?: File;
  percent?: number;
  progress?: DownloadProgress;
  status: 'downloading' | 'ready' | 'saving';
  url: string;
  // Aborts the in-flight fetch. Only set while status is 'downloading' — once the
  // file is in hand there is nothing left to cancel.
  cancel?: () => void;
}

// Presentation only: how long after the tap a download may run before the progress
// modal appears. Downloads that finish first show no UI at all and go straight to
// the share sheet, which is the common case for images.
//
// This is NOT an attempt to guess Safari's transient activation timer — auto-share
// is gated by hasTransientActivation() instead, and tuning this changes only when
// the modal appears, never whether sharing works. Do not "fix" it to match some
// timer value.
//
// 1s rather than something longer because once the modal is up we ask for a fresh
// tap unconditionally (see the promptShown check below). Any download still running
// at 1s has most likely outlived activation and was going to need that tap anyway,
// so the modal rarely costs a tap that we would otherwise have skipped.
const SHARE_PROMPT_UI_DELAY_MS = 1000;

// Only consulted on browsers without navigator.userActivation (Safari/iOS < 16.4).
// Chrome documents its transient activation as "about a second", and the HTML spec
// says "at most a few seconds", so this is deliberately pessimistic.
const ACTIVATION_FALLBACK_MS = 1000;

/**
 * Best-effort check for whether we still hold transient activation, i.e. whether
 * navigator.share() is likely to be allowed without a fresh tap.
 *
 * WebKit deliberately does not expose Safari's activation timer, and has no fix for
 * the "slow fetch, then share()" case — our exact failure mode is their worked
 * example: https://webkit.org/blog/13862/the-user-activation-api/
 *
 * This is only an optimization to skip an extra tap. A wrong answer costs one extra
 * tap, never a failed download: callers fall back to the ready modal, and a
 * NotAllowedError from share() recovers into that same modal.
 */
const hasTransientActivation = (tappedAt: number): boolean => {
  // Typed as always-present in lib.dom, but genuinely absent before Safari/iOS 16.4.
  const activation = navigator.userActivation as UserActivation | undefined;
  if (activation) return activation.isActive;
  return performance.now() - tappedAt < ACTIVATION_FALLBACK_MS;
};

let activeShareDownloadId: string | null = null;
let sharePromptState: SharePromptState | null = null;
const sharePromptListeners = new Set<() => void>();

const setSharePromptState = (state: SharePromptState | null) => {
  sharePromptState = state;
  sharePromptListeners.forEach((listener) => listener());
};

const subscribeToSharePrompt = (listener: () => void) => {
  sharePromptListeners.add(listener);
  return () => {
    sharePromptListeners.delete(listener);
  };
};

const getSharePromptSnapshot = () => sharePromptState;

const getServerSharePromptSnapshot = () => null;

const clearActiveShareDownload = (downloadId: string) => {
  if (activeShareDownloadId === downloadId) {
    activeShareDownloadId = null;
  }
};

const showDownloadInProgressNotification = () => {
  notifications.show({
    // Fixed id so repeated taps replace this toast instead of stacking copies.
    id: 'share-download-busy',
    color: 'yellow',
    title: 'Download already running',
    message: 'Wait for the current download to finish before starting another.',
    autoClose: 4000,
  });
};

const describeShareError = (error: unknown): string => {
  if (error instanceof DOMException) {
    return `${error.name}: ${error.message}`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

const fallbackNotificationContent = (error: unknown) => (
  <Stack gap={4}>
    <Text size="sm">Falling back to file download.</Text>
    <Text size="xs" c="dimmed">
      {describeShareError(error)}
    </Text>
  </Stack>
);

const showFallbackNotification = (notificationId: string, error: unknown) => {
  notifications.show({
    id: notificationId,
    color: 'red',
    title: 'Download failed',
    message: fallbackNotificationContent(error),
    autoClose: 6000,
    withCloseButton: true,
  });
};

const showCanShareFallbackNotification = (notificationId: string) => {
  notifications.show({
    id: notificationId,
    color: 'yellow',
    title: 'Download fallback',
    message: (
      <Stack gap={4}>
        <Text size="sm">This browser could not share this file.</Text>
        <Text size="xs" c="dimmed">
          navigator.canShare returned false for the downloaded file.
        </Text>
      </Stack>
    ),
    autoClose: 6000,
    withCloseButton: true,
  });
};

const formatEta = (seconds: number): string => {
  if (seconds < 1) return 'less than 1s left';
  if (seconds < 60) return `${Math.ceil(seconds)}s left`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  if (minutes < 60) {
    return remainingSeconds
      ? `${minutes}m ${remainingSeconds}s left`
      : `${minutes}m left`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes
    ? `${hours}h ${remainingMinutes}m left`
    : `${hours}h left`;
};

const progressDetails = (
  progress: DownloadProgress | undefined,
  locale: string,
): string | undefined => {
  if (!progress) return undefined;

  const parts = [
    progress.total
      ? `${prettyBytes(progress.received, { locale })} / ${prettyBytes(progress.total, { locale })}`
      : prettyBytes(progress.received, { locale }),
  ];

  if (progress.bytesPerSecond && progress.bytesPerSecond > 0) {
    parts.push(`${prettyBytes(progress.bytesPerSecond, { locale })}/s`);
  }

  if (
    progress.total &&
    progress.bytesPerSecond &&
    progress.bytesPerSecond > 0 &&
    progress.received < progress.total
  ) {
    parts.push(
      formatEta((progress.total - progress.received) / progress.bytesPerSecond),
    );
  }

  return parts.join(' • ');
};

// Once the file is downloaded, throughput and ETA are meaningless — only the size
// is still worth showing.
const completedDetails = (
  progress: DownloadProgress | undefined,
  locale: string,
): string | undefined => {
  if (!progress) return undefined;
  return prettyBytes(progress.total ?? progress.received, { locale });
};

export const DownloadSharePromptHost = () => {
  const { formattingLocale } = useLanguage();
  const state = useSyncExternalStore(
    subscribeToSharePrompt,
    getSharePromptSnapshot,
    getServerSharePromptSnapshot,
  );

  const percent = state?.percent;
  const isDownloading = state?.status === 'downloading';
  const isSaving = state?.status === 'saving';
  const isBusy = isDownloading || isSaving;
  const details = isDownloading
    ? progressDetails(state.progress, formattingLocale)
    : completedDetails(state?.progress, formattingLocale);

  // While downloading this cancels the fetch; once the file is ready it just
  // dismisses the modal (cancel is unset by then).
  const close = () => {
    if (state) {
      state.cancel?.();
      clearActiveShareDownload(state.id);
    }
    setSharePromptState(null);
  };

  const saveFile = async () => {
    if (!state?.file) return;

    setSharePromptState({ ...state, status: 'saving' });
    const notificationId = `share-download-save-${state.id}`;
    try {
      await navigator.share({ files: [state.file], title: state.filename });
      close();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (sharePromptState?.id === state.id) {
          setSharePromptState({ ...state, status: 'ready' });
        }
        return;
      }

      close();
      notifications.show({
        id: notificationId,
        color: 'red',
        title: 'Download failed',
        message: (
          <Stack gap={4}>
            <Text size="sm">Falling back to file download.</Text>
            <Text size="xs" c="dimmed">
              {describeShareError(error)}
            </Text>
          </Stack>
        ),
        autoClose: 6000,
        withCloseButton: true,
      });
      anchorDownload(state.url, state.filename);
    }
  };

  const saveToFiles = () => {
    if (!state) return;
    anchorDownload(state.url, state.filename);
    close();
  };

  return (
    <Modal
      opened={!!state}
      // Downloading is dismissable (the X cancels the fetch); saving is not, since
      // the native share sheet owns the interaction at that point. Click-outside
      // stays disabled throughout so a stray tap can't kill a long video download.
      onClose={isSaving ? () => undefined : close}
      closeOnClickOutside={!isBusy}
      closeOnEscape={!isSaving}
      withCloseButton={!isSaving}
      title={
        isDownloading
          ? 'Downloading file'
          : isSaving
            ? 'Saving…'
            : 'Ready to save'
      }
      centered
    >
      {state ? (
        <Stack gap="sm">
          <Text size="sm" lineClamp={2}>
            {state.filename}
          </Text>
          {details ? (
            <Text size="sm" c="dimmed">
              {details}
            </Text>
          ) : null}
          {percent !== undefined ? (
            <Progress value={percent} size="md" animated />
          ) : isDownloading ? (
            // No Content-Length, so we can only show an indeterminate spinner.
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Downloading
              </Text>
            </Group>
          ) : null}
          {isDownloading ? (
            <Text size="sm" c="dimmed">
              Keep this page open while the file downloads, or close this window
              to cancel.
            </Text>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                The file is ready. Tap Save to Photos to open the iOS share
                sheet.
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={saveToFiles}>
                  Save to Files
                </Button>
                <Button onClick={() => void saveFile()} loading={isSaving}>
                  Save to Photos
                </Button>
              </Group>
            </>
          )}
        </Stack>
      ) : null}
    </Modal>
  );
};

// Streams the response body so we can report download progress and build the
// shareable File without first materializing an intermediate Blob.
const fetchFileWithProgress = async (
  response: Response,
  filename: string,
  onProgress: (progress: DownloadProgress, percent?: number) => void,
): Promise<File> => {
  const contentLength = Number(response.headers.get('Content-Length'));
  const total =
    Number.isFinite(contentLength) && contentLength > 0
      ? contentLength
      : undefined;
  const type = response.headers.get('Content-Type') ?? '';
  const reader = response.body?.getReader();
  if (!reader) {
    return new File([await response.blob()], filename, { type });
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  let lastPercent: number | undefined = -1;
  let lastUpdate = 0;
  const startedAt = performance.now();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const now = performance.now();
    const elapsedSeconds = Math.max((now - startedAt) / 1000, 0.001);
    const bytesPerSecond = received / elapsedSeconds;
    const percent = total
      ? Math.min(100, Math.round((received / total) * 100))
      : undefined;
    if (
      percent !== lastPercent ||
      now - lastUpdate >= 500 ||
      (total && received >= total)
    ) {
      lastPercent = percent;
      lastUpdate = now;
      onProgress({ received, total, bytesPerSecond }, percent);
    }
  }
  // Cast is safe: fetch yields ArrayBuffer-backed Uint8Arrays (never SharedArrayBuffer),
  // which are valid BlobParts at runtime — the mismatch is only in the TS lib types.
  return new File(chunks as BlobPart[], filename, { type });
};

let shareCounter = 0;

/**
 * Downloads a media file. On iOS this fetches the file and opens the native share
 * sheet (so users can "Save to Photos"); everywhere else it falls back to a normal
 * anchor download. Safe to call from any platform.
 */
export const shareOrDownload = async (url: string, filename: string) => {
  if (!canUseShareSheet()) {
    anchorDownload(url, filename);
    return;
  }

  if (activeShareDownloadId) {
    showDownloadInProgressNotification();
    return;
  }

  // The raw file has to be fetched before the share sheet can open, which can take
  // a while for large videos. Nothing is shown up front: downloads that beat the
  // timer below go straight to the share sheet with no UI at all.
  // Runs inside the tap handler, so this is a good proxy for when activation started.
  const tappedAt = performance.now();
  const downloadId = String(shareCounter++);
  activeShareDownloadId = downloadId;
  const notificationId = `share-download-${downloadId}`;
  const controller = new AbortController();
  let latestPercent: number | undefined;
  let latestProgress: DownloadProgress | undefined;
  const isPromptShown = () => sharePromptState?.id === downloadId;

  const showDownloadingPrompt = (
    percent?: number,
    progress?: DownloadProgress,
  ) => {
    setSharePromptState({
      id: downloadId,
      filename,
      percent,
      progress,
      status: 'downloading',
      url,
      cancel: () => controller.abort(),
    });
  };

  // Armed at tap time, not once the response headers arrive: a slow server can burn
  // seconds before the first byte, and that wait needs the modal too (it renders an
  // indeterminate spinner until Content-Length gives us a percentage).
  const promptTimer = window.setTimeout(
    () => showDownloadingPrompt(latestPercent, latestProgress),
    SHARE_PROMPT_UI_DELAY_MS,
  );

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const file = await fetchFileWithProgress(
      response,
      filename,
      (progress, percent) => {
        latestPercent = percent;
        latestProgress = progress;
        if (isPromptShown()) showDownloadingPrompt(percent, progress);
      },
    );
    window.clearTimeout(promptTimer);
    const promptShown = isPromptShown();

    // canShare rejected these files — nothing to share, fall back to a normal download.
    if (!navigator.canShare({ files: [file] })) {
      if (promptShown) setSharePromptState(null);
      showCanShareFallbackNotification(notificationId);
      anchorDownload(url, filename);
      clearActiveShareDownload(downloadId);
      return;
    }

    // Hand the finished file to the modal and wait for a fresh tap to share it.
    // No `cancel`: the fetch is done, so the modal's X becomes a plain dismiss.
    const askForFreshTap = () => {
      setSharePromptState({
        id: downloadId,
        file,
        filename,
        percent: latestPercent,
        progress: latestProgress,
        status: 'ready',
        url,
      });
    };

    // If the modal is already up the original tap is long gone; otherwise only skip
    // the extra tap while activation plausibly survives.
    if (promptShown || !hasTransientActivation(tappedAt)) {
      askForFreshTap();
      return;
    }

    try {
      await navigator.share({ files: [file], title: filename });
      clearActiveShareDownload(downloadId);
      return;
    } catch (error) {
      // User dismissed the share sheet — not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') {
        clearActiveShareDownload(downloadId);
        return;
      }
      // Activation expired despite the check above. We still hold the File, so ask
      // for a fresh tap rather than dumping the user into "Save to Files".
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        askForFreshTap();
        return;
      }
      throw error;
    }
  } catch (error) {
    const hadPrompt = isPromptShown();
    window.clearTimeout(promptTimer);
    if (hadPrompt) {
      setSharePromptState(null);
    }
    // Share-sheet aborts are handled at the share() call above, so reaching here with
    // an AbortError means the fetch itself was cancelled — either by the modal's X or
    // by the browser. Not a failure: no fallback download, no error toast.
    if (error instanceof DOMException && error.name === 'AbortError') {
      clearActiveShareDownload(downloadId);
      return;
    }
    // Anything else: fall back to a normal download and let the user know.
    showFallbackNotification(notificationId, error);
    anchorDownload(url, filename);
    clearActiveShareDownload(downloadId);
  }
};
