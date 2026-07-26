import { useEffect, useRef, useState } from 'react';

// Immersive lightbox: reveal the chrome (toolbar, navigation, title, rating
// footer) on any pointer/keyboard activity and fade it out once the user is
// idle, so a full-bleed image is unobstructed while browsing but the controls
// are one interaction away when they want to rate/comment/navigate (issue #47).
const IDLE_MS = 2500;

const ACTIVITY_EVENTS = [
  'pointermove',
  'pointerdown',
  'keydown',
  'touchstart',
  'wheel',
] as const satisfies readonly (keyof DocumentEventMap)[];

export const useLightboxChromeAutoHide = (open: boolean): boolean => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    const reveal = () => {
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVisible(false), IDLE_MS);
    };

    // Start visible, then fade if the user does nothing.
    reveal();
    ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, reveal, { passive: true }),
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, reveal),
      );
      setVisible(true);
    };
  }, [open]);

  return visible;
};
