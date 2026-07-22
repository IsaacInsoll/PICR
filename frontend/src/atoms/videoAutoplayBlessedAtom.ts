import { atom } from 'jotai';

// Once the user has played any video in this document, the browser has "sticky
// activation" and further programmatic playback is allowed — so we let the
// lightbox autoplay each video as the user navigates to it. Reset naturally on a
// full page reload (a fresh, un-gestured session that must play manually again).
// Scoped to the lightbox on purpose: the inline feed never opts in, so it never
// cascade-autoplays.
export const videoAutoplayBlessedAtom = atom(false);
