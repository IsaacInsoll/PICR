import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import {
  Drawer,
  Button,
  SegmentedControl,
  Group,
  Code,
  TextInput,
  Stack,
  Divider,
  Box,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useMe } from '../hooks/useMe';
import { MinimalFolder } from '../../types';
import { atom, useAtomValue } from 'jotai';
import { useAtom } from 'jotai/index';
import { Suspense, useState } from 'react';
import { LoadingIndicator } from './LoadingIndicator';
import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { PrettyFolderPath } from './PrettyFolderPath';
import { useSetFolder } from '../hooks/useSetFolder';

type Scope = 'all' | 'current' | 'subfolders';
type ScopeType = 'all' | 'file' | 'folder';
const scopeAtom = atom<Scope>('current');
const scopeTypeAtom = atom<ScopeType>('all');
const queryAtom = atom('');
export const QuickFind = ({ folder }: { folder?: MinimalFolder }) => {
  const me = useMe();
  const [opened, { open, close, toggle }] = useDisclosure(false);
  const [query, setQuery] = useAtom(queryAtom);

  useHotkeys([['ctrl+f', () => toggle()]]);
  return (
    <>
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group justify="space-between">
            <ScopeSelector folder={folder} />
            <TypeSelector />
          </Group>
        }
        position="top"
      >
        <Stack>
          <TextInput
            value={query}
            data-autofocus
            onChange={(e) => setQuery(e.target.value)}
            // size="lg"
          />
          <Suspense fallback={<LoadingIndicator />}>
            <Results folder={folder} />
          </Suspense>
        </Stack>
      </Drawer>
    </>
  );
};

const Results = ({ folder }: { folder?: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const me = useMe();
  const query = useAtomValue(queryAtom);
  const [scope, setScope] = useAtom(scopeAtom);
  const type = useAtomValue(scopeTypeAtom);
  const folderId = scope == 'all' || !folder.id ? me.folderId : folder.id;
  const [debouncedQuery] = useDebouncedValue(query, 200);
  // if query = '' return nothing
  const [results] = useQuery({
    query: searchQuery,
    variables: { query: debouncedQuery, folderId },
    pause: debouncedQuery == '',
  });
  if (!debouncedQuery) return;
  const folders = results.data?.searchFolders;

  return (
    <Stack>
      {folders.map((f) => (
        <Box key={f.id}>
          <Box onClick={() => setFolder(f)} style={{ cursor: 'pointer' }}>
            <PrettyFolderPath folder={f} onClick={setFolder} />
          </Box>
          <Div />
        </Box>
      ))}
      {folders.length == 0 ? (
        <Group gap="md">
          <>Nothing Found</>
          {scope !== 'all' ? (
            <Button variant="subtle" onClick={() => setScope('all')}>
              Search all Folders
            </Button>
          ) : null}
        </Group>
      ) : null}
    </Stack>
  );
};

const Div = () => <Divider mt="md" opacity={0.25} />;

const ScopeSelector = ({ folder }: { folder?: MinimalFolder }) => {
  const [selectedScope, setSelectedScope] = useAtom(scopeAtom);
  return (
    <SegmentedControl
      value={selectedScope}
      onChange={setSelectedScope}
      data={[
        { label: folder?.name ?? 'This Folder', value: 'current' },
        { label: 'All Folders', value: 'all' },
        // {
        //   label: folder?.name
        //     ? folder.name + ' + subfolders'
        //     : 'This Folder + subfolders',
        //   value: 'subfolders',
        // },
      ]}
    />
  );
};
const TypeSelector = () => {
  const [selectedType, setSelectedType] = useAtom(scopeTypeAtom);
  return (
    <SegmentedControl
      value={selectedType}
      onChange={setSelectedType}
      data={[
        { label: 'Everything', value: 'all' },
        { label: 'Files', value: 'files' },
        { label: 'Folders', value: 'folders' },
      ]}
    />
  );
};

const searchQuery = gql(/* GraphQL */ `
  query searchQuery($folderId: ID!, $query: String!) {
    searchFolders(folderId: $folderId, query: $query) {
      ...FolderFragment
    }
  }
`);
