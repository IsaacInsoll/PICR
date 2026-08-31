import { useMutation, useQuery } from 'urql';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Grid,
  Group,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { prettyBytes } from '@shared/prettyBytes';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useMe } from '../../hooks/useMe';
import {
  BenchmarkIcon,
  CircleCheckFilledIcon,
  CircleXIcon,
  ClipboardIcon,
  DatabaseIcon,
  GitHubIcon,
  InfoIcon,
  PhotoViewIcon,
  ScanIcon,
  ServerIcon,
  StorageIcon,
  SystemIcon,
  VideoMetadataIcon,
} from '../../PicrIcons';
import { PicrLink } from '../../components/PicrLink';
import {
  expensiveServerFileSizeQuery,
  serverInfoQuery,
} from '@shared/urql/queries/serverInfoQuery';
import { runBenchmarkMutation } from '@shared/urql/mutations/runBenchmarkMutation';
import { editServerSettingsMutation } from '@shared/urql/mutations/editServerSettingsMutation';
import type {
  NamedBenchmarkStep,
  ServerInfoQueryQuery,
} from '@shared/gql/graphql';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { useRequery } from '@shared/hooks/useRequery';
import { isNewerPicrVersion } from '../../helpers/versionUpdates';
import { useLanguage } from '../../i18n/useLanguage';
import { useDateFormatters } from '../../i18n/useDateFormatters';
import { useTranslation } from 'react-i18next';
import type { AdminT } from '../../i18n/adminLabels';
import { useNow } from '../../hooks/useNow';
import {
  pingDisplayState,
  pingSourceDisplayState,
  type PingDisplayState,
} from './pingStatusPresentation';

type ServerInfoData = NonNullable<ServerInfoQueryQuery['serverInfo']>;

// Shared live query for both the Info and Media tabs. urql caches by document,
// and only one tab is mounted at a time (keepMounted={false}), so the two
// callers never issue overlapping requests.
const useServerInfoData = () => {
  const [result, reQuery] = useQuery({ query: serverInfoQuery });
  useRequery(reQuery, 20000);
  return { server: result.data?.serverInfo, reQuery };
};

type ServerInfoRequery = ReturnType<typeof useServerInfoData>['reQuery'];

// Info tab: "about this server" — version/updates plus the server URL and
// runtime environment. Media-processing details live under the Media tab.
export const ServerInfo = () => {
  const { server } = useServerInfoData();
  if (!server) return null;
  return (
    <Stack gap="lg" pt="md" pb="xl">
      <Grid columns={5} gap="lg">
        <Grid.Col span={{ base: 5, md: 3 }}>
          <ServerCard server={server} />
        </Grid.Col>
        <Grid.Col span={{ base: 5, md: 2 }}>
          <VersionCard
            version={server.version}
            latest={server.latest}
            developmentBuildSha={server.developmentBuildSha}
            dev={server.dev}
          />
        </Grid.Col>
      </Grid>
      <SystemCard system={server.system} />
    </Stack>
  );
};

// Media tab: how PICR processes media — supported formats and hardware
// acceleration today. Configurable media settings (thumbnail sizes, video
// encoding) will be added here alongside this read-only capability card.
export const MediaSettings = () => {
  const { server, reQuery } = useServerInfoData();
  if (!server) return null;
  return (
    <Stack gap="lg" pt="md" pb="xl">
      <MediaSettingsCard server={server} reQuery={reQuery} />
      <ServerCapabilitiesCard
        caps={server.mediaCaps}
        videoAcceleration={server.videoAcceleration}
      />
    </Stack>
  );
};

