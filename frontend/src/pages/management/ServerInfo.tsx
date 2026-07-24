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
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { prettyBytes } from '@shared/prettyBytes';
import { prettyDate } from '@shared/prettyDate';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useMe } from '../../hooks/useMe';
import {
  BenchmarkIcon,
  BitrateIcon,
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
  ThumbnailsIcon,
  VideoMetadataIcon,
} from '../../PicrIcons';
import { PicrLink } from '../../components/PicrLink';
import {
  expensiveServerFileSizeQuery,
  serverInfoQuery,
} from '@shared/urql/queries/serverInfoQuery';
import { runBenchmarkMutation } from '@shared/urql/mutations/runBenchmarkMutation';
import { editServerSettingsMutation } from '@shared/urql/mutations/editServerSettingsMutation';
import type { BenchmarkStep, ServerInfoQueryQuery } from '@shared/gql/graphql';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { useRequery } from '@shared/hooks/useRequery';
import { isNewerPicrVersion } from '../../helpers/versionUpdates';
import { DEFAULT_SERVER_MEDIA_SETTINGS } from '@shared/serverMediaSettings';

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
const BoolValue = ({ value }: { value?: boolean }) => (
  <Badge
    color={value ? 'green' : 'red'}
    variant="light"
    leftSection={
      value ? <CircleCheckFilledIcon size={14} /> : <CircleXIcon size={14} />
    }
  >
    {value ? 'Yes' : 'No'}
  </Badge>
);

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
  const updateAvailable = isNewerPicrVersion(latest, version);
  const versionColor = developmentBuildSha
    ? 'yellow'
    : updateAvailable
      ? 'red'
      : 'green';

  return (
    <InfoCard
      title="Version & Updates"
      icon={<InfoIcon />}
      description="The version of PICR you're running. Keeping it up to date gives you the latest features and fixes."
      footer={
        <Anchor
          href="https://github.com/IsaacInsoll/PICR/releases"
          size="xs"
          target="_blank"
          rel="noreferrer"
        >
          <Group gap={4} wrap="nowrap" component="span">
            <GitHubIcon /> View PICR releases
          </Group>
        </Anchor>
      }
    >
      <InfoRow label="PICR version">
        <Code c={versionColor}>{version}</Code>
        {developmentBuildSha ? (
          <Badge color="yellow" variant="light">
            Dev build
          </Badge>
        ) : updateAvailable ? (
          <Badge color="red" variant="light">
            Update available: v{latest}
          </Badge>
        ) : (
          <Badge color="green" variant="light">
            Up to date
          </Badge>
        )}
      </InfoRow>
      {updateAvailable && !developmentBuildSha ? (
        <InfoRow
          label="Latest release"
          description="The newest version available to download."
        >
          <Code>{latest}</Code>
        </InfoRow>
      ) : null}
      {developmentBuildSha ? (
        <InfoRow
          label="Development build"
          description="Built from source rather than an official release."
        >
          <Code c="yellow">{developmentBuildSha}</Code>
        </InfoRow>
      ) : null}
      {dev ? (
        <InfoRow
          label="Developer mode"
          description="On only for development builds of PICR."
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
}) => (
  <InfoCard
    title="Storage"
    icon={<StorageIcon />}
    description="Disk space used by your original photos and the thumbnails PICR generates."
    footer={<TreesizeLink />}
  >
    <InfoRow
      label="Can write"
      description="Whether PICR is allowed to make changes to your photo folders."
    >
      <BoolValue value={canWrite} />
    </InfoRow>
    <Suspense fallback={<StorageUsageLoading />}>
      <ServerFolderSize disk={disk} />
    </Suspense>
  </InfoCard>
);

const TreesizeLink = () => {
  const me = useMe();
  const folderId = me?.folderId;
  if (!folderId) return null;
  return (
    <PicrLink to={'/admin/settings/treesize/' + folderId} size="xs">
      <StorageIcon /> Storage Analytics
    </PicrLink>
  );
};

// Disk free space is cheap to fetch, but it's confusing on its own (free
// without used), so it's held back until the user calculates media/cache usage
// and shown alongside them.
const ServerFolderSize = ({ disk }: { disk: ServerInfoData['disk'] }) => {
  const [requested, setRequested] = useState(false);
  const [result] = useQuery({
    query: expensiveServerFileSizeQuery,
    pause: !requested,
  });
  const server = result.data?.serverInfo;
  if (!requested) {
    return (
      <InfoRow
        label="Storage usage"
        description="Adds up disk space for your media and cache. This scans your folders, so it can take a moment."
      >
        <Button
          size="xs"
          variant="light"
          leftSection={<StorageIcon />}
          onClick={() => setRequested(true)}
        >
          Calculate
        </Button>
      </InfoRow>
    );
  }
  if (!server) return null;
  return (
    <>
      <InfoRow label="Media" description="Your original photos and videos.">
        <Text size="sm">{prettyBytes(server.mediaSize)}</Text>
      </InfoRow>
      <InfoRow
        label="Cache"
        description="Thumbnails and previews PICR created. Safe to delete — they regenerate automatically."
      >
        <Text size="sm">{prettyBytes(server.cacheSize)}</Text>
      </InfoRow>
      {disk ? (
        <InfoRow
          label="Disk space"
          description="Free space on the drive that holds your media."
        >
          <Text size="sm">
            {prettyBytes(disk.free)} free of {prettyBytes(disk.total)}
          </Text>
        </InfoRow>
      ) : null}
    </>
  );
};

const StorageUsageLoading = () => (
  <InfoRow label="Storage usage">
    <Group gap="xs" wrap="nowrap">
      <LoadingIndicator size="small" />
      <Text size="sm" c="dimmed">
        Calculating…
      </Text>
    </Group>
  </InfoRow>
);

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
}) => (
  <InfoCard
    title="Media & Performance"
    icon={<VideoMetadataIcon />}
    description="How PICR generates previews and which extra media formats this server can process."
  >
    <MediaSettingsControls
      key={serverSettingsKey(server.settings)}
      settings={server.settings}
      reQuery={reQuery}
    />
  </InfoCard>
);

