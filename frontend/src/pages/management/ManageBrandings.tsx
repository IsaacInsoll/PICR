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
import { decodeFileSort, type FileSortType } from '@shared/files/sortFiles';
import { TbLayoutGrid, TbList, TbPhoto } from 'react-icons/tb';
import { normalizeDisplayName } from '@shared/displayName';
import styles from './ManageBrandings.module.css';

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
                placeholder="Search branding"
                leftSection={<SearchIcon />}
                style={{ flexGrow: 1, maxWidth: 420 }}
              />
              <Text size="sm" c="dimmed" pb={6}>
                {filteredBrandings.length} of {brandings.length}
              </Text>
            </Group>
            <Button onClick={createBranding} leftSection={<BrandingIcon />}>
              Add Branding
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
                No branding presets match this search.
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

const viewLabels: Record<string, string> = {
  feed: 'Feed',
  gallery: 'Gallery',
  list: 'List',
};

const viewIcons: Record<string, typeof TbLayoutGrid> = {
  feed: TbPhoto,
  gallery: TbLayoutGrid,
  list: TbList,
};

const sortTypeLabels: Record<FileSortType, string> = {
  DateTaken: 'Date taken',
  Filename: 'Filename',
  LastModified: 'Modified',
  Rating: 'Rating',
  RecentlyCommented: 'Commented',
};

const BrandingCard = ({
  branding,
  onSelect,
}: {
  branding: BrandingRow;
  onSelect: () => void;
}) => {
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
              {branding.name || 'Unnamed branding'}
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
              {viewLabel(defaultView)}
            </Badge>
            {branding.defaultFileSort ? (
              <Badge variant="outline" color="gray">
                {sortLabel(branding)}
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
  const ModeIcon = modeIcons[mode];
  const tooltip = `${modeLabels[mode]} background, ${primaryColor} featured color`;

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

const modeLabels = {
  [ThemeMode.Auto]: 'Auto',
  [ThemeMode.Light]: 'Light',
  [ThemeMode.Dark]: 'Dark',
};

const FolderSummaryChips = ({ branding }: { branding: BrandingRow }) => {
  if (branding.folders.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        No folders
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
          + {extraCount} more
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

const viewLabel = (view: string) => viewLabels[view] ?? view;

const sortLabel = (branding: BrandingRow) => {
  if (!branding.defaultFileSort) return 'App default';
  const sort = decodeFileSort(branding.defaultFileSort);
  const direction = sort.direction === 'Asc' ? 'asc' : 'desc';
  return `${sortTypeLabels[sort.type]} ${direction}`;
};
