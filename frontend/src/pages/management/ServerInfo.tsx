import { useMutation, useQuery } from 'urql';
import {
  Anchor,
  Badge,
  Button,
  Code,
  Group,
  Modal,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { prettyBytes } from '@shared/prettyBytes';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useAvifEnabled, useMe } from '../../hooks/useMe';
import {
  BenchmarkIcon,
  ClipboardIcon,
  GitHubIcon,
  StorageIcon,
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

export const ServerInfo = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const server = result.data?.serverInfo;
  if (!server) return null;
  return (
    <Table striped highlightOnHover withTableBorder>
      <TableHeader />
      <Table.Tbody>
        <Version
          version={server.version}
          latest={server.latest}
          developmentBuildSha={server.developmentBuildSha}
        />
        <Row title="Client URL">{window.location.origin}</Row>
        <Row title="Server URL">{server.host}</Row>
        <Suspense fallback={<StorageUsageLoading />}>
          <ServerFolderSize />
        </Suspense>

        <Row title="Database URL">
          <Code>{server.databaseUrl}</Code>
        </Row>
        <Row title="Dev Mode">
          <Bool value={server.dev} />
        </Row>
        <Row title="Use Polling">
          <Bool value={server.usePolling} />
        </Row>
        <Row title="Can write">
          <Bool value={server.canWrite} />
        </Row>
        <Suspense>
          <AvifEnabled />
        </Suspense>
        <AdditionalImageFormats caps={server.mediaCaps} />
        <VideoAcceleration info={server.videoAcceleration} />
        <Benchmark />
      </Table.Tbody>
    </Table>
  );
};

const AvifEnabled = () => {
  const avif = useAvifEnabled();
  return (
    <Row title="AVIF Enabled">
      <Bool value={avif} />
    </Row>
  );
};

type VideoAccelerationInfo = NonNullable<
  ServerInfoQueryQuery['serverInfo']
>['videoAcceleration'];

type MediaCapsInfo = NonNullable<
  ServerInfoQueryQuery['serverInfo']
>['mediaCaps'];

const AdditionalImageFormats = ({ caps }: { caps: MediaCapsInfo }) => {
  const formats = [
    { label: 'RAW', enabled: caps.raw },
    { label: 'PSD', enabled: caps.psd },
    { label: 'PSB', enabled: caps.psb },
    { label: 'HEIC / HEIF', enabled: caps.heic },
  ];

  return (
    <Row title="Additional Image Formats">
      {formats.map((format) => (
        <Badge
          key={format.label}
          color={format.enabled ? 'green' : 'gray'}
          variant={format.enabled ? 'light' : 'outline'}
        >
          {format.label}
        </Badge>
      ))}
    </Row>
  );
};

const VideoAcceleration = ({ info }: { info: VideoAccelerationInfo }) => {
  const active = info.mode === 'vaapi';
  return (
    <Row title="Video Acceleration">
      <Code c={active ? 'green' : 'dimmed'}>
        {active ? 'VAAPI' : 'CPU only'}
      </Code>
      {active ? (
        <Text size="sm">
          {[info.driver, info.codecs.join(', ')].filter(Boolean).join(' — ')}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          {info.reason}
        </Text>
      )}
    </Row>
  );
};

const Version = ({
  version,
  latest,
  developmentBuildSha,
}: {
  version: string;
  latest: string;
  developmentBuildSha?: string | null;
}) => {
  const isLatest = latest === version;
  const versionColor = developmentBuildSha
    ? 'yellow'
    : isLatest
      ? 'green'
      : 'red';

  return (
    <>
      <Row title="PICR Version">
        <Code c={versionColor}>{version}</Code>
        {!isLatest ? (
          <>
            Latest: <Code>{latest}</Code>
          </>
        ) : null}
        <Anchor
          href="https://github.com/IsaacInsoll/PICR/releases"
          size="xs"
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIcon /> View PICR Releases
        </Anchor>
      </Row>
      {developmentBuildSha ? (
        <Row title="Development Build">
          <Code c="yellow">{developmentBuildSha}</Code>
        </Row>
      ) : null}
    </>
  );
};

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

const Bool = ({ value }: { value?: boolean }) => {
  return <Code c={value ? 'green' : 'red'}>{value ? 'YES' : 'NO'}</Code>;
};

const Row = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <Table.Tr>
      <Table.Td>{title}</Table.Td>
      <Table.Td>
        <Group gap="md">{children}</Group>
      </Table.Td>
    </Table.Tr>
  );
};

const TableHeader = () => {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Property</Table.Th>
        <Table.Th>Value</Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
};

const ServerFolderSize = () => {
  const [requested, setRequested] = useState(false);
  const [result] = useQuery({
    query: expensiveServerFileSizeQuery,
    pause: !requested,
  });
  const server = result.data?.serverInfo;
  if (!requested) {
    return (
      <Row title="Storage Usage">
        <Button
          size="xs"
          variant="light"
          leftSection={<StorageIcon />}
          onClick={() => setRequested(true)}
        >
          Calculate
        </Button>
        <TreesizeLink />
      </Row>
    );
  }
  if (!server) return null;
  return (
    <Row title="Storage Usage">
      <Text size="sm">Media: {prettyBytes(server.mediaSize)}</Text>
      <Text size="sm">Cache: {prettyBytes(server.cacheSize)}</Text>
      <TreesizeLink />
    </Row>
  );
};

const StorageUsageLoading = () => (
  <Row title="Storage Usage">
    <LoadingIndicator size="small" />
    <Text size="sm" c="dimmed">
      Calculating...
    </Text>
  </Row>
);

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
    <Row title="Benchmark">
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
    </Row>
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