// Storage tab: media on disk and how PICR keeps it in sync — disk usage (with
// the Storage Analytics deep-dive) and file-scanning behaviour. Configurable
// options (scan schedule, cache clearing) will slot in here later.
export const StorageSettings = () => {
  const { server } = useServerInfoData();
  if (!server) return null;
  return (
    <Stack gap="lg" pt="md" pb="xl">
      <StorageCard disk={server.disk} canWrite={server.canWrite} />
      <ScanningCard scanning={server.scanning} inode={server.inodeSupport} />
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Presentational building blocks (dashboard-style cards + labelled rows)
// ---------------------------------------------------------------------------

const InfoCard = ({
  title,
  icon,
  description,
  footer,
  children,
}: {
  title: string;
  icon: ReactNode;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) => (
  <Card
    withBorder
    padding="lg"
    radius="md"
    h="100%"
    style={{ display: 'flex', flexDirection: 'column' }}
  >
    <Group gap="xs" wrap="nowrap" mb={description ? 4 : 'md'}>
      <ThemeIcon variant="transparent" color="gray" size="sm">
        {icon}
      </ThemeIcon>
      <Title order={5}>{title}</Title>
    </Group>
    {description ? (
      <Text size="xs" c="dimmed" mb="md">
        {description}
      </Text>
    ) : null}
    <Stack gap="sm">{children}</Stack>
    {footer ? (
      <Group justify="flex-end" gap="md" pt="md" style={{ marginTop: 'auto' }}>
        {footer}
      </Group>
    ) : null}
  </Card>
);

// A labelled row: label + value share one aligned top line (label left, value
// right); the optional plain-English hint drops to its own full-width line
// below so it never squeezes the value cell (which truncated buttons/badges).
const InfoRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) => (
  <Box>
    <Group justify="space-between" align="center" wrap="nowrap" gap="md">
      <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Group gap="xs" wrap="wrap" justify="flex-end" style={{ minWidth: 0 }}>
        {children}
      </Group>
    </Group>
    {description ? (
      <Text size="xs" c="dimmed" mt={2}>
        {description}
      </Text>
    ) : null}
  </Box>
);

// Green/red badge with a leading tick/cross icon (icon inherits the badge's
// colour via currentColor).
const BoolValue = ({ value }: { value?: boolean }) => {
  const { t } = useTranslation('admin');
  return (
    <Badge
      color={value ? 'green' : 'red'}
      variant="light"
      leftSection={
        value ? <CircleCheckFilledIcon size={14} /> : <CircleXIcon size={14} />
      }
    >
      {value ? t('common.yes') : t('common.no')}
    </Badge>
  );
};

// ---------------------------------------------------------------------------
// Version & updates
// ---------------------------------------------------------------------------

const VersionCard = ({
  version,
  latest,
  developmentBuildSha,
  dev,
}: {
  version: string;
  latest: string;
  developmentBuildSha?: string | null;
  dev: boolean;
}) => {
  const { t } = useTranslation('admin');
  const updateAvailable = isNewerPicrVersion(latest, version);
  const versionColor = developmentBuildSha
    ? 'yellow'
    : updateAvailable
      ? 'red'
      : 'green';

  return (
    <InfoCard
      title={t('server.version.title')}
      icon={<InfoIcon />}
      description={t('server.version.description')}
      footer={
        <Anchor
          href="https://github.com/IsaacInsoll/PICR/releases"
          size="xs"
          target="_blank"
          rel="noreferrer"
        >
          <Group gap={4} wrap="nowrap" component="span">
            <GitHubIcon /> {t('server.version.viewReleases')}
          </Group>
        </Anchor>
      }
    >
      <InfoRow label={t('server.version.current')}>
        <Code c={versionColor}>{version}</Code>
        {developmentBuildSha ? (
          <Badge color="yellow" variant="light">
            {t('server.version.devBuild')}
          </Badge>
        ) : updateAvailable ? (
          <Badge color="red" variant="light">
            {t('dashboard.updateAvailable', { version: latest })}
          </Badge>
        ) : (
          <Badge color="green" variant="light">
            {t('server.version.upToDate')}
          </Badge>
        )}
      </InfoRow>
      {updateAvailable && !developmentBuildSha ? (
        <InfoRow
          label={t('server.version.latest')}
          description={t('server.version.latestDescription')}
        >
          <Code>{latest}</Code>
        </InfoRow>
      ) : null}
      {developmentBuildSha ? (
        <InfoRow
          label={t('server.version.developmentBuild')}
          description={t('server.version.developmentBuildDescription')}
        >
          <Code c="yellow">{developmentBuildSha}</Code>
        </InfoRow>
      ) : null}
      {dev ? (
        <InfoRow
          label={t('server.version.developerMode')}
          description={t('server.version.developerModeDescription')}
        >
          <BoolValue value={dev} />
        </InfoRow>
      ) : null}
    </InfoCard>
  );
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const StorageCard = ({
  disk,
  canWrite,
}: {
  disk: ServerInfoData['disk'];
  canWrite: ServerInfoData['canWrite'];
}) => {
  const { t } = useTranslation('admin');
  return (
    <InfoCard
      title={t('server.storage.title')}
      icon={<StorageIcon />}
      description={t('server.storage.description')}
      footer={<TreesizeLink />}
    >
      <InfoRow
        label={t('server.storage.canWrite')}
        description={t('server.storage.canWriteDescription')}
      >
        <BoolValue value={canWrite} />
      </InfoRow>
      <Suspense fallback={<StorageUsageLoading />}>
        <ServerFolderSize disk={disk} />
      </Suspense>
    </InfoCard>
  );
};

const TreesizeLink = () => {
  const { t } = useTranslation('admin');
  const me = useMe();
  const folderId = me?.folderId;
  if (!folderId) return null;
  return (
    <PicrLink to={'/admin/settings/treesize/' + folderId} size="xs">
      <StorageIcon /> {t('server.storage.analytics')}
    </PicrLink>
  );
};

// Disk free space is cheap to fetch, but it's confusing on its own (free
// without used), so it's held back until the user calculates media/cache usage
// and shown alongside them.
const ServerFolderSize = ({ disk }: { disk: ServerInfoData['disk'] }) => {
  const { t } = useTranslation('admin');
  const { formattingLocale } = useLanguage();
  const [requested, setRequested] = useState(false);
  const [result] = useQuery({
    query: expensiveServerFileSizeQuery,
    pause: !requested,
  });
  const server = result.data?.serverInfo;
  if (!requested) {
    return (
      <InfoRow
        label={t('server.storage.usage')}
        description={t('server.storage.usageDescription')}
      >
        <Button
          size="xs"
          variant="light"
          leftSection={<StorageIcon />}
          onClick={() => setRequested(true)}
        >
          {t('server.storage.calculate')}
        </Button>
      </InfoRow>
    );
  }
  if (!server) return null;
  return (
    <>
      <InfoRow
        label={t('server.storage.media')}
        description={t('server.storage.mediaDescription')}
      >
        <Text size="sm">
          {prettyBytes(server.mediaSize, { locale: formattingLocale })}
        </Text>
      </InfoRow>
      <InfoRow
        label={t('server.storage.cache')}
        description={t('server.storage.cacheDescription')}
      >
        <Text size="sm">
          {prettyBytes(server.cacheSize, { locale: formattingLocale })}
        </Text>
      </InfoRow>
      {disk ? (
        <InfoRow
          label={t('server.storage.diskSpace')}
          description={t('server.storage.diskSpaceDescription')}
        >
          <Text size="sm">
            {t('server.storage.freeOf', {
              free: prettyBytes(disk.free, { locale: formattingLocale }),
              total: prettyBytes(disk.total, { locale: formattingLocale }),
            })}
          </Text>
        </InfoRow>
      ) : null}
    </>
  );
};

const StorageUsageLoading = () => {
  const { t } = useTranslation('admin');
  return (
    <InfoRow label={t('server.storage.usage')}>
      <Group gap="xs" wrap="nowrap">
        <LoadingIndicator size="small" />
        <Text size="sm" c="dimmed">
          {t('server.storage.calculating')}
        </Text>
      </Group>
    </InfoRow>
  );
};

// ---------------------------------------------------------------------------
// Media & performance
// ---------------------------------------------------------------------------

type VideoAccelerationInfo = ServerInfoData['videoAcceleration'];
type MediaCapsInfo = ServerInfoData['mediaCaps'];

const MediaSettingsCard = ({
  server,
  reQuery,
}: {
  server: ServerInfoData;
  reQuery: ServerInfoRequery;
}) => {
  const { t } = useTranslation('admin');
  return (
    <InfoCard
      title={t('server.media.title')}
      icon={<VideoMetadataIcon />}
      description={t('server.media.description')}
    >
      <MediaSettingsControls
        key={serverSettingsKey(server.settings)}
        settings={server.settings}
        reQuery={reQuery}
      />
    </InfoCard>
  );
};

type ServerSettingsData = ServerInfoData['settings'];

interface MediaSettingsFormState {
  useOriginalsForLightbox: boolean;
  thumbnailJpegQuality: number;
}

const formStateFor = (
  settings: ServerSettingsData,
): MediaSettingsFormState => ({
  useOriginalsForLightbox: settings.useOriginalsForLightbox,
  thumbnailJpegQuality: settings.thumbnailJpegQuality,
});

const MediaSettingsControls = ({
  settings,
  reQuery,
}: {
  settings: ServerSettingsData;
  reQuery: ServerInfoRequery;
}) => {
  const { t } = useTranslation('admin');
  const [form, setForm] = useState<MediaSettingsFormState>(() =>
    formStateFor(settings),
  );
  const [result, editSettings] = useMutation(editServerSettingsMutation);

  const setField = <K extends keyof MediaSettingsFormState>(
    field: K,
    value: MediaSettingsFormState[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    const payload = payloadFor(form);
    const update = await editSettings({ input: payload });
    if (update.error) {
      notifications.show({
        color: 'red',
        title: t('server.media.saveError'),
        message: update.error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: t('server.media.saved'),
      message: t('server.media.savedDescription'),
    });
    reQuery({ requestPolicy: 'network-only' });
  };

  return (
    <Stack gap="md">
      <Switch
        checked={form.useOriginalsForLightbox}
        label={t('server.media.useOriginals')}
        description={t('server.media.useOriginalsDescription')}
        onChange={(event) =>
          setField('useOriginalsForLightbox', event.currentTarget.checked)
        }
      />
      <NumberInput
        label={t('server.media.thumbnailQuality')}
        description={t('server.media.thumbnailQualityDescription')}
        value={form.thumbnailJpegQuality}
        min={1}
        max={100}
        step={5}
        allowDecimal={false}
        clampBehavior="strict"
        suffix="%"
        onChange={(value) =>
          setField(
            'thumbnailJpegQuality',
            typeof value === 'number' ? value : form.thumbnailJpegQuality,
          )
        }
      />
      <Group justify="flex-end">
        <Button
          size="xs"
          variant="light"
          onClick={() => void save()}
          loading={result.fetching}
        >
          {t('server.media.save')}
        </Button>
      </Group>
    </Stack>
  );
};

const payloadFor = (form: MediaSettingsFormState) => ({
  useOriginalsForLightbox: form.useOriginalsForLightbox,
  thumbnailJpegQuality: form.thumbnailJpegQuality,
});

const serverSettingsKey = (settings: ServerSettingsData) =>
  [settings.useOriginalsForLightbox, settings.thumbnailJpegQuality].join(':');

const ServerCapabilitiesCard = ({
  caps,
  videoAcceleration,
}: {
  caps: MediaCapsInfo;
  videoAcceleration: VideoAccelerationInfo;
}) => {
  const { t } = useTranslation('admin');
  return (
    <InfoCard
      title={t('server.capabilities.title')}
      icon={<ServerIcon />}
      description={t('server.capabilities.description')}
      footer={<Benchmark />}
    >
      <AdditionalImageFormats caps={caps} />
      <VideoAcceleration info={videoAcceleration} />
    </InfoCard>
  );
};

const AdditionalImageFormats = ({ caps }: { caps: MediaCapsInfo }) => {
  const { t } = useTranslation('admin');
  const formats = [
    { label: 'RAW', enabled: caps.raw },
    { label: 'PSD', enabled: caps.psd },
    { label: 'PSB', enabled: caps.psb },
    { label: 'HEIC / HEIF', enabled: caps.heic },
  ];

  return (
    <InfoRow
      label={t('server.capabilities.imageFormats')}
      description={t('server.capabilities.imageFormatsDescription')}
    >
      {formats.map((format) => (
        <Badge
          key={format.label}
          color={format.enabled ? 'green' : 'gray'}
          variant={format.enabled ? 'light' : 'outline'}
        >
          {format.label}
        </Badge>
      ))}
    </InfoRow>
  );
};

// Codec labels ffmpeg/VAAPI report vary in punctuation ("H.264", "VC-1",
// "MPEG-2"), so normalise before ranking them.
const normaliseCodec = (codec: string) =>
  codec.toUpperCase().replace(/[\s._-]/g, '');

// H.264/HEVC are the formats videographers actually deliver in, so they lead
// (green); AV1 follows (gray) as the forward-looking codec. Everything else
// (VP8/VP9, MPEG-2, VC-1, MJPEG…) is collapsed behind a "+N" chip but still
// shown in the hover tooltip.
const primaryCodecs = new Set(['H264', 'AVC', 'HEVC', 'H265']);
const secondaryCodecs = new Set(['AV1']);

const codecRank = (codec: string) => {
  const key = normaliseCodec(codec);
  if (primaryCodecs.has(key)) return 0;
  if (secondaryCodecs.has(key)) return 1;
  return 2;
};

const VideoAcceleration = ({ info }: { info: VideoAccelerationInfo }) => {
  const { t } = useTranslation('admin');
  if (info.mode !== 'vaapi') {
    return (
      <InfoRow
        label={t('server.capabilities.videoAcceleration')}
        description={t('server.capabilities.videoAccelerationWhenAvailable')}
      >
        <Badge color="gray" variant="outline">
          {t('server.capabilities.cpuOnly')}
        </Badge>
        {info.reason ? (
          <Text size="xs" c="dimmed" ta="right">
            {info.reason}
          </Text>
        ) : null}
      </InfoRow>
    );
  }

  const ranked = [...info.codecs].sort((a, b) => codecRank(a) - codecRank(b));
  let visible = ranked.filter((codec) => codecRank(codec) <= 1);
  let hidden = ranked.filter((codec) => codecRank(codec) === 2);
  // If none are recognised, fall back to showing a few raw codecs so the
  // summary is never empty.
  if (visible.length === 0) {
    visible = hidden.slice(0, 3);
    hidden = hidden.slice(3);
  }

  const fullString = [info.driver, info.codecs.join(', ')]
    .filter(Boolean)
    .join(' — ');

  return (
    <InfoRow
      label={t('server.capabilities.videoAcceleration')}
      description={t('server.capabilities.videoAccelerationDescription')}
    >
      <Tooltip label={fullString} multiline w={300} withArrow position="top">
        <Stack gap={6} align="flex-end" style={{ minWidth: 0 }}>
          <Group gap={6} justify="flex-end" wrap="wrap">
            {visible.map((codec) => (
              <Badge
                key={codec}
                color={codecRank(codec) === 0 ? 'green' : 'gray'}
                variant="light"
              >
                {codec}
              </Badge>
            ))}
            {hidden.length > 0 ? (
              <Badge color="gray" variant="outline">
                +{hidden.length}
              </Badge>
            ) : null}
          </Group>
          <Text
            size="xs"
            c="dimmed"
            ta="right"
            style={{ wordBreak: 'break-word' }}
          >
            {info.driver ? `VAAPI · ${info.driver}` : 'VAAPI'}
          </Text>
        </Stack>
      </Tooltip>
    </InfoRow>
  );
};

// ---------------------------------------------------------------------------
// Server / environment
// ---------------------------------------------------------------------------

const normaliseUrl = (url: string) => url.replace(/\/+$/, '');

const ServerCard = ({ server }: { server: ServerInfoData }) => {
  const { t } = useTranslation('admin');
  const clientUrl = window.location.origin;
  // Usually identical to the server URL (bar a trailing slash); only surface it
  // when it genuinely differs, which hints at a BASE_URL misconfiguration.
  const clientDiffers = normaliseUrl(clientUrl) !== normaliseUrl(server.host);
  return (
    <InfoCard
      title={t('server.server.title')}
      icon={<ServerIcon />}
      description={t('server.server.description')}
    >
      {clientDiffers ? (
        <InfoRow
          label={t('server.server.clientUrl')}
          description={t('server.server.clientUrlDescription')}
        >
          <Code style={{ wordBreak: 'break-all' }}>{clientUrl}</Code>
        </InfoRow>
      ) : null}
      <InfoRow
        label={t('server.server.serverUrl')}
        description={t('server.server.serverUrlDescription')}
      >
        <Code style={{ wordBreak: 'break-all' }}>{server.host}</Code>
      </InfoRow>
      <InfoRow
        label={t('server.server.uptime')}
        description={t('server.server.uptimeDescription')}
      >
        <Code>{formatUptime(server.system.uptimeSeconds, t)}</Code>
      </InfoRow>
    </InfoCard>
  );
};

// ---------------------------------------------------------------------------
// System / runtime
// ---------------------------------------------------------------------------

const formatUptime = (seconds: number, t: AdminT) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(t('server.duration.dayShort', { count: days }));
  if (hours) parts.push(t('server.duration.hourShort', { count: hours }));
  if (minutes || parts.length === 0) {
    parts.push(t('server.duration.minuteShort', { count: minutes }));
  }
  return parts.join(' ');
};

const SystemCard = ({ system }: { system: ServerInfoData['system'] }) => {
  const { t } = useTranslation('admin');
  const { formattingLocale } = useLanguage();
  const metrics = [
    {
      label: t('server.system.platform'),
      value: system.platform,
      icon: <SystemIcon />,
    },
    {
      label: t('server.system.memory'),
      value: prettyBytes(system.totalMemory, { locale: formattingLocale }),
      icon: <StorageIcon />,
    },
    {
      label: 'Node.js',
      value: system.nodeVersion,
      icon: <ServerIcon />,
    },
    {
      label: t('server.system.database'),
      value: system.databaseVersion,
      icon: <DatabaseIcon />,
    },
    {
      label: 'ffmpeg',
      value: system.ffmpegVersion,
      icon: <VideoMetadataIcon />,
    },
    {
      label: 'ImageMagick',
      value: system.imageMagickVersion,
      icon: <PhotoViewIcon />,
    },
  ];

  return (
    <Box>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing="sm">
        {metrics.map((metric) => (
          <SystemMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

const SystemMetricCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon: ReactNode;
}) => {
  const { t } = useTranslation('admin');
  return (
    <Card withBorder padding="md" radius="md">
      <Group gap="xs" wrap="nowrap" mb={6}>
        <ThemeIcon variant="light" color="gray" size="sm">
          {icon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" fw={600}>
          {label}
        </Text>
      </Group>
      {value ? (
        <Code
          display="block"
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Code>
      ) : (
        <Text size="sm" c="dimmed">
          {t('common.unavailable')}
        </Text>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Media scanning + inode tracking
// ---------------------------------------------------------------------------

type ScanningInfo = ServerInfoData['scanning'];
type InodeSupportInfo = ServerInfoData['inodeSupport'];
type ScheduledScanStatusInfo = ScanningInfo['scheduledScan'];
type PingStatusInfo = ScanningInfo['ping'];
type PingSourceStatusInfo = PingStatusInfo['sources'][number];

// "direct_and_new" -> "Direct And New"
const scanModeLabel = (mode: string, t: AdminT) => {
  switch (mode) {
    case 'off':
      return t('server.scanning.modes.off');
    case 'native':
      return t('server.scanning.modes.native');
    case 'polling':
      return t('server.scanning.modes.polling');
    case 'direct':
      return t('server.scanning.modes.direct');
    case 'direct_and_new':
      return t('server.scanning.modes.directAndNew');
    case 'one_level':
      return t('server.scanning.modes.oneLevel');
    default:
      return mode;
  }
};

const formatDuration = (durationMs: number) => {
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
};

const InodeBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation('admin');
  const color =
    status === 'enabled' ? 'green' : status === 'disabled' ? 'red' : 'gray';
  const label =
    status === 'enabled'
      ? t('common.enabled')
      : status === 'disabled'
        ? t('common.disabled')
        : t('common.unknown');
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
};

const pingStateColor = (state: PingDisplayState) => {
  switch (state) {
    case 'connected':
      return 'green';
    case 'stale':
    case 'awaiting':
      return 'yellow';
    case 'error':
    case 'degraded':
      return 'red';
    case 'disabled':
      return 'gray';
  }
};

const PingStateBadge = ({ state }: { state: PingDisplayState }) => {
  const { t } = useTranslation('admin');
  return (
    <Badge color={pingStateColor(state)} variant="light">
      {t(`server.scanning.pingStates.${state}`)}
    </Badge>
  );
};

const PingSourceStatus = ({
  source,
  now,
}: {
  source: PingSourceStatusInfo;
  now: number;
}) => {
  const { t } = useTranslation('admin');
  const { prettyDate } = useDateFormatters();
  const state = pingSourceDisplayState(source, now);
  return (
    <Card withBorder padding="sm" radius="sm">
      <Group justify="space-between" gap="xs">
        <Text size="sm" fw={600}>
          {source.name}
        </Text>
        <PingStateBadge state={state} />
      </Group>
      <Text size="xs" c="dimmed" mt={4}>
        {t('server.scanning.pingSource', {
          path: source.watchPrefix || t('server.scanning.mediaRoot'),
          version: source.pingVersion,
        })}
      </Text>
      <Text size="xs" c="dimmed">
        {t('server.scanning.pingSourceActivity', {
          lastSeen: prettyDate(source.lastSeenAt),
          hints: source.hintsReceived,
        })}
      </Text>
      <Text size="xs" c="dimmed">
        {t('server.scanning.pingSourceScans', {
          instance: source.instanceId.slice(0, 12),
          lastBatch: source.lastBatchAt
            ? prettyDate(source.lastBatchAt)
            : t('server.scanning.neverRun'),
          lastReconcile: source.lastReconcileAt
            ? prettyDate(source.lastReconcileAt)
            : t('server.scanning.neverRun'),
        })}
      </Text>
      {source.lastError ? (
        <Text size="xs" c="red" mt={4}>
          {source.lastError}
        </Text>
      ) : null}
    </Card>
  );
};

const PingStatus = ({ ping }: { ping: PingStatusInfo }) => {
  const { t } = useTranslation('admin');
  const now = useNow(20_000);
  const state = pingDisplayState(ping, now);
  return (
    <Stack gap="xs">
      <InfoRow
        label={t('server.scanning.ping')}
        description={t('server.scanning.pingDescription')}
      >
        <PingStateBadge state={state} />
      </InfoRow>
      {ping.enabled
        ? ping.sources.map((source) => (
            <PingSourceStatus
              key={`${source.name}:${source.instanceId}`}
              source={source}
              now={now}
            />
          ))
        : null}
      {ping.enabled ? (
        <InfoRow label={t('server.scanning.pingCoordinator')}>
          <Code>{ping.coordinator.state}</Code>
          <Text size="xs" c="dimmed">
            {t('server.scanning.pingCoordinatorActivity', {
              scanned: ping.coordinator.foldersScanned,
              pending: ping.coordinator.pendingFolders,
            })}
          </Text>
        </InfoRow>
      ) : null}
      {ping.coordinator.lastError ? (
        <Text size="xs" c="red">
          {ping.coordinator.lastError}
        </Text>
      ) : null}
    </Stack>
  );
};

// The last scheduled scan reads as a short summary line, so it gets a labelled
// top row (when it ran + how long) with the added/changed/moved breakdown on
// its own full-width line beneath, matching the InfoRow description pattern.
const LastScan = ({ status }: { status: ScheduledScanStatusInfo }) => {
  const { t } = useTranslation('admin');
  const { prettyDate } = useDateFormatters();
  if (!status.lastStartedAt) {
    return (
      <InfoRow label={t('server.scanning.lastScheduled')}>
        <Text size="sm" c="dimmed">
          {t('server.scanning.neverRun')}
        </Text>
      </InfoRow>
    );
  }
  const result = status.lastResult;
  const moved = (result?.movedFiles ?? 0) + (result?.movedFolders ?? 0);
  const removed = (result?.removedFiles ?? 0) + (result?.removedFolders ?? 0);
  return (
    <Box>
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
          {t('server.scanning.lastScheduled')}
        </Text>
        <Group gap="xs" wrap="wrap" justify="flex-end" style={{ minWidth: 0 }}>
          <Text size="sm">{prettyDate(status.lastStartedAt)}</Text>
          {typeof status.lastDurationMs === 'number' ? (
            <Badge color="gray" variant="light">
              {formatDuration(status.lastDurationMs)}
            </Badge>
          ) : null}
        </Group>
      </Group>
      {status.lastError ? (
        <Text size="xs" c="red" mt={2}>
          {status.lastError}
        </Text>
      ) : result ? (
        <Text size="xs" c={result.completed ? 'dimmed' : 'yellow'} mt={2}>
          {t('server.scanning.lastResult', {
            status: result.completed
              ? t('server.scanning.completed')
              : t('server.scanning.unsettled'),
            passes: t('server.scanning.pass', {
              count: result.scanPasses,
            }),
            added: result.addedFiles,
            changed: result.changedFiles,
            moved,
            removed,
            skipped: result.skippedEntries,
          })}
        </Text>
      ) : null}
    </Box>
  );
};

const ScanningCard = ({
  scanning,
  inode,
}: {
  scanning: ScanningInfo;
  inode: InodeSupportInfo;
}) => {
  const { t } = useTranslation('admin');
  const { prettyDate } = useDateFormatters();
  const scheduled = scanning.scheduledScan;
  return (
    <InfoCard
      title={t('server.scanning.title')}
      icon={<ScanIcon />}
      description={t('server.scanning.description')}
    >
      <InfoRow
        label={t('server.scanning.fileWatcher')}
        description={t('server.scanning.fileWatcherDescription')}
      >
        <Code>{scanModeLabel(scanning.fileWatcherMode, t)}</Code>
      </InfoRow>
      <InfoRow
        label={t('server.scanning.onView')}
        description={t('server.scanning.onViewDescription')}
      >
        <Code>{scanModeLabel(scanning.onViewScanMode, t)}</Code>
      </InfoRow>
      <InfoRow
        label={t('server.scanning.scheduled')}
        description={t('server.scanning.scheduledDescription')}
      >
        <Badge
          color={scanning.scheduledScanHours > 0 ? 'green' : 'gray'}
          variant="light"
        >
          {scanning.scheduledScanHours > 0
            ? t('server.scanning.everyHours', {
                count: scanning.scheduledScanHours,
              })
            : t('server.scanning.off')}
        </Badge>
        {scheduled.running ? (
          <Badge color="blue" variant="light">
            {t('server.scanning.running')}
          </Badge>
        ) : null}
        {scheduled.nextScanAt ? (
          <Text size="sm" c="dimmed">
            {t('server.scanning.next', {
              date: prettyDate(scheduled.nextScanAt),
            })}
          </Text>
        ) : null}
      </InfoRow>
      <InfoRow
        label={t('server.scanning.inodeTracking')}
        description={inode.reason}
      >
        <InodeBadge status={inode.status} />
      </InfoRow>
      <PingStatus ping={scanning.ping} />
      <LastScan status={scheduled} />
    </InfoCard>
  );
};

// ---------------------------------------------------------------------------
// Benchmark (unchanged behaviour, now rendered inside a card row)
// ---------------------------------------------------------------------------

const Benchmark = () => {
  const { t } = useTranslation('admin');
  const [result, runBenchmark] = useMutation(runBenchmarkMutation);
  const benchmark = result.data?.runBenchmark;
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [assetPath, setAssetPath] = useState('');

  const startBenchmark = () => {
    setConfirmed(true);
    const trimmedAssetPath = assetPath.trim();
    void runBenchmark({ assetPath: trimmedAssetPath || undefined });
  };

  const close = () => {
    if (result.fetching) return;
    setOpened(false);
  };

  return (
    <>
      <Anchor
        component="button"
        size="xs"
        type="button"
        onClick={() => {
          setOpened(true);
          setConfirmed(false);
        }}
      >
        <BenchmarkIcon /> {t('server.benchmark.run')}
      </Anchor>
      <Modal
        opened={opened}
        onClose={close}
        title={t('server.benchmark.run')}
        centered
        closeOnClickOutside={!result.fetching}
        closeOnEscape={!result.fetching}
      >
        <Stack gap="md">
          {!confirmed ? (
            <>
              <Text size="sm">{t('server.benchmark.confirmation')}</Text>
              <TextInput
                label={t('server.benchmark.assetPathOverride')}
                description={t('server.benchmark.assetPathOverrideDescription')}
                value={assetPath}
                onChange={(event) => setAssetPath(event.currentTarget.value)}
                placeholder={t('server.benchmark.assetPathOverridePlaceholder')}
              />
              <Group justify="flex-end">
                <Button variant="default" onClick={close}>
                  {t('common.cancel')}
                </Button>
                <Button
                  leftSection={<BenchmarkIcon />}
                  onClick={startBenchmark}
                >
                  {t('server.benchmark.run')}
                </Button>
              </Group>
            </>
          ) : result.fetching ? (
            <Group gap="sm">
              <LoadingIndicator size="small" />
              <Text size="sm">{t('server.benchmark.running')}</Text>
            </Group>
          ) : result.error ? (
            <>
              <Text c="red" size="sm">
                {result.error.message}
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={close}>
                  {t('common.close')}
                </Button>
              </Group>
            </>
          ) : benchmark ? (
            <>
              <Stack gap="xs">
                <BenchmarkResultLine
                  title={t('server.benchmark.version')}
                  value={benchmark.appVersion}
                />
                <BenchmarkResultLine
                  title={t('server.benchmark.assets')}
                  value={t('server.benchmark.assetCounts', {
                    images: t('server.benchmark.image', {
                      count: benchmark.imageCount,
                    }),
                    videos: t('server.benchmark.video', {
                      count: benchmark.videoCount,
                    }),
                  })}
                />
                <BenchmarkResultLine
                  title={t('server.benchmark.assetPath')}
                  value={benchmark.assetPath}
                />
                <BenchmarkResultLine
                  title={t('server.benchmark.assetSource')}
                  value={benchmark.assetSourceUrl}
                />
                <BenchmarkResultLine
                  title={t('server.benchmark.cpuCount')}
                  value={String(benchmark.cpuCount)}
                />
                <BenchmarkResultLine
                  title={t('server.benchmark.uvThreadpool')}
                  value={
                    benchmark.uvThreadpoolSize || t('server.benchmark.default')
                  }
                />
                <BenchmarkResultLine
                  title={t('server.capabilities.videoAcceleration')}
                  value={
                    benchmark.videoAccelerationMode === 'vaapi'
                      ? 'VAAPI'
                      : `${t('server.capabilities.cpuOnly')} (${benchmark.videoAccelerationReason})`
                  }
                />
                {benchmark.steps.map((step) => (
                  <BenchmarkResultLine
                    key={step.key}
                    title={
                      step.includedInTotal
                        ? step.name
                        : t('server.benchmark.notIncludedStep', {
                            name: step.name,
                          })
                    }
                    value={<BenchmarkStepValue step={step} />}
                  />
                ))}
                <BenchmarkResultLine
                  title={t('server.benchmark.total')}
                  value={t('server.benchmark.totalValue', {
                    duration: formatMs(benchmark.totalMs),
                  })}
                />
              </Stack>
              <Group justify="flex-end">
                <Button
                  variant="default"
                  leftSection={<ClipboardIcon />}
                  onClick={() => {
                    copyToClipboard(formatBenchmarkResults(benchmark));
                    notifications.show({
                      title: t('server.benchmark.copied'),
                      message: benchmark.appVersion,
                      icon: <ClipboardIcon />,
                    });
                  }}
                >
                  {t('server.benchmark.copy')}
                </Button>
                <Button onClick={close}>{t('common.close')}</Button>
              </Group>
            </>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
};

const BenchmarkResultLine = ({
  title,
  value,
}: {
  title: string;
  value: ReactNode;
}) => {
  return (
    <Group justify="space-between" align="flex-start" gap="lg" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {title}
      </Text>
      {typeof value === 'string' ? <Code>{value}</Code> : value}
    </Group>
  );
};

type BenchmarkResultForCopy = {
  appVersion: string;
  imageCount: number;
  videoCount: number;
  assetPath: string;
  assetSourceUrl: string;
  cpuCount: number;
  uvThreadpoolSize: string;
  videoAccelerationMode: string;
  videoAccelerationReason: string;
  steps: BenchmarkStepForDisplay[];
  totalMs: number;
};

const formatBenchmarkResults = (benchmark: BenchmarkResultForCopy) => {
  const lines = [
    `PICR Version: ${benchmark.appVersion}`,
    `Assets: ${benchmark.imageCount} images, ${benchmark.videoCount} videos`,
    `Asset Path: ${benchmark.assetPath}`,
    `Asset Source: ${benchmark.assetSourceUrl}`,
    `CPU Count: ${benchmark.cpuCount}`,
    `UV Threadpool: ${benchmark.uvThreadpoolSize || 'default'}`,
    `Video Acceleration: ${
      benchmark.videoAccelerationMode === 'vaapi'
        ? 'VAAPI'
        : `CPU only (${benchmark.videoAccelerationReason})`
    }`,
  ];
  benchmark.steps.forEach((step) => {
    lines.push(
      `${step.name}${step.includedInTotal ? '' : ' (not included in total)'}: ${formatStep(step)}`,
    );
  });
  lines.push(
    `Total: ${formatMs(benchmark.totalMs)} (completed included steps only)`,
  );
  return lines.join('\n');
};

type BenchmarkStepForDisplay = Pick<
  NamedBenchmarkStep,
  | 'name'
  | 'status'
  | 'ms'
  | 'skippedReason'
  | 'outputBytes'
  | 'details'
  | 'includedInTotal'
>;

const formatStep = (step: BenchmarkStepForDisplay) => {
  const result =
    step.status === 'failed'
      ? `failed after ${formatMs(step.ms)}: ${step.skippedReason ?? 'Unknown error'}`
      : (step.skippedReason ?? formatMs(step.ms));
  const parts = [result];
  if (step.outputBytes != null)
    parts.push(prettyBytes(String(step.outputBytes)));
  if (step.details) parts.push(step.details);
  return parts.join(' | ');
};

const BenchmarkStepValue = ({ step }: { step: BenchmarkStepForDisplay }) => {
  const { t } = useTranslation('admin');
  if (step.status === 'skipped') {
    return (
      <Text c="dimmed" size="sm" ta="right">
        {step.skippedReason}
      </Text>
    );
  }
  if (step.status === 'failed') {
    return (
      <Stack gap={2} align="flex-end">
        <Text c="red" size="sm" ta="right">
          {t('server.benchmark.failed')}: {step.skippedReason}
        </Text>
        {step.ms != null ? (
          <Text size="xs" c="dimmed" ta="right">
            {formatMs(step.ms)}
          </Text>
        ) : null}
      </Stack>
    );
  }
  return (
    <Stack gap={2} align="flex-end">
      <Code>{formatMs(step.ms)}</Code>
      {step.outputBytes != null ? (
        <Text size="xs" c="dimmed" ta="right">
          {prettyBytes(String(step.outputBytes))}
        </Text>
      ) : null}
      {step.details ? (
        <Text size="xs" c="dimmed" ta="right">
          {step.details}
        </Text>
      ) : null}
    </Stack>
  );
};

const formatMs = (ms?: number | null) => {
  if (ms == null) return 'N/A';
  return `${Math.round(ms).toLocaleString()} ms`;
};
