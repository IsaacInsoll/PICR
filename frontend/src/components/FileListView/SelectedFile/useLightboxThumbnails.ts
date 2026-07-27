import { useCallback, useEffect, useMemo, useState } from 'react';

export interface LightboxThumbnails {
  /** Whether the Thumbnails plugin is mounted (lazily, then kept mounted). */
  mounted: boolean;
  /** Drives the CSS open/close height transition on the filmstrip container. */
  expanded: boolean;
  /** User intent — whether the filmstrip should currently be showing. */
  visible: boolean;
  /** Toggle the filmstrip open/closed. */
  toggle: () => void;
}

// Filmstrip visibility state for the lightbox. The Thumbnails plugin mounts
// lazily on first reveal (so galleries that never open it don't load thumbnails)
// then stays mounted so it can slide open/closed via a CSS height transition
// instead of popping in/out. `expanded` flips a frame after mount so the very
// first open animates too; closing collapses straight from the toggle since the
// element is already painted.
export const useLightboxThumbnails = (): LightboxThumbnails => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!mounted || !visible) return;
    const raf = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(raf);
  }, [visible, mounted]);

  const toggle = useCallback(() => {
    if (visible) {
      setVisible(false);
      setExpanded(false);
    } else {
      setMounted(true);
      setVisible(true);
    }
  }, [visible]);

  return useMemo(
    () => ({ mounted, expanded, visible, toggle }),
    [mounted, expanded, visible, toggle],
  );
};
