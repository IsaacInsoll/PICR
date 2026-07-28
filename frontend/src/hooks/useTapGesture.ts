import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

// Tap detection for the lightbox image area.
//
// YARL's own `on.click` callback cannot be used: the Zoom plugin augments
// `render.slide`, and YARL only wires `on.click` inside the fallback branch
// that runs when `render.slide` returns nothing (see CarouselSlide). With Zoom
// enabled — which it always is here — that branch never executes, so `on.click`
// never fires for image slides.
//
// A tap is a single pointer, released close to where it went down, quickly.
// That is what separates it from swiping between slides or panning a zoomed
// image, both of which must not toggle the chrome.
const MAX_MOVE_PX = 10;
const MAX_DURATION_MS = 500;

export const useTapGesture = (onTap?: () => void) => {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);
  const multiTouch = useRef(false);

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    // `isPrimary` is false for every pointer after the first in a multi-touch
    // gesture, so a pinch identifies itself. This deliberately replaces counting
    // active pointers: that counter only decremented on pointerup/pointercancel
    // over this element, so releasing anywhere else (dragging onto the toolbar,
    // say) left it stuck above zero and every later tap was ignored as a pinch.
    if (!event.isPrimary) {
      multiTouch.current = true;
      start.current = null;
      return;
    }
    // A fresh primary pointer starts a new gesture, so nothing can stay stuck.
    multiTouch.current = false;
    start.current = { x: event.clientX, y: event.clientY, time: Date.now() };
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const began = start.current;
      start.current = null;

      if (!onTap || !began || multiTouch.current || !event.isPrimary) return;
      if (Date.now() - began.time > MAX_DURATION_MS) return;
      const moved = Math.hypot(
        event.clientX - began.x,
        event.clientY - began.y,
      );
      if (moved > MAX_MOVE_PX) return;
      onTap();
    },
    [onTap],
  );

  const onPointerCancel = useCallback(() => {
    start.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
};