type ServerSettingsData = ServerInfoData['settings'];
type NumericSetting = number | '';

interface MediaSettingsFormState {
  useOriginalsForLightbox: boolean;
  thumbnailSmallPx: NumericSetting;
  thumbnailMediumPx: NumericSetting;
  thumbnailLargePx: NumericSetting;
  thumbnailJpegQuality: NumericSetting;
}

const formStateFor = (
  settings: ServerSettingsData,
): MediaSettingsFormState => ({
  useOriginalsForLightbox: settings.useOriginalsForLightbox,
  thumbnailSmallPx: settings.thumbnailSmallPx,
  thumbnailMediumPx: settings.thumbnailMediumPx,
  thumbnailLargePx: settings.thumbnailLargePx,
  thumbnailJpegQuality: settings.thumbnailJpegQuality,
});

const MediaSettingsControls = ({
  settings,
  reQuery,
}: {
  settings: ServerSettingsData;
  reQuery: ServerInfoRequery;
}) => {
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
        title: 'Could not save media settings',
        message: update.error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: 'Media settings saved',
      message: 'New thumbnail settings apply the next time previews generate.',
    });
    reQuery({ requestPolicy: 'network-only' });
  };

  return (
    <Stack gap="md">
      <Box>
        <Title order={6}>Thumbnails</Title>
        <Text size="xs" c="dimmed" mt={2}>
          Changes apply when thumbnails are generated again; existing previews
          stay as they are until regenerated or cleared.
        </Text>
      </Box>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
        <PixelInput
          label="Small width"
          icon={<ThumbnailsIcon />}
          value={form.thumbnailSmallPx}
          defaultValue={DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailSmallPx}
          onChange={(value) => setField('thumbnailSmallPx', value)}
        />
        <PixelInput
          label="Medium width"
          icon={<ThumbnailsIcon />}
          value={form.thumbnailMediumPx}
          defaultValue={DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailMediumPx}
          onChange={(value) => setField('thumbnailMediumPx', value)}
        />
        <PixelInput
          label="Large width"
          icon={<ThumbnailsIcon />}
          value={form.thumbnailLargePx}
          defaultValue={DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailLargePx}
          onChange={(value) => setField('thumbnailLargePx', value)}
        />
        <QualityInput
          label="JPEG quality"
          icon={<BitrateIcon />}
          value={form.thumbnailJpegQuality}
          defaultValue={DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailJpegQuality}
          onChange={(value) => setField('thumbnailJpegQuality', value)}
        />
      </SimpleGrid>
      <Switch
        checked={form.useOriginalsForLightbox}
        label="Use originals for lightbox"
        description="Only for downloadable, browser-displayable images (IE: JPEG not PSD). Proof links keep optimized previews."
        onChange={(event) =>
          setField('useOriginalsForLightbox', event.currentTarget.checked)
        }
      />
      <Group justify="flex-end">
        <Button
          size="xs"
          variant="light"
          onClick={() => void save()}
          loading={result.fetching}
        >
          Save media settings
        </Button>
      </Group>
    </Stack>
  );
};

