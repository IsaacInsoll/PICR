import { gql } from '../../helpers/gql';
import { useQuery } from 'urql';
import { Anchor, Code, Group, Table } from '@mantine/core';
import { FaGithub } from 'react-icons/fa6';
import { ReactNode, Suspense } from 'react';
import prettyBytes from 'pretty-bytes';
import { data } from 'react-router';
import { LoadingIndicator } from '../../components/LoadingIndicator';

export const ServerInfo = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const data = result?.data?.serverInfo;
  return (
    <Table striped highlightOnHover withTableBorder>
      <TableHeader />
      <Table.Tbody>
        <Version version={data.version} latest={data.latest} />
        <Row title="Client URL">{window.location.origin}</Row>
        <Row title="Server URL">{data.host}</Row>
        <Suspense
          fallback={
            <>
              <Row title="Media Size">
                <LoadingIndicator size="small" />
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
          <Code>{data.databaseUrl}</Code>
        </Row>
        <Row title="Dev Mode">
          <Bool value={data.dev} />
        </Row>
        <Row title="Use Polling">
          <Bool value={data.usePolling} />
        </Row>
      </Table.Tbody>
    </Table>
  );
};

const Version = ({ version, latest }) => {
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
      >
        <FaGithub /> View PICR Releases
      </Anchor>
    </Row>
  );
};

const Bool = ({ value }: { value: boolean }) => {
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

const serverInfoQuery = gql(/* GraphQL */ `
  query serverInfoQuery {
    serverInfo {
      version
      latest
      databaseUrl
      dev
      usePolling
      #      cacheSize
      #      mediaSize
      host
    }
  }
`);

const expensiveServerFileSizeQuery = gql(/* GraphQL */ `
  query expensiveServerFileSizeQuery {
    serverInfo {
      cacheSize
      mediaSize
    }
  }
`);

const ServerFolderSize = () => {
  const [result] = useQuery({ query: expensiveServerFileSizeQuery });
  console.log(result);
  return (
    <>
      <Row title="Media Size">
        {prettyBytes(result?.data?.serverInfo.mediaSize)}
      </Row>
      <Row title="Cache Size">
        {prettyBytes(result?.data?.serverInfo.cacheSize)}
      </Row>
    </>
  );
};
