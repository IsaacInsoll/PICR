import { useQuery } from 'urql';
import { Anchor, Code, Group, Table } from '@mantine/core';
import { ReactNode, Suspense } from 'react';
import { prettyBytes } from '@shared/prettyBytes';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useAvifEnabled, useMe } from '../../hooks/useMe';
import { GitHubIcon, StorageIcon } from '../../PicrIcons';
import { PicrLink } from '../../components/PicrLink';
import {
  expensiveServerFileSizeQuery,
  serverInfoQuery,
} from '@shared/urql/queries/serverInfoQuery';

export const ServerInfo = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const server = result?.data?.serverInfo;
  if (!server) return null;
  return (
    <Table striped highlightOnHover withTableBorder>
      <TableHeader />
      <Table.Tbody>
        <Version version={server.version} latest={server.latest} />
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

const Version = ({ version, latest }: { version: string; latest: string }) => {
  const isLatest = latest == version;
  return (
    <Row title="PICR Version">
      <Code c={isLatest ? 'green' : 'red'}>{version}</Code>
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
  const server = result?.data?.serverInfo;
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
