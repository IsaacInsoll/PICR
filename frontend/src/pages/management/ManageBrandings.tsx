import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { useQuery } from 'urql';
import type { CSSProperties } from 'react';
import { Suspense, useMemo, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { viewBrandingsQuery } from '@shared/urql/queries/viewBrandingsQuery';
import {
  BrandingIcon,
  BrightnessAutoIcon,
  DarkModeOutlineIcon,
  LightModeOutlineIcon,
  SearchIcon,
} from '../../PicrIcons';
import { BrandingDrawer } from './BrandingDrawer';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { defaultBranding } from '../../helpers/defaultBranding';
import type { BrandingRow } from '@shared/types/queryRows';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import { normalizeFontKey } from '@shared/branding/fontRegistry';
import { fontFamilies } from '../../fonts.generated';
import { decodeFileSort } from '@shared/files/sortFiles';
import { TbLayoutGrid, TbList, TbPhoto } from 'react-icons/tb';
import { normalizeDisplayName } from '@shared/displayName';
import styles from './ManageBrandings.module.css';
import { useTranslation } from 'react-i18next';
import type { AdminT } from '../../i18n/adminLabels';

interface ManageBrandingsProps {
  selectedBrandingId?: string | null;
  onSelectBranding?: (id: string) => void;
  onCreateBranding?: () => void;
  onCloseBranding?: () => void;
}

export const ManageBrandings = ({
  selectedBrandingId,
  onSelectBranding,
  onCreateBranding,
  onCloseBranding,
}: ManageBrandingsProps) => {
  const { t } = useTranslation('admin');
  const [result, reQuery] = useQuery({ query: viewBrandingsQuery });
  const [localBrandingId, setLocalBrandingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isControlled =
    selectedBrandingId !== undefined ||
    onSelectBranding != null ||
    onCreateBranding != null ||
    onCloseBranding != null;
  const brandingId = isControlled
    ? (selectedBrandingId ?? null)
    : localBrandingId;
  const brandings = result.data?.brandings;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBrandings = useMemo(() => {
    const allBrandings = brandings ?? [];
    return normalizedSearch
      ? allBrandings.filter((candidate) =>
          brandingSearchText(candidate).includes(normalizedSearch),
        )
      : allBrandings;
  }, [brandings, normalizedSearch]);
  const branding = useMemo<BrandingRow | null>(() => {
    if (brandingId === null) return null;
    if (brandingId === NEW_ITEM_SLUG) {
      return { ...defaultBranding, folders: [] };
    }

    return brandings?.find((candidate) => candidate.id === brandingId) ?? null;
  }, [brandingId, brandings]);

  const selectBranding = (id: string) => {
    if (onSelectBranding) {
      onSelectBranding(id);
      return;
    }

    setLocalBrandingId(id);
  };

  const createBranding = () => {
    if (onCreateBranding) {
      onCreateBranding();
      return;
    }

    setLocalBrandingId(NEW_ITEM_SLUG);
  };

  const closeBranding = () => {
    if (onCloseBranding) {
      onCloseBranding();
      return;
    }

    setLocalBrandingId(null);
  };

  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {branding != null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <BrandingDrawer
            key={branding.id || NEW_ITEM_SLUG}
            branding={{
              ...branding,
              socialLinks:
                (branding.socialLinks as SocialLink[] | null | undefined) ??
                null,
            }}
            folders={branding.folders}
            onClose={closeBranding}
          />
        </Suspense>
      ) : null}
      {brandings ? (
        <Stack gap="sm">
          <Group justify="space-between" align="flex-end">
            <Group align="flex-end" style={{ flexGrow: 1 }}>
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder={t('branding.list.search')}
                leftSection={<SearchIcon />}
                style={{ flexGrow: 1, maxWidth: 420 }}
              />
              <Text size="sm" c="dimmed" pb={6}>
                {t('branding.list.filteredCount', {
                  visible: filteredBrandings.length,
                  total: brandings.length,
                })}
              </Text>
            </Group>
            <Button onClick={createBranding} leftSection={<BrandingIcon />}>
              {t('branding.list.add')}
            </Button>
          </Group>
          {filteredBrandings.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
              {filteredBrandings.map((row) => (
                <BrandingCard
                  key={row.id}
                  branding={row}
                  onSelect={() => selectBranding(row.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Paper withBorder p="lg" radius="md">
              <Text c="dimmed" ta="center">
                {t('branding.list.empty')}
              </Text>
            </Paper>
          )}
        </Stack>
      ) : undefined}
    </>
  );
};

const NEW_ITEM_SLUG = 'new';

const ALL_VIEWS = ['list', 'gallery', 'feed'] as const;

const viewIcons: Record<string, typeof TbLayoutGrid> = {
  feed: TbPhoto,
  gallery: TbLayoutGrid,
  list: TbList,
};

const BrandingCard = ({
  branding,
  onSelect,
}: {
  branding: BrandingRow;
  onSelect: () => void;
}) => {
  const { t } = useTranslation('admin');
  const mode = branding.mode ?? ThemeMode.Auto;
  const primaryColor = branding.primaryColor ?? PrimaryColor.Blue;
  const headingFontKey = normalizeFontKey(branding.headingFontKey);
  const fontFamily = fontFamilies[headingFontKey];
  const availableViews =
    branding.availableViews && branding.availableViews.length > 0
      ? branding.availableViews
      : [...ALL_VIEWS];
  const defaultView = branding.defaultView ?? availableViews[0];
  const swatchColor = `var(--mantine-color-${primaryColor}-6)`;
  const DefaultViewIcon = viewIcons[defaultView] ?? TbLayoutGrid;

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      className={styles.brandingCard}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onSelect();
      }}
      style={
        {
          '--branding-accent': swatchColor,
          cursor: 'pointer',
          height: '100%',
          outlineOffset: 2,
        } as CSSProperties
      }
    >
      <Box className={styles.accentRail} />
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} size="lg" truncate style={{ fontFamily }}>
              {branding.name || t('branding.list.unnamed')}
            </Text>
          </Box>
          <Group
            gap={6}
            justify="flex-end"
            wrap="nowrap"
            style={{ flexShrink: 0 }}
          >
            <ThemeModeIndicator
              mode={mode}
              primaryColor={primaryColor}
              swatchColor={swatchColor}
            />
            <Badge
              variant="outline"
              color="gray"
              leftSection={<DefaultViewIcon size={12} />}
            >
              {viewLabel(defaultView, t)}
            </Badge>
            {branding.defaultFileSort ? (
              <Badge variant="outline" color="gray">
                {sortLabel(branding, t)}
              </Badge>
            ) : null}
          </Group>
        </Group>

        <FolderSummaryChips branding={branding} />
      </Stack>
    </Paper>
  );
};

