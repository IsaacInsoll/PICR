import { gql } from '../../helpers/gql';
import { useQuery } from 'urql';
import { Anchor, Code, Group, Table } from '@mantine/core';
import { FaGithub } from 'react-icons/fa6';
import { ReactNode } from 'react';
import prettyBytes from 'pretty-bytes';

export const ServerInfo = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const data = result?.data?.serverInfo;
  console.log(data);
  return (
    <Table striped highlightOnHover withTableBorder>
      <TableHeader />
      <Table.Tbody>
        <Version version={data.version} />
        <Row title="Client URL">{window.location.origin}</Row>
        <Row title="Server URL">{data.host}</Row>
        <Row title="Media Size">{prettyBytes(data.mediaSize)}</Row>
        <Row title="Cache Size">{prettyBytes(data.cacheSize)}</Row>
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

const Version = ({ version }) => {
  return (
    <Row title="PICR Version">
      <Code>{version}</Code>
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
      databaseUrl
      dev
      usePolling
      cacheSize
      mediaSize
      host
    }
  }
`);
