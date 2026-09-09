import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Indicator,
  Paper,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ViewFolder } from '@shared/files/sortFiles';
import { filterOptions, totalFilterOptionsSelected } from '@shared/filterAtom';
import { filterFiles } from '@shared/files/filterFiles';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelectedView, viewOptions } from '../../hooks/useSelectedView';
import { useIsSmallScreen } from '../../hooks/useIsMobile';
import { useMe } from '../../hooks/useMe';
import { FilterIcon } from '../../PicrIcons';
import { Page } from '../Page';
import { FileSortMenuButton } from './FileSortSelector';
import { FilteringOptions } from './Filtering/FilteringOptions';

export const FolderContentsToolbar = ({
  folder,
  hasCaptureDates,
  totalFiltered,
}: {
  folder: ViewFolder;
  hasCaptureDates: boolean;
  totalFiltered: number;
}) => {
  return (
    <Page>
      <Paper
        withBorder
        radius="md"
        px="xs"
        py={6}
        mb="md"
        data-testid="folder-contents-toolbar"
      >
        <FolderContentsControls
          folder={folder}
          hasCaptureDates={hasCaptureDates}
          totalFiltered={totalFiltered}
          fullWidth
        />
      </Paper>
    </Page>
  );
};

export const FolderContentsControls = ({
  folder,
  hasCaptureDates,
  totalFiltered,
  fullWidth = false,
}: {
  folder: ViewFolder;
  hasCaptureDates: boolean;
  totalFiltered?: number;
  fullWidth?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const isSmallScreen = useIsSmallScreen();
  const [filtersOpened, { open: openFilters, close: closeFilters }] =
    useDisclosure(false);
  const filters = useAtomValue(filterOptions);
  const totalFilters = useAtomValue(totalFilterOptionsSelected);
  const hasFiles = folder.files.length > 0;
  const hasFolders = folder.subFolders.length > 0;
  const resolvedTotalFiltered = useMemo(
    () =>
      totalFiltered ??
      (totalFilters > 0
        ? filterFiles(folder.files, filters).length
        : folder.files.length),
    [filters, folder.files, totalFiltered, totalFilters],
  );

  return (
    <>
      <Group
        gap="xs"
        justify={fullWidth ? 'space-between' : undefined}
        wrap="nowrap"
        style={fullWidth ? { width: '100%' } : undefined}
        data-testid="folder-contents-controls"
      >
        <ViewSelector folder={folder} />
        <Group gap="xs" wrap="nowrap" ml={fullWidth ? 'auto' : undefined}>
          {hasFiles || hasFolders ? (
            <FileSortMenuButton
              hasMetadata={hasCaptureDates}
              hasFiles={hasFiles}
              hasFolders={hasFolders}
            />
          ) : null}
          {hasFiles ? (
            <Tooltip label={t('folder.filterFiles')} withArrow>
              <Indicator
                inline
                disabled={totalFilters === 0}
                label={totalFilters}
                size={16}
                offset={3}
              >
                <ActionIcon
                  variant={totalFilters > 0 ? 'light' : 'default'}
                  size="lg"
                  aria-label={t('folder.filterFiles')}
                  aria-haspopup="dialog"
                  aria-expanded={filtersOpened}
                  onClick={openFilters}
                >
                  <FilterIcon />
                </ActionIcon>
              </Indicator>
            </Tooltip>
          ) : null}
        </Group>
      </Group>

      {hasFiles ? (
        <Drawer
          opened={filtersOpened}
          onClose={closeFilters}
          title={t('folder.filterFiles')}
          position={isSmallScreen ? 'bottom' : 'right'}
          size={isSmallScreen ? '90dvh' : 'md'}
          overlayProps={{ backgroundOpacity: 0.15, blur: 2 }}
        >
          <FilteringOptions
            files={folder.files}
            totalFiltered={resolvedTotalFiltered}
            onClose={closeFilters}
          />
        </Drawer>
      ) : null}
    </>
  );
};

const ViewSelector = ({ folder }: { folder: ViewFolder }) => {
  const { t } = useTranslation('gallery');
  const [view, setView] = useSelectedView();
  const me = useMe();
  const restricted = folder.branding?.availableViews;
  const shownOptions =
    me?.isLink && restricted?.length
      ? viewOptions.filter((option) => restricted.includes(option.key))
      : viewOptions;

  if (shownOptions.length <= 1) return null;

  const restrictedLabel =
    me?.isUser && restricted?.length
      ? t('folder.viewsRestricted', {
          views: restricted
            .map((name) => {
              const option = viewOptions.find(
                (candidate) => candidate.key === name,
              );
              return option ? t(option.labelKey) : name;
            })
            .join(', '),
        })
      : null;

  return (
    <Tooltip label={restrictedLabel} disabled={!restrictedLabel} withArrow>
      <Button.Group>
        {shownOptions.map((option) => (
          <Button
            key={option.key}
            variant={view === option.key ? 'filled' : 'default'}
            onClick={() => setView(option.key)}
            title={t(option.labelKey)}
            aria-label={t(option.labelKey)}
            aria-pressed={view === option.key}
            px="xs"
          >
            {option.icon}
          </Button>
        ))}
      </Button.Group>
    </Tooltip>
  );
};