const PixelInput = ({
  label,
  icon,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: NumericSetting;
  defaultValue: number;
  onChange: (value: NumericSetting) => void;
}) => (
  <NumberInput
    label={label}
    value={value}
    placeholder={String(defaultValue)}
    min={16}
    max={20000}
    allowDecimal={false}
    suffix=" px"
    leftSection={icon}
    onChange={(next) => onChange(numberInputValue(next))}
  />
);

const QualityInput = ({
  label,
  icon,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: NumericSetting;
  defaultValue: number;
  onChange: (value: NumericSetting) => void;
}) => (
  <NumberInput
    label={label}
    value={value}
    placeholder={String(defaultValue)}
    min={1}
    max={100}
    allowDecimal={false}
    suffix="%"
    leftSection={icon}
    onChange={(next) => onChange(numberInputValue(next))}
  />
);

const numberInputValue = (value: string | number): NumericSetting =>
  typeof value === 'number' && Number.isFinite(value) ? value : '';

const payloadFor = (form: MediaSettingsFormState) => ({
  useOriginalsForLightbox: form.useOriginalsForLightbox,
  thumbnailSmallPx:
    form.thumbnailSmallPx === ''
      ? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailSmallPx
      : form.thumbnailSmallPx,
  thumbnailMediumPx:
    form.thumbnailMediumPx === ''
      ? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailMediumPx
      : form.thumbnailMediumPx,
  thumbnailLargePx:
    form.thumbnailLargePx === ''
      ? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailLargePx
      : form.thumbnailLargePx,
  thumbnailJpegQuality:
    form.thumbnailJpegQuality === ''
      ? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailJpegQuality
      : form.thumbnailJpegQuality,
});

const serverSettingsKey = (settings: ServerSettingsData) =>
  [
    settings.useOriginalsForLightbox,
    settings.thumbnailSmallPx,
    settings.thumbnailMediumPx,
    settings.thumbnailLargePx,
    settings.thumbnailJpegQuality,
  ].join(':');

const ServerCapabilitiesCard = ({
  caps,
  videoAcceleration,
}: {
  caps: MediaCapsInfo;
  videoAcceleration: VideoAccelerationInfo;
}) => (
  <InfoCard
    title="Server Capabilities"
    icon={<ServerIcon />}
    description="Formats and acceleration detected from this server environment."
    footer={<Benchmark />}
  >
    <AdditionalImageFormats caps={caps} />
    <VideoAcceleration info={videoAcceleration} />
  </InfoCard>
);

