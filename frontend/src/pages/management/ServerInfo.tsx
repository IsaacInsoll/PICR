import { useMutation, useQuery } from 'urql';
import {
  Anchor,
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
import type { BenchmarkStep } from '@shared/gql/graphql';
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
        <Suspense
          fallback={
            <>
              <Row title="Media Size">
                <LoadingIndicator size="small" />
                <TreesizeLink />
              </Row>
              <Row title="Cache Size">
                <LoadingIndicator size="small" />
              </Row>
            </>
          }
        >
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
  const [result] = useQuery({ query: expensiveServerFileSizeQuery });
  const server = result.data?.serverInfo;
  if (!server) return null;
  return (
    <>
      <Row title="Media Size">
        {prettyBytes(server.mediaSize)}
        <TreesizeLink />
      </Row>
      <Row title="Cache Size">{prettyBytes(server.cacheSize)}</Row>
    </>
  );
};

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
                  title="Video Thumbnails"
                  value={<BenchmarkStepValue step={benchmark.videoThumbnail} />}
                />
                <BenchmarkResultLine
                  title="Video Transcode"
                  value={<BenchmarkStepValue step={benchmark.videoTranscode} />}
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
  videoThumbnail: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  videoTranscode: Pick<BenchmarkStep, 'ms' | 'skippedReason'>;
  totalMs: number;
};

const formatBenchmarkResults = (benchmark: BenchmarkResultForCopy) => {
  return [
    `PICR Version: ${benchmark.appVersion}`,
    `Assets: ${benchmark.imageCount} images, ${benchmark.videoCount} videos`,
    `Asset Setup (not included in total): ${formatStep(benchmark.assetSetup)}`,
    `JPEG Resize: ${formatStep(benchmark.jpegResize)}`,
    `AVIF Resize: ${formatStep(benchmark.avifResize)}`,
    `Video Thumbnails: ${formatStep(benchmark.videoThumbnail)}`,
    `Video Transcode: ${formatStep(benchmark.videoTranscode)}`,
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
