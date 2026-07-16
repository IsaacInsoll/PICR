import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import {
  QuickFind,
  quickFindQueryAtom,
} from '../components/QuickFind/QuickFind';
import { useQuickFind } from '../components/QuickFind/useQuickFind';
import { TaskSummary } from '../components/TaskSummary';
import { Page } from '../components/Page';
import { useMe } from '../hooks/useMe';
import {
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  NumberFormatter,
  RollingNumber,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtom, useSetAtom } from 'jotai';
import { useQuery } from 'urql';
import styles from './Dashboard.module.css';
import {
  AccessLogsIcon,
  CommentsIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
  PhotoViewIcon,
  SearchIcon,
} from '../PicrIcons';
import type { PicrFolder } from '@shared/types/picr';
import { prettyBytes } from '@shared/prettyBytes';
import { imageURL } from '../helpers/imageURL';
import type { ImageUrlFileInput } from '@shared/types/ui';
import { DateDisplay } from '../components/FileListView/Filtering/PrettyDate';
import { PicrAvatar } from '../components/PicrAvatar';
import { PicrLink } from '../components/PicrLink';
import { PrettyFolderPath } from '../components/PrettyFolderPath';
import { ManageFolderIconButton } from '../components/ManageFolderButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { CommentHistory } from '../components/FileListView/Review/CommentHistory';
import { dashboardStatsQuery } from '@shared/urql/queries/dashboardStatsQuery';
import { dashboardGalleriesQuery } from '@shared/urql/queries/dashboardGalleriesQuery';
import { dashboardCommentsQuery } from '@shared/urql/queries/dashboardCommentsQuery';
import { dashboardUpdateInfoQuery } from '@shared/urql/queries/dashboardUpdateInfoQuery';
import { recentUsersQuery } from '@shared/urql/queries/recentUsersQuery';
import { readAllFoldersQuery } from '@shared/urql/queries/readAllFoldersQuery';
import { FoldersSortType } from '@shared/gql/graphql';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { useRequery } from '@shared/hooks/useRequery';
import { isNewerPicrVersion } from '../helpers/versionUpdates';

const dashboardLimits = {
  desktop: {
    galleries: 12,
    comments: 5,
    clients: 10,
    modified: 12,
  },
  tablet: {
    galleries: 8,
    comments: 5,
    clients: 6,
    modified: 8,
  },
  mobile: {
    galleries: 4,
    comments: 3,
    clients: 4,
    modified: 6,
  },
} as const;

const useDashboardDensity = () => {
  const isMobile = useMediaQuery('(max-width: 36em)');
  const isTablet = useMediaQuery('(max-width: 62em)');

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

export const Dashboard = () => {
  const me = useMe();
  const folderId = me?.folderId;
  const density = useDashboardDensity();
  return (
    <>
      <LoggedInHeader />
      <Page>
        {folderId ? <TaskSummary folderId={folderId} /> : null}
        <Stack className={styles.dashboardStack} gap="xl" pt="md" pb="xl">
          <TopBar folder={me?.folder ?? undefined} />
          {folderId ? (
            <>
              <YourGalleries folderId={folderId} density={density} />
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <ClientActivity folderId={folderId} />
                <ClientFeedback folderId={folderId} density={density} />
              </SimpleGrid>
              <RecentlyModified folderId={folderId} density={density} />
            </>
          ) : null}
        </Stack>
      </Page>
    </>
  );
};

// ---------------------------------------------------------------------------
// Top bar: library stats + update indicator (left) + search (right)
// ---------------------------------------------------------------------------

const TopBar = ({ folder }: { folder?: PicrFolder }) => {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md">
      <Group className={styles.statsGroup} gap="lg" wrap="wrap">
        <LibraryStats folderId={folder?.id} />
        <UpdateIndicator />
      </Group>
      <DashboardSearch folder={folder} />
    </Group>
  );
};

// Visible search box on the dashboard. Typing pre-fills the shared QuickFind
// query; pressing Enter opens the QuickFind drawer (which shows live results).
const DashboardSearch = ({ folder }: { folder?: PicrFolder }) => {
  const [query, setQuery] = useAtom(quickFindQueryAtom);
  const [, setOpened] = useQuickFind();
  return (
    <>
      <TextInput
        placeholder="Search photos & folders…"
        leftSection={<SearchIcon size={16} />}
        radius="md"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) setOpened(true);
        }}
        className={styles.dashboardSearch}
      />
      <QuickFind folder={folder} />
    </>
  );
};