const AdditionalImageFormats = ({ caps }: { caps: MediaCapsInfo }) => {
  const formats = [
    { label: 'RAW', enabled: caps.raw },
    { label: 'PSD', enabled: caps.psd },
    { label: 'PSB', enabled: caps.psb },
    { label: 'HEIC / HEIF', enabled: caps.heic },
  ];

  return (
    <InfoRow
      label="Image formats"
      description="Camera and design file types PICR can open in addition to JPEG and PNG."
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
  if (info.mode !== 'vaapi') {
    return (
      <InfoRow
        label="Video acceleration"
        description="Uses your graphics hardware to speed up video thumbnails and playback when available."
      >
        <Badge color="gray" variant="outline">
          CPU only
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
      label="Video acceleration"
      description="Uses your graphics hardware to speed up video thumbnails and playback."
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
  const clientUrl = window.location.origin;
  // Usually identical to the server URL (bar a trailing slash); only surface it
  // when it genuinely differs, which hints at a BASE_URL misconfiguration.
  const clientDiffers = normaliseUrl(clientUrl) !== normaliseUrl(server.host);
  return (
    <InfoCard
      title="Server"
      icon={<ServerIcon />}
      description="Where PICR is running and how it's configured."
    >
      {clientDiffers ? (
        <InfoRow
          label="Client URL"
          description="The address you're using in your browser — it differs from the server URL below, which can break share-link previews."
        >
          <Code style={{ wordBreak: 'break-all' }}>{clientUrl}</Code>
        </InfoRow>
      ) : null}
      <InfoRow
        label="Server URL"
        description="The public address used for share links and social previews."
      >
        <Code style={{ wordBreak: 'break-all' }}>{server.host}</Code>
      </InfoRow>
      <InfoRow
        label="Uptime"
        description="How long this process has been running."
      >
        <Code>{formatUptime(server.system.uptimeSeconds)}</Code>
      </InfoRow>
    </InfoCard>
  );
};

// ---------------------------------------------------------------------------
// System / runtime
// ---------------------------------------------------------------------------

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

const SystemCard = ({ system }: { system: ServerInfoData['system'] }) => {
  const metrics = [
    {
      label: 'Platform',
      value: system.platform,
      icon: <SystemIcon />,
    },
    {
      label: 'Memory',
      value: prettyBytes(system.totalMemory),
      icon: <StorageIcon />,
    },
    {
      label: 'Node.js',
      value: system.nodeVersion,
      icon: <ServerIcon />,
    },
    {
      label: 'Database',
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
}) => (
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
        Unavailable
      </Text>
    )}
  </Card>
);

// ---------------------------------------------------------------------------
// Media scanning + inode tracking
// ---------------------------------------------------------------------------

type ScanningInfo = ServerInfoData['scanning'];
type InodeSupportInfo = ServerInfoData['inodeSupport'];
type ScheduledScanStatusInfo = ScanningInfo['scheduledScan'];

// "direct_and_new" -> "Direct And New"
const scanModeLabel = (mode: string) =>
  mode
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDuration = (durationMs: number) => {
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
};

const InodeBadge = ({ status }: { status: string }) => {
  const color =
    status === 'enabled' ? 'green' : status === 'disabled' ? 'red' : 'gray';
  const label =
    status === 'enabled'
      ? 'Enabled'
      : status === 'disabled'
        ? 'Disabled'
        : 'Unknown';
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
};

// The last scheduled scan reads as a short summary line, so it gets a labelled
// top row (when it ran + how long) with the added/changed/moved breakdown on
// its own full-width line beneath, matching the InfoRow description pattern.
const LastScan = ({ status }: { status: ScheduledScanStatusInfo }) => {
  if (!status.lastStartedAt) {
    return (
      <InfoRow label="Last scheduled scan">
        <Text size="sm" c="dimmed">
          Never run
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
          Last scheduled scan
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
          {result.completed ? 'Completed' : 'Unsettled'} after{' '}
          {result.scanPasses} pass{result.scanPasses === 1 ? '' : 'es'} —{' '}
          {result.addedFiles} added, {result.changedFiles} changed, {moved}{' '}
          moved, {removed} removed, {result.skippedEntries} skipped
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
  const scheduled = scanning.scheduledScan;
  return (
    <InfoCard
      title="Media Scanning"
      icon={<ScanIcon />}
      description="How PICR detects new, changed and moved files in your media folder."
    >
      <InfoRow
        label="File watcher"
        description="Watches the media folder for live changes."
      >
        <Code>{scanModeLabel(scanning.fileWatcherMode)}</Code>
      </InfoRow>
      <InfoRow
        label="On-view scan"
        description="Re-checks a folder when someone opens it."
      >
        <Code>{scanModeLabel(scanning.onViewScanMode)}</Code>
      </InfoRow>
      <InfoRow
        label="Scheduled scan"
        description="Periodic full reconcile of the whole library."
      >
        <Badge
          color={scanning.scheduledScanHours > 0 ? 'green' : 'gray'}
          variant="light"
        >
          {scanning.scheduledScanHours > 0
            ? `Every ${scanning.scheduledScanHours}h`
            : 'Off'}
        </Badge>
        {scheduled.running ? (
          <Badge color="blue" variant="light">
            Running
          </Badge>
        ) : null}
        {scheduled.nextScanAt ? (
          <Text size="sm" c="dimmed">
            Next: {prettyDate(scheduled.nextScanAt)}
          </Text>
        ) : null}
      </InfoRow>
      <InfoRow label="Inode tracking" description={inode.reason}>
        <InodeBadge status={inode.status} />
      </InfoRow>
      <LastScan status={scheduled} />
    </InfoCard>
  );
};

// ---------------------------------------------------------------------------
// Benchmark (unchanged behaviour, now rendered inside a card row)
// ---------------------------------------------------------------------------

const Benchmark = () => {
  const [result, runBenchmark] = useMutation(runBenchmarkMutation);
  const benchmark = result.data?.runBenchmark;
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const startBenchmark = () => {
    setConfirmed(true);
    void runBenchmark({});
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
        <BenchmarkIcon /> Run Benchmark
      </Anchor>
      <Modal
        opened={opened}
        onClose={close}
        title="Run Benchmark"
        centered
        closeOnClickOutside={!result.fetching}
        closeOnEscape={!result.fetching}
      >
        <Stack gap="md">
          {!confirmed ? (
            <>
              <Text size="sm">
                This benchmark can take up to a couple of minutes and may use
                significant CPU while it runs. Are you sure you want to
                continue?
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={close}>
                  Cancel
                </Button>
                <Button
                  leftSection={<BenchmarkIcon />}
                  onClick={startBenchmark}
                >
                  Run Benchmark
                </Button>
              </Group>
            </>
          ) : result.fetching ? (
            <Group gap="sm">
              <LoadingIndicator size="small" />
              <Text size="sm">Running benchmark...</Text>
            </Group>
          ) : result.error ? (
            <>
              <Text c="red" size="sm">
                {result.error.message}
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={close}>
                  Close
                </Button>
              </Group>
            </>
          ) : benchmark ? (
            <>
              <Stack gap="xs">
                <BenchmarkResultLine
                  title="PICR Version"
                  value={benchmark.appVersion}
                />
                <BenchmarkResultLine
                  title="Assets"
                  value={`${benchmark.imageCount} images, ${benchmark.videoCount} videos`}
                />
                <BenchmarkResultLine
                  title="Asset Setup (not included in total)"
                  value={<BenchmarkStepValue step={benchmark.assetSetup} />}
                />
                <BenchmarkResultLine
                  title="JPEG Resize"
                  value={<BenchmarkStepValue step={benchmark.jpegResize} />}
                />
                <BenchmarkResultLine
                  title="AVIF Resize"
                  value={<BenchmarkStepValue step={benchmark.avifResize} />}
                />
                <BenchmarkResultLine
                  title="Video Acceleration"
                  value={
                    benchmark.videoAccelerationMode === 'vaapi'
                      ? 'VAAPI'
                      : `CPU only (${benchmark.videoAccelerationReason})`
                  }
                />
                <BenchmarkResultLine
                  title="Video Thumbnail (CPU)"
                  value={
                    <BenchmarkStepValue step={benchmark.videoThumbnailCpu} />
                  }
                />
                <BenchmarkResultLine
                  title="Video Thumbnail (VAAPI)"
                  value={
                    <BenchmarkStepValue
                      step={benchmark.videoThumbnailAccelerated}
                    />
                  }
                />
                <BenchmarkResultLine
                  title="Video Transcode (CPU)"
                  value={
                    <BenchmarkStepValue step={benchmark.videoTranscodeCpu} />
                  }
                />
                <BenchmarkResultLine
                  title="Video Transcode (VAAPI)"
                  value={
                    <BenchmarkStepValue
                      step={benchmark.videoTranscodeAccelerated}
                    />
                  }
                />
                <BenchmarkResultLine
                  title="Total"
                  value={`${formatMs(benchmark.totalMs)} (asset setup excluded)`}
                />
              </Stack>
              <Group justify="flex-end">
                <Button
                  variant="default"
                  leftSection={<ClipboardIcon />}
                  onClick={() => {
                    copyToClipboard(formatBenchmarkResults(benchmark));
                    notifications.show({
                      title: 'Benchmark results copied',
                      message: benchmark.appVersion,
                      icon: <ClipboardIcon />,
                    });
                  }}
                >
                  Copy Results
                </Button>
                <Button onClick={close}>Close</Button>
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
  assetSetup: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  jpegResize: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  avifResize: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  videoAccelerationMode: string;
  videoAccelerationReason: string;
  videoThumbnailCpu: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  videoThumbnailAccelerated: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  videoTranscodeCpu: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  videoTranscodeAccelerated: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  totalMs: number;
};

const formatBenchmarkResults = (benchmark: BenchmarkResultForCopy) => {
  return [
    `PICR Version: ${benchmark.appVersion}`,
    `Assets: ${benchmark.imageCount} images, ${benchmark.videoCount} videos`,
    `Asset Setup (not included in total): ${formatStep(benchmark.assetSetup)}`,
    `JPEG Resize: ${formatStep(benchmark.jpegResize)}`,
    `AVIF Resize: ${formatStep(benchmark.avifResize)}`,
    `Video Acceleration: ${
      benchmark.videoAccelerationMode === 'vaapi'
        ? 'VAAPI'
        : `CPU only (${benchmark.videoAccelerationReason})`
    }`,
    `Video Thumbnail (CPU): ${formatStep(benchmark.videoThumbnailCpu)}`,
    `Video Thumbnail (VAAPI): ${formatStep(benchmark.videoThumbnailAccelerated)}`,
    `Video Transcode (CPU): ${formatStep(benchmark.videoTranscodeCpu)}`,
    `Video Transcode (VAAPI): ${formatStep(benchmark.videoTranscodeAccelerated)}`,
    `Total: ${formatMs(benchmark.totalMs)} (asset setup excluded)`,
  ].join('\n');
};

const formatStep = (step: Pick<BenchmarkStep, 'ms' | 'skippedReason'>) => {
  return step.skippedReason ?? formatMs(step.ms);
};

const BenchmarkStepValue = ({
  step,
}: {
  step: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
}) => {
  if (step.skippedReason) {
    return (
      <Text c="dimmed" size="sm" ta="right">
        {step.skippedReason}
      </Text>
    );
  }
  return <Code>{formatMs(step.ms)}</Code>;
};

const formatMs = (ms?: number | null) => {
  if (ms == null) return 'N/A';
  return `${Math.round(ms).toLocaleString()} ms`;
};
