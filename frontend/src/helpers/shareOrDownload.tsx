import { notifications } from '@mantine/notifications';
import { Progress, Stack, Text } from '@mantine/core';
import type { PicrFile } from '@shared/types/picr';

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
const anchorDownload = (url: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? '';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const progressMessage = (filename: string, percent?: number) => (
  <Stack gap={4}>
    <Text size="sm" lineClamp={1}>
      {filename}
    </Text>
    {percent !== undefined ? (
      <Progress value={percent} size="sm" transitionDuration={150} animated />
    ) : null}
  </Stack>
);

// Streams the response body so we can report download progress, falling back to
// response.blob() when the length is unknown (e.g. no Content-Length header).
const fetchBlobWithProgress = async (
  response: Response,
  onProgress: (percent: number) => void,
): Promise<Blob> => {
  const total = Number(response.headers.get('Content-Length'));
  const reader = response.body?.getReader();
  if (!reader || !total) {
    return response.blob();
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  let lastPercent = -1;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const percent = Math.min(100, Math.round((received / total) * 100));
    if (percent !== lastPercent) {
      lastPercent = percent;
      onProgress(percent);
    }
  }
  // Cast is safe: fetch yields ArrayBuffer-backed Uint8Arrays (never SharedArrayBuffer),
  // which are valid BlobParts at runtime — the mismatch is only in the TS lib types.
  return new Blob(chunks as BlobPart[], {
    type: response.headers.get('Content-Type') ?? '',
  });
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

  // The raw file is fetched into a blob before the share sheet can open, which can take
  // a while for large videos — show a progress notification so the button feels responsive.
  const notificationId = `share-download-${shareCounter++}`;
  notifications.show({
    id: notificationId,
    loading: true,
    autoClose: false,
    withCloseButton: false,
    title: 'Preparing download…',
    message: progressMessage(filename),
  });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await fetchBlobWithProgress(response, (percent) => {
      notifications.update({
        id: notificationId,
        loading: false,
        title: 'Preparing download…',
        message: progressMessage(filename, percent),
      });
    });
    const file = new File([blob], filename, { type: blob.type });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      notifications.hide(notificationId);
      return;
    }

    // canShare rejected these files — fall back to a normal download.
    notifications.hide(notificationId);
    anchorDownload(url, filename);
  } catch (error) {
    // User dismissed the share sheet — not a failure.
    if (error instanceof DOMException && error.name === 'AbortError') {
      notifications.hide(notificationId);
      return;
    }
    // Anything else: fall back to a normal download and let the user know.
    notifications.update({
      id: notificationId,
      loading: false,
      color: 'red',
      title: 'Download failed',
      message: 'Falling back to file download',
      autoClose: 3000,
    });
    anchorDownload(url, filename);
  }
};
