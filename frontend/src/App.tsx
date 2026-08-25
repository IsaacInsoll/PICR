import { createClient } from './urqlClient';
import { Provider as URQLProvider } from 'urql';
import { BrowserRouter } from 'react-router';
import { authKeyAtom, useSessionKey } from './atoms/authAtom';
import { useAtomValue, useSetAtom } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
// Imported after Mantine styles so app-global overrides win on source order.
import './global.css';

import {
  LoadingOverlay,
  MantineProvider,
  Portal,
  v8CssVariablesResolver,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { theme } from './theme';
import { UserProvider } from './components/UserProvider';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { PicrErrorBoundary } from './components/PicrErrorBoundary';
import { lightboxRefAtom } from './atoms/lightboxRefAtom';
import { getBaseHrefPathname } from './helpers/baseHref';
import { fontFamilies } from './fonts.generated';
import { GlobalErrorOverlay } from './components/GlobalErrorOverlay';
import { normalizeFontKey } from '@shared/branding/fontRegistry';
import { DevBackendOverrideBanner } from './components/DevBackendOverrideBanner';
import { DownloadSharePromptHost } from './helpers/shareOrDownload';
import { VersionWatcher } from './components/VersionWatcher';
import { headingFontFamily } from './helpers/fontFamily';
import { useLanguage } from './i18n/useLanguage';
import { datesProviderSettingsFor } from './i18n/mantineDates';

const App = () => {
  const authKey = useAtomValue(authKeyAtom);
  const sessionKey = useSessionKey();
  const client = useMemo(
    () => createClient(authKey, sessionKey),
    [authKey, sessionKey],
  );
  const customTheme = useAtomValue(themeModeAtom);
  const { catalogLanguage, formattingLocale } = useLanguage();
  const basePathname = getBaseHrefPathname();
  const mantineTheme = useMemo(
    () => ({
      ...theme,
      primaryColor: customTheme.primaryColor ?? undefined,
    }),
    [customTheme.primaryColor],
  );
  const forceColorScheme =
    customTheme.mode == null || customTheme.mode === 'auto'
      ? undefined
      : customTheme.mode;
  const datesSettings = useMemo(
    () => datesProviderSettingsFor(catalogLanguage, formattingLocale),
    [catalogLanguage, formattingLocale],
  );

  //we put a portal at the start, otherwise Mantine Modals will be hidden behind it
  const portal = useRef<HTMLDivElement>(null);
  const setPortal = useSetAtom(lightboxRefAtom);

  useEffect(() => {
    setPortal(portal);
  }, [setPortal, portal]);

  useEffect(() => {
    const key = normalizeFontKey(customTheme.headingFontKey);
    const family =
      key in fontFamilies
        ? fontFamilies[key as keyof typeof fontFamilies]
        : fontFamilies.default;
    document.documentElement.style.setProperty(
      '--picr-heading-font',
      headingFontFamily(family),
    );
  }, [customTheme.headingFontKey]);

  return (
    <URQLProvider value={client}>
      <BrowserRouter basename={basePathname || undefined}>
        <MantineProvider
          theme={mantineTheme}
          cssVariablesResolver={v8CssVariablesResolver}
          forceColorScheme={forceColorScheme}
          defaultColorScheme={'auto'}
        >
          <DatesProvider settings={datesSettings}>
            <DevBackendOverrideBanner />
            <Portal className="lightbox-portal">
              <div ref={portal} />
            </Portal>
            <PicrErrorBoundary>
              <Suspense fallback={<PicrLoadingOverlay />}>
                <UserProvider />
                <DownloadSharePromptHost />
                <Notifications pauseResetOnHover="notification" />
              </Suspense>
            </PicrErrorBoundary>
            <GlobalErrorOverlay />
            <VersionWatcher />
          </DatesProvider>
        </MantineProvider>
      </BrowserRouter>
    </URQLProvider>
  );
};

export default App;

const PicrLoadingOverlay = () => {
  return (
    <LoadingOverlay
      visible={true}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ size: 'xl' }}
    />
  );
};
