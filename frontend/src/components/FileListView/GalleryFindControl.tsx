import {
  ActionIcon,
  Box,
  Button,
  Drawer,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ViewFolder } from '@shared/files/sortFiles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsSmallScreen } from '../../hooks/useIsMobile';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import { SearchIcon } from '../../PicrIcons';

export const GalleryFindControl = ({
  folder,
  mode,
  query,
  fullWidth,
  getCurrentQuery,
  onOpen,
  onQueryChange,
}: {
  folder: ViewFolder;
  mode: 'gallery' | 'results';
  query: string;
  fullWidth: boolean;
  getCurrentQuery: () => string;
  onOpen: () => void;
  onQueryChange: (query: string) => void;
}) => {
  const { t } = useTranslation('gallery');
  const formatFolderName = useFolderNameFormatter();
  const isSmallScreen = useIsSmallScreen();
  const [drawerOpened, drawer] = useDisclosure(false);
  const [inputQuery, setInputQuery] = useState(query);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const locationQueryKey = `${mode}\0${query}`;
  const [lastLocationQueryKey, setLastLocationQueryKey] =
    useState(locationQueryKey);
  const folderName = formatFolderName(folder) ?? folder.name;
  const compactBreakpoint = fullWidth ? 'sm' : 'lg';
  const accessibleLabel = t('find.description', { folder: folderName });

  // React Router transitions location updates. Keep newer locally typed text
  // while its URL write is pending, then let externally initiated URL changes
  // such as Back/Forward become authoritative again.
  if (locationQueryKey !== lastLocationQueryKey) {
    setLastLocationQueryKey(locationQueryKey);
    if (mode === 'gallery') {
      setPendingQuery(null);
      setInputQuery('');
    } else if (pendingQuery === null) {
      setInputQuery(query);
    } else if (query === pendingQuery) {
      setPendingQuery(null);
      setInputQuery(query);
    } else {
      setInputQuery(getCurrentQuery());
    }
  }

  const submitFind = (closeDrawer: boolean) => {
    if (mode === 'gallery') {
      if (inputQuery) {
        setPendingQuery(inputQuery);
        onQueryChange(inputQuery);
      } else {
        onOpen();
      }
    }
    if (closeDrawer) drawer.close();
  };

  const searchInput = (autofocus: boolean, closeDrawerOnEnter: boolean) => (
    <TextInput
      type="search"
      value={inputQuery}
      leftSection={<SearchIcon />}
      placeholder={t('find.placeholder', { folder: folderName })}
      aria-label={accessibleLabel}
      data-autofocus={autofocus || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter') submitFind(closeDrawerOnEnter);
      }}
      onChange={(event) => {
        const nextQuery = event.currentTarget.value;
        setInputQuery(nextQuery);
        setPendingQuery(nextQuery);
        onQueryChange(nextQuery);
      }}
    />
  );

  return (
    <>
      <Box visibleFrom={compactBreakpoint} w={fullWidth ? 280 : 220}>
        {searchInput(false, true)}
      </Box>
      <Tooltip label={t('find.action')} withArrow>
        <ActionIcon
          hiddenFrom={compactBreakpoint}
          variant={mode === 'results' ? 'light' : 'default'}
          size="lg"
          aria-label={accessibleLabel}
          aria-haspopup="dialog"
          aria-expanded={drawerOpened}
          onClick={drawer.open}
        >
          <SearchIcon />
        </ActionIcon>
      </Tooltip>

      <Drawer
        opened={drawerOpened}
        onClose={drawer.close}
        title={t('find.title', { folder: folderName })}
        position={isSmallScreen ? 'bottom' : 'right'}
        size={isSmallScreen ? '50dvh' : 'md'}
        closeButtonProps={{ 'aria-label': t('filter.close') }}
        overlayProps={{ backgroundOpacity: 0.15, blur: 2 }}
      >
        <Stack>
          {searchInput(true, true)}
          {!inputQuery ? (
            <Button
              variant="light"
              onClick={() => {
                onOpen();
                drawer.close();
              }}
            >
              {t('find.viewAll', { folder: folderName })}
            </Button>
          ) : null}
        </Stack>
      </Drawer>
    </>
  );
};
