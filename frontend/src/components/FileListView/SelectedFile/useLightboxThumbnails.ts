import { useCallback, useMemo, useState } from 'react';

export interface LightboxThumbnails {
  /** Whether the filmstrip is currently showing. */
  visible: boolean;
  /** Toggle the filmstrip open/closed. */
  toggle: () => void;
}

const THUMBNAILS_KEY = 'picr-lightbox-thumbnails';

const readPersistedVisible = () => {
  try {
    return localStorage.getItem(THUMBNAILS_KEY) === '1';
  } catch {
    return false;
  }
};

const persistVisible = (visible: boolean) => {
  try {
    localStorage.setItem(THUMBNAILS_KEY, visible ? '1' : '0');
  } catch {
    // ignore (private mode / storage disabled) — falls back to session state
  }
};

// Filmstrip visibility for the lightbox, persisted so a gallery left with
// thumbnails open reopens that way.
//
// The Thumbnails plugin is always mounted (see lightboxPlugins). It used to be
// mounted lazily on first reveal, but changing the `plugins` array makes YARL
// rebuild its whole module tree, remounting every slide — which flashed the
// image the first time the filmstrip was opened. Keeping the plugin constant
// costs about five small thumbnail requests (the track only renders
// `carousel.preload` items either side of the current slide, not the whole
// gallery) and removes the remount entirely. Open/close is then a pure CSS
// height transition on the container.
export const useLightboxThumbnails = (): LightboxThumbnails => {
  const [visible, setVisible] = useState(readPersistedVisible);

  const toggle = useCallback(() => {
    setVisible((current) => {
      persistVisible(!current);
      return !current;
    });
  }, []);

  return useMemo(() => ({ visible, toggle }), [visible, toggle]);
};