const ThemeModeIndicator = ({
  mode,
  primaryColor,
  swatchColor,
}: {
  mode: ThemeMode;
  primaryColor: PrimaryColor;
  swatchColor: string;
}) => {
  const { t } = useTranslation('admin');
  const ModeIcon = modeIcons[mode];
  const tooltip = t('branding.list.themeSummary', {
    mode: t(`branding.mode.${mode}`),
    color: primaryColor,
  });

  return (
    <Tooltip label={tooltip}>
      <ThemeIcon
        aria-label={tooltip}
        variant="light"
        color={primaryColor}
        radius="xl"
        size="sm"
      >
        <ModeIcon size={16} color={swatchColor} />
      </ThemeIcon>
    </Tooltip>
  );
};

const modeIcons = {
  [ThemeMode.Auto]: BrightnessAutoIcon,
  [ThemeMode.Light]: LightModeOutlineIcon,
  [ThemeMode.Dark]: DarkModeOutlineIcon,
};

const FolderSummaryChips = ({ branding }: { branding: BrandingRow }) => {
  const { t } = useTranslation('admin');
  if (branding.folders.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {t('branding.list.noFolders')}
      </Text>
    );
  }

  const visibleFolders = branding.folders.slice(0, 3);
  const extraCount = branding.folders.length - visibleFolders.length;

  return (
    <Group gap={6} wrap="wrap">
      {visibleFolders.map((folder) => (
        <Badge key={folder.id} variant="light" color="gray" fw={500}>
          {normalizeDisplayName(folder.name) ?? folder.id}
        </Badge>
      ))}
      {extraCount > 0 ? (
        <Badge variant="light" color="gray" fw={500}>
          {t('branding.list.more', { count: extraCount })}
        </Badge>
      ) : null}
    </Group>
  );
};

const brandingSearchText = (branding: BrandingRow) =>
  [
    branding.name,
    branding.mode,
    branding.primaryColor,
    branding.headingFontKey,
    branding.defaultView,
    branding.defaultFileSort,
    branding.footerTitle,
    branding.footerUrl,
    ...branding.folders.map((folder) => folder.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const viewLabel = (view: string, t: AdminT) =>
  view === 'list' || view === 'gallery' || view === 'feed'
    ? t(`branding.view.${view}`)
    : view;

const sortLabel = (branding: BrandingRow, t: AdminT) => {
  if (!branding.defaultFileSort) return t('branding.sort.appDefault');
  const sort = decodeFileSort(branding.defaultFileSort);
  return t('branding.sort.summary', {
    type: t(`branding.sort.type.${sort.type}`),
    direction: t(`branding.sort.direction.${sort.direction}`),
  });
};
