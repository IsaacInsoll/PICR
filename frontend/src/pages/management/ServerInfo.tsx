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
  Stack,
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
import { useAvifEnabled, useMe } from '../../hooks/useMe';
import {
  BenchmarkIcon,
  CircleCheckFilledIcon,
  CircleXIcon,
  ClipboardIcon,
  GitHubIcon,
  InfoIcon,
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
import type { BenchmarkStep, ServerInfoQueryQuery } from '@shared/gql/graphql';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { useRequery } from '@shared/hooks/useRequery';

type ServerInfoData = NonNullable<ServerInfoQueryQuery['serverInfo']>;

export const ServerInfo = () => {
  const [result, reQuery] = useQuery({ query: serverInfoQuery });
  useRequery(reQuery, 20000);
  const server = result.data?.serverInfo;
  if (!server) return null;
  return (
    <Stack gap="lg" pt="md" pb="xl">
      <Grid columns={5} gap="lg">
        <Grid.Col span={{ base: 5, md: 3 }}>
          <StorageCard disk={server.disk} />
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
      <MediaCard server={server} />
      <ScanningCard scanning={server.scanning} inode={server.inodeSupport} />
      <Grid columns={5} gap="lg">
        <Grid.Col span={{ base: 5, md: 3 }}>
          <ServerCard server={server} />
        </Grid.Col>
        <Grid.Col span={{ base: 5, md: 2 }}>
          <SystemCard system={server.system} />
        </Grid.Col>
      </Grid>
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
  const isLatest = latest === version;
  const versionColor = developmentBuildSha
    ? 'yellow'
    : isLatest
      ? 'green'
      : 'red';

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
        ) : isLatest ? (
          <Badge color="green" variant="light">
            Up to date
          </Badge>
        ) : (
          <Badge color="red" variant="light">
            Update available
          </Badge>
        )}
      </InfoRow>
      {!isLatest && !developmentBuildSha ? (
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

const StorageCard = ({ disk }: { disk: ServerInfoData['disk'] }) => (
  <InfoCard
    title="Storage"
    icon={<StorageIcon />}
    description="Disk space used by your original photos and the thumbnails PICR generates."
    footer={<TreesizeLink />}
  >
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

const MediaCard = ({ server }: { server: ServerInfoData }) => (
  <InfoCard
    title="Media & Performance"
    icon={<VideoMetadataIcon />}
    description="Extra photo and video formats this server can process, plus hardware acceleration for video."
    footer={<Benchmark />}
  >
    <AdditionalImageFormats caps={server.mediaCaps} />
    <Suspense fallback={<AvifRowFallback />}>
      <AvifEnabled />
    </Suspense>
    <VideoAcceleration info={server.videoAcceleration} />
  </InfoCard>
);

const AvifEnabled = () => {
  const avif = useAvifEnabled();
  return (
    <InfoRow
      label="AVIF thumbnails"
      description="A modern image format for smaller, sharper thumbnails."
    >
      <BoolValue value={avif} />
    </InfoRow>
  );
};

const AvifRowFallback = () => (
  <InfoRow label="AVIF thumbnails">
    <LoadingIndicator size="small" />
  </InfoRow>
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
        label="Can write"
        description="Whether PICR is allowed to make changes to your photo folders."
      >
        <BoolValue value={server.canWrite} />
      </InfoRow>
      <InfoRow
        label="File polling"
        description="Re-scans folders on a timer instead of watching for changes. Needed on some NAS and network drives."
      >
        <BoolValue value={server.usePolling} />
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

const SystemCard = ({ system }: { system: ServerInfoData['system'] }) => (
  <InfoCard
    title="System"
    icon={<SystemIcon />}
    description="The runtime and media tools this server is using."
  >
    <InfoRow label="Uptime">
      <Code>{formatUptime(system.uptimeSeconds)}</Code>
    </InfoRow>
    <InfoRow label="Platform">
      <Code>{system.platform}</Code>
    </InfoRow>
    <InfoRow label="Memory">
      <Code>{prettyBytes(system.totalMemory)}</Code>
    </InfoRow>
    <InfoRow label="Node.js">
      <Code>{system.nodeVersion}</Code>
    </InfoRow>
    {system.databaseVersion ? (
      <InfoRow label="Database">
        <Code>{system.databaseVersion}</Code>
      </InfoRow>
    ) : null}
    {system.ffmpegVersion ? (
      <InfoRow label="ffmpeg">
        <Code>{system.ffmpegVersion}</Code>
      </InfoRow>
    ) : null}
    {system.imageMagickVersion ? (
      <InfoRow label="ImageMagick">
        <Code>{system.imageMagickVersion}</Code>
      </InfoRow>
    ) : null}
  </InfoCard>
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
