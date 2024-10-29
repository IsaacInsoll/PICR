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
  Alert,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useMe } from '../hooks/useMe';
import { MinimalFolder } from '../../types';
import { atom, useAtomValue } from 'jotai';
import { useAtom } from 'jotai/index';
import { Suspense, useEffect, useState } from 'react';
import { LoadingIndicator } from './LoadingIndicator';
import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { PrettyFolderPath } from './PrettyFolderPath';
import { useSetFolder } from '../hooks/useSetFolder';
import { InfoIcon } from '../PicrIcons';
import { Joiner } from './FolderName';

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

  //TODO: if activating: turn off modals (EG: comments modal, full screen image view
  // or don't allow it to activate while they are up because it's shit UI to open up underneath

  useEffect(() => {
    const handler = (e) => {
      if (e.code == 'Backquote') {
        toggle();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [toggle]);

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
            onChange={(e) => {
              if (e.nativeEvent.data == '`') return; //don't allow entry of the backtick
              setQuery(e.target.value);
            }}
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
  const files = results.data?.searchFiles;

  const handleClick = (e, folder, file) => {
    e.preventDefault();
    e.stopPropagation();
    setFolder(folder, file);
  };

  return (
    <Stack>
      {folders?.map((f) => (
        <Box key={f.id}>
          <Box onClick={(e) => handleClick(e, f)} style={{ cursor: 'pointer' }}>
            <PrettyFolderPath folder={f} onClick={(e) => handleClick(e, f)} />
          </Box>
          <Div />
        </Box>
      ))}
      {files?.map((file) => (
        <Box key={file.id} onClick={(e) => handleClick(e, file.folder, file)}>
          <Group
            onClick={(e) => handleClick(e, file.folder, file)}
            style={{ cursor: 'pointer' }}
            gap={1}
          >
            <Code onClick={(e) => handleClick(e, file.folder)}>
              {file.folder.name}
            </Code>
            <Joiner />
            <Code
              color="green.7"
              onClick={(e) => handleClick(e, file.folder, file)}
            >
              {file.name}
            </Code>
          </Group>
          <Div />
        </Box>
      ))}

      <Group gap="md">
        {folders?.length == 0 && files?.length == 0 ? (
          <Alert
            variant="transparent"
            color="orange"
            title="Nothing found"
            m="sm"
            p="sm"
            icon={<InfoIcon />}
          />
        ) : null}
        {scope !== 'all' ? (
          <Button
            variant="outline"
            onClick={() => setScope('all')}
            size="xs"
            color="orange"
          >
            Search all Folders
          </Button>
        ) : null}
      </Group>
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
    searchFiles(folderId: $folderId, query: $query) {
      ...FileFragment
      folder {
        ...MinimumFolderFragment
      }
    }
  }
`);