const StatItem = ({
  value,
  label,
  icon,
  color,
}: {
  value: ReactNode;
  label?: string;
  icon: ReactNode;
  color: string;
}) => (
  <Group gap={6} c="dimmed" wrap="nowrap">
    <ThemeIcon variant="transparent" color={color} size={24}>
      {icon}
    </ThemeIcon>
    <Group gap={5} wrap="nowrap" align="center">
      <Text span fw={700} c="var(--mantine-color-text)" lh={1}>
        {value}
      </Text>
      {label ? <Text size="sm">{label}</Text> : null}
    </Group>
  </Group>
);

// Mantine's RollingNumber looks good in motion, but each digit is translated in
// its own column and can settle a few pixels out of alignment depending on the
// final digit. Use it only for the animated roll, then swap to regular
// NumberFormatter text so the resting number is perfectly baseline-aligned.
const AnimatedNumber = ({
  value,
  suffix,
  decimalScale,
}: {
  value: number;
  suffix?: string;
  decimalScale?: number;
}) => {
  const [rollingValue, setRollingValue] = useState(0);
  const [settled, setSettled] = useState(false);
  const duration = 900;

  useEffect(() => {
    let rollFrame: number | undefined;
    let settleTimer: number | undefined;

    const resetFrame = requestAnimationFrame(() => {
      setSettled(false);
      setRollingValue(0);

      rollFrame = requestAnimationFrame(() => {
        setRollingValue(value);
        settleTimer = window.setTimeout(() => setSettled(true), duration + 100);
      });
    });

    return () => {
      cancelAnimationFrame(resetFrame);
      if (rollFrame != null) cancelAnimationFrame(rollFrame);
      if (settleTimer != null) window.clearTimeout(settleTimer);
    };
  }, [value]);

  const formatterProps = {
    decimalScale,
    fixedDecimalScale: decimalScale != null && decimalScale > 0,
    suffix,
    thousandSeparator: true,
  };

  return settled ? (
    <NumberFormatter value={value} {...formatterProps} />
  ) : (
    <RollingNumber
      value={rollingValue}
      animationDuration={duration}
      {...formatterProps}
    />
  );
};

// Splits prettyBytes output ("218 GB", "1.4 TB") into the numeric value, a unit
// suffix and its decimal count so RollingNumber can roll it up too.
const bytesForRoll = (bytes: string) => {
  const [num, unit = ''] = prettyBytes(bytes).split(' ');
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  return {
    value: parseFloat(num),
    suffix: unit ? ` ${unit}` : undefined,
    decimals,
  };
};

// Loaded in its own query — these are subtree aggregates and can be slow, so we
// never block the rest of the dashboard on them.
const LibraryStats = ({ folderId }: { folderId?: string }) => {
  const density = useDashboardDensity();
  const [result, reQuery] = useQuery({
    query: dashboardStatsQuery,
    variables: { folderId: folderId ?? '' },
    pause: !folderId,
  });
  useRequery(reQuery, 20000);
  const f = result.data?.dashboardStats;
  if (!f) return null;
  const size = bytesForRoll(f.totalSize);
  const showDetailedCounts = density === 'desktop';
  return (
    <>
      <StatItem
        value={<AnimatedNumber value={f.totalFiles} />}
        label="media"
        icon={<FileIcon size={16} />}
        color="blue"
      />
      {showDetailedCounts ? (
        <>
          <StatItem
            value={<AnimatedNumber value={f.totalImages} />}
            label="photos"
            icon={<PhotoViewIcon size={16} />}
            color="grape"
          />
          <StatItem
            value={<AnimatedNumber value={f.totalFolders} />}
            label="folders"
            icon={<FolderIcon size={16} />}
            color="teal"
          />
        </>
      ) : null}
      <StatItem
        value={
          <AnimatedNumber
            value={size.value}
            suffix={size.suffix}
            decimalScale={size.decimals}
          />
        }
        icon={<DownloadIcon size={16} />}
        color="orange"
      />
    </>
  );
};

// Also its own query — the backend caches GitHub's latest release for dashboard
// use so loading /admin frequently does not trigger external requests.
const UpdateIndicator = () => {
  const [result] = useQuery({ query: dashboardUpdateInfoQuery });
  const info = result.data?.dashboardUpdateInfo;
  if (!info?.latest || !isNewerPicrVersion(info.latest, info.version)) {
    return null;
  }
  return (
    <Anchor
      href="https://github.com/IsaacInsoll/PICR/releases"
      target="_blank"
      rel="noreferrer"
    >
      <Badge color="green" variant="light" size="lg">
        Update available: v{info.latest}
      </Badge>
    </Anchor>
  );
};

// ---------------------------------------------------------------------------
// Section wrapper + folder cover
// ---------------------------------------------------------------------------

