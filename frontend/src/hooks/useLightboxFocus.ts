import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'picr-lightbox-focus';

// Focus state = chrome hidden, image gets the whole viewport. Controls state =
// reserved rails, nothing drawn over the photograph (issues #47, #79).
//
// The choice is remembered across sessions (like the filmstrip toggle) so a
// viewer who prefers the largest possible image taps once, ever. A first-ever
// visit has nothing stored and therefore opens in Controls — opening with no
// visible UI would leave a client with no discoverable close or download.
export const useLightboxFocus = () => {
  const [focus, setFocus] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, focus ? '1' : '0');
    } catch {
      // Storage unavailable (private browsing): the choice just won't persist.
    }
  }, [focus]);

  const toggleFocus = useCallback(() => setFocus((current) => !current), []);

  return { focus, toggleFocus };
};