const SectionHeading = ({
  title,
  icon,
  action,
}: {
  title: string;
  icon: ReactNode;
  action?: { label: string; to: string };
}) => (
  <Group justify="space-between" wrap="nowrap" gap="xs">
    <Group gap="xs">
      <ThemeIcon variant="transparent" color="gray" size="sm">
        {icon}
      </ThemeIcon>
      <Title order={5}>{title}</Title>
    </Group>
    {action ? (
      <PicrLink to={action.to}>
        <Text size="xs">{action.label}</Text>
      </PicrLink>
    ) : null}
  </Group>
);

const SectionCard = ({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: { label: string; to: string };
  children: ReactNode;
}) => (
  <Card
    withBorder
    padding="lg"
    radius="md"
    h="100%"
    className={styles.sectionCard}
  >
    <Box mb="md">
      <SectionHeading title={title} icon={icon} action={action} />
    </Box>
    {children}
  </Card>
);

// Clickable folder card with a hover state, shared by "Your Galleries" and
// "Recently Modified" so both look and behave identically. The hero thumbnail
// is full-bleed (flush to the card's left/top/bottom edges); only the text is
// padded.
const FolderCard = ({
  folder,
  action,
  showPathTooltip = true,
  compact = false,
}: {
  folder: PicrFolder;
  action?: ReactNode;
  showPathTooltip?: boolean;
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const to = `/admin/f/${folder.id}`;
  const title = folder.title ?? folder.name ?? '';
  const coverSize = compact ? 48 : 60;
  return (
    <Tooltip
      withArrow
      color="blue.9"
      disabled={!showPathTooltip || folder.parents?.length === 0}
      label={<PrettyFolderPath folder={folder} subColor="blue.8" />}
    >
      <Card
        withBorder
        padding={0}
        radius="md"
        className={styles.folderCard}
        style={{ overflow: 'hidden' }}
        role="link"
        tabIndex={0}
        onClick={() => void navigate(to)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void navigate(to);
          }
        }}
      >
        <Group gap={0} wrap="nowrap" align="stretch">
          <FolderCover heroImage={folder.heroImage} size={coverSize} fill />
          <Box p="xs" style={{ flexGrow: 1, minWidth: 0, alignSelf: 'center' }}>
            <Text fw={600} size="sm" truncate>
              {title}
            </Text>
            {compact ? null : (
              <DateDisplay
                dateString={folder.folderLastModified ?? undefined}
              />
            )}
          </Box>
          {action ? (
            <Box
              pr="xs"
              style={{ alignSelf: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {action}
            </Box>
          ) : null}
        </Group>
      </Card>
    </Tooltip>
  );
};

type HeroImageInput =
  | (ImageUrlFileInput & { __typename?: string })
  | null
  | undefined;

// heroImage when one is set, otherwise a generic folder icon (mosaic rejected).
// `fill` makes it stretch to the parent's full height (full-bleed card thumb).
const FolderCover = ({
  heroImage,
  size,
  fill,
}: {
  heroImage?: HeroImageInput;
  size: number;
  fill?: boolean;
}) => {
  const isImage = heroImage?.__typename === 'Image';
  const src = isImage
    ? imageURL(heroImage, 'sm').replace(' ', '%20')
    : undefined;
  return (
    <Box
      w={size}
      h={fill ? undefined : size}
      style={{
        alignSelf: fill ? 'stretch' : undefined,
        borderRadius: fill ? 0 : 'var(--mantine-radius-sm)',
        overflow: 'hidden',
        flexShrink: 0,
        background: src
          ? `center / cover no-repeat url("${src}")`
          : 'var(--mantine-color-default-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? null : (
        <FolderIcon size={size * 0.42} color="var(--mantine-color-dimmed)" />
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Your Galleries — top level of the home folder
// ---------------------------------------------------------------------------

const YourGalleries = ({
  folderId,
  density,
}: {
  folderId: string;
  density: keyof typeof dashboardLimits;
}) => {
  const setThemeMode = useSetAtom(themeModeAtom);
  const [result, reQuery] = useQuery({
    query: dashboardGalleriesQuery,
    variables: { id: folderId },
  });
  useRequery(reQuery, 20000);
  const homeFolder = result.data?.folder;
  const homeBranding = homeFolder?.branding;
  useEffect(() => {
    if (homeFolder) setThemeMode(applyBrandingDefaults(homeBranding));
  }, [homeBranding, homeFolder, setThemeMode]);

  const compact = density === 'mobile';
  const galleries = (result.data?.folder.subFolders ?? []).slice(
    0,
    dashboardLimits[density].galleries,
  );
  return (
    <Stack className={styles.sectionStack} gap="md">
      <SectionHeading title="Your Galleries" icon={<FolderIcon />} />
      {result.fetching && galleries.length === 0 ? (
        <LoadingIndicator />
      ) : galleries.length === 0 ? (
        <EmptyPlaceholder text="No folders here yet" icon={<FolderIcon />} />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="sm">
          {galleries.map((g) => (
            <FolderCard
              key={g.id}
              folder={g}
              showPathTooltip={false}
              compact={compact}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Client Feedback — reuses the existing CommentHistory timeline
// ---------------------------------------------------------------------------

const ClientFeedback = ({
  folderId,
  density,
}: {
  folderId: string;
  density: keyof typeof dashboardLimits;
}) => {
  const [result, reQuery] = useQuery({
    query: dashboardCommentsQuery,
    variables: { id: folderId, limit: dashboardLimits.desktop.comments },
    requestPolicy: 'cache-and-network',
  });
  useRequery(reQuery, 20000);
  const comments = result.data?.comments ?? [];
  return (
    <SectionCard
      title="Client Feedback"
      icon={<CommentsIcon />}
      action={{ label: 'View all', to: `/admin/f/${folderId}/activity` }}
    >
      {result.fetching && comments.length === 0 ? (
        <LoadingIndicator />
      ) : comments.length === 0 ? (
        <EmptyPlaceholder
          text="No comments or ratings yet"
          icon={<CommentsIcon />}
        />
      ) : (
        <CommentHistory
          comments={comments}
          compact={density === 'mobile'}
          flat
          limit={dashboardLimits[density].comments}
          showFolderContext
        />
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Recent Clients — distinct clients by most recent visit (not an audit trail).
// recentUsersQuery already filters to Link users with a lastAccess, one row
// each, most-recent first (capped at 10 by the backend).
// ---------------------------------------------------------------------------

const ClientActivity = ({ folderId }: { folderId: string }) => {
  const navigate = useNavigate();
  const density = useDashboardDensity();
  const [result, reQuery] = useQuery({
    query: recentUsersQuery,
    variables: { folderId },
    requestPolicy: 'cache-and-network',
  });
  useRequery(reQuery, 20000);
  const compact = density === 'mobile';
  const users = (result.data?.users ?? []).slice(
    0,
    dashboardLimits[density].clients,
  );
  return (
    <SectionCard
      title="Recent Clients"
      icon={<AccessLogsIcon />}
      action={{ label: 'View all', to: '/admin/settings/logs' }}
    >
      {result.fetching && users.length === 0 ? (
        <LoadingIndicator />
      ) : users.length === 0 ? (
        <EmptyPlaceholder
          text="No client visits yet"
          icon={<AccessLogsIcon />}
        />
      ) : (
        <Stack gap={4}>
          {users.map((u) => (
            <Group
              key={u.id}
              gap="sm"
              wrap="nowrap"
              p={6}
              className={styles.clickableRow}
              role="link"
              tabIndex={0}
              onClick={() => void navigate(`/admin/f/${u.folderId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void navigate(`/admin/f/${u.folderId}`);
                }
              }}
            >
              <FolderCover
                heroImage={u.folder?.heroImage}
                size={compact ? 36 : 44}
              />
              <Box style={{ flexGrow: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <PicrAvatar user={u} size={18} radius="xl" />
                  <Text size="sm" fw={600} truncate>
                    {u.name}
                  </Text>
                </Group>
                {compact ? null : (
                  <Text size="xs" c="dimmed" truncate>
                    {u.folder?.name}
                  </Text>
                )}
              </Box>
              {compact ? null : (
                <Box style={{ whiteSpace: 'nowrap' }}>
                  <DateDisplay dateString={u.lastAccess ?? undefined} />
                </Box>
              )}
            </Group>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Recently Modified — individual folder cards (matches "Your Galleries")
// plus a manage-folder action on the right of each card.
// ---------------------------------------------------------------------------

const RecentlyModified = ({
  folderId,
  density,
}: {
  folderId: string;
  density: keyof typeof dashboardLimits;
}) => {
  const [result, reQuery] = useQuery({
    query: readAllFoldersQuery,
    variables: {
      id: folderId,
      limit: dashboardLimits.desktop.modified,
      sort: FoldersSortType.FolderLastModified,
    },
  });
  useRequery(reQuery, 20000);
  const folders = (result.data?.allFolders ?? []).filter(
    (f): f is NonNullable<typeof f> => f != null,
  );
  const visibleFolders = folders.slice(0, dashboardLimits[density].modified);
  return (
    <Stack className={styles.sectionStack} gap="md">
      <SectionHeading title="Recently Modified" icon={<FolderIcon />} />
      {result.fetching && visibleFolders.length === 0 ? (
        <LoadingIndicator />
      ) : visibleFolders.length === 0 ? (
        <EmptyPlaceholder
          text="Nothing modified recently"
          icon={<FolderIcon />}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="sm">
          {visibleFolders.map((f) => (
            <FolderCard
              key={f.id}
              folder={f}
              action={
                <ManageFolderIconButton
                  folder={f}
                  variant="subtle"
                  color="gray"
                />
              }
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};
