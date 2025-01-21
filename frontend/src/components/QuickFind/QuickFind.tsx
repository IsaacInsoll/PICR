import { useDebouncedValue, useHotkeys } from '@mantine/hooks';
import {
  Alert,
  Button,
  ButtonProps,
  Code,
  Divider,
  Drawer,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { useMe } from '../../hooks/useMe';
import { MinimalFolder } from '../../../types';
import { atom, useAtomValue } from 'jotai';
import { useAtom, useSetAtom } from 'jotai/index';
import { Suspense, useEffect, useRef, useState } from 'react';
import { LoadingIndicator } from '../LoadingIndicator';
import { useQuery } from 'urql';
import { PrettyFolderPath } from '../PrettyFolderPath';
import { useSetFolder } from '../../hooks/useSetFolder';
import { InfoIcon } from '../../PicrIcons';
import { Joiner } from '../FolderName';
import { searchQuery } from '../searchQuery';
import { useQuickFind } from './useQuickFind';

type Scope = 'all' | 'current';
type ScopeType = 'all' | 'file' | 'folder';
const scopeAtom = atom<Scope>('current');
const scopeTypeAtom = atom<ScopeType>('all');
const queryAtom = atom('');

export const QuickFind = ({ folder }: { folder?: MinimalFolder }) => {
  const [opened, setOpened] = useQuickFind();
  const [query, setQuery] = useAtom(queryAtom);
  const ref = useRef<HTMLInputElement | null>(null);

  const toggle = () => setOpened((o) => !o);
  const close = () => setOpened(false);

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
  }, [opened]);

  // "select all" the textbox when opened (IE: existing query)
  useEffect(() => {
    if (opened && ref.current) {
      ref.current.select();
    }
  }, [opened]);

  return (
    <>
      <Drawer
        opened={opened}
        keepMounted={true} // because of select all
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
            style={{ flexGrow: 1 }}
            ref={ref}
            value={query}
            data-autofocus
            onChange={(e) => {
              if (e.nativeEvent.data == '`') return; //don't allow entry of the backtick
              setQuery(e.target.value);
            }}
            // size="lg"
          />
          <Suspense fallback={<LoadingIndicator />}>
            <Results folder={folder} close={close} />
          </Suspense>
        </Stack>
      </Drawer>
    </>
  );
};

const Results = ({ folder, close }: { folder?: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const me = useMe();
  const query = useAtomValue(queryAtom);
  const scope = useAtomValue(scopeAtom);
  const type = useAtomValue(scopeTypeAtom);
  const folderId = scope == 'all' || !folder?.id ? me.folderId : folder.id;
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [index, setIndex] = useState<number | null>(null);

  // if query = '' return nothing
  const [results] = useQuery({
    query: searchQuery,
    variables: { query: debouncedQuery, folderId },
    pause: debouncedQuery == '',
  });
  const folders = results.data?.searchFolders ?? [];
  const files = results.data?.searchFiles ?? [];

  const list =
    type == 'all' ? [...folders, ...files] : type == 'file' ? files : folders;

  const handleClick = (e, folder, file) => {
    close();
    e?.preventDefault();
    e?.stopPropagation();
    setFolder(folder, file);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.code == 'ArrowUp') {
        e.stopPropagation();
        setIndex((i) => {
          return i > 0 ? i - 1 : null;
        });
      }
      if (e.code == 'ArrowDown') {
        e.stopPropagation();
        setIndex((i) =>
          i == null ? 0 : i >= list.length - 1 ? list.length - 1 : i + 1,
        );
      }
      if (e.code == 'Enter') {
        const item = list[index];
        if (item['__typename'] == 'Folder') {
          handleClick(e, item);
        } else {
          handleClick(e, item.folder, item);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  });
  if (!debouncedQuery) return;

  return (
    <Stack gap={0}>
      {list?.map((item, i) => {
        if (item['__typename'] == 'Folder') {
          return (
            <ResultButton
              key={'folder' + item.id}
              onClick={(e) => handleClick(e, item)}
              onMouseOver={() => setIndex(i)}
              selected={i == index}
            >
              <PrettyFolderPath
                folder={item}
                onClick={(e) => handleClick(e, item)}
              />
            </ResultButton>
          );
        }
        const file = item;
        return (
          <ResultButton
            key={file.id}
            onClick={(e) => handleClick(e, file.folder, file)}
            onMouseOver={() => setIndex(i)}
            selected={i == index}
          >
            <PrettyFilePath file={file} />
          </ResultButton>
        );
      })}

      <QuickFindFooter
        totalFiles={files.length}
        totalFolders={folders.length}
        inHomeFolder={scope == 'current' && folderId !== me?.folderId}
      />
    </Stack>
  );
};

const PrettyFilePath = ({ file, handleClick }) => {
  const folder = file.folder;
  return (
    <Group
      onClick={(e) => handleClick(e, folder, file)}
      style={{ cursor: 'pointer' }}
      gap={1}
    >
      <Code onClick={(e) => handleClick(e, folder)}>{file.folder.name}</Code>
      <Joiner />
      <Code color="green.7" onClick={(e) => handleClick(e, folder, file)}>
        {file.name}
      </Code>
    </Group>
  );
};

const ResultButton = ({
  selected,
  children,
  ...props
}: { selected: boolean } & ButtonProps) => {
  return (
    <>
      <Button
        style={!selected ? { backgroundColor: 'transparent' } : undefined}
        variant={selected ? 'light' : 'subtle'}
        fullWidth
        justify="left"
        {...props}
      >
        {children}
      </Button>
      <Divider opacity={0.25} />
    </>
  );
};

const QuickFindFooter = ({
  totalFolders,
  totalFiles,
  inHomeFolder,
}: {
  totalFiles: number;
  totalFolders: number;
  inHomeFolder: boolean;
}) => {
  const setSelectedScope = useSetAtom(scopeAtom);
  const total = totalFiles + totalFolders;
  const moreResults = totalFiles == 100 || totalFolders == 100;
  return (
    <Stack p="lg">
      <Group gap="md">
        {total == 0 ? (
          <Alert
            variant="transparent"
            color="orange"
            title="Nothing found"
            m="sm"
            p="sm"
            icon={<InfoIcon />}
          />
        ) : null}
        {inHomeFolder ? (
          <Button
            variant="outline"
            onClick={() => setSelectedScope('all')}
            size="xs"
            color="orange"
          >
            Search all Folders
          </Button>
        ) : null}
      </Group>
      {moreResults ? (
        <Alert
          variant="light"
          color="orange"
          title="Search Limit Reached"
          icon={<InfoIcon />}
        >
          Results are limited to 100 files and folders. Use a more specific
          search.
        </Alert>
      ) : null}
    </Stack>
  );
};

const ScopeSelector = ({ folder }: { folder?: MinimalFolder }) => {
  const me = useMe();

  //if we are in root folder, no point specifying "this or all folders"
  if (me.folderId == folder?.id) return null;

  const [selectedScope, setSelectedScope] = useAtom(scopeAtom);
  return (
    <SegmentedControl
      value={selectedScope}
      onChange={setSelectedScope}
      data={[
        { label: folder?.name ?? 'This Folder', value: 'current' },
        { label: 'All Folders', value: 'all' },
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
        { label: 'Files', value: 'file' },
        { label: 'Folders', value: 'folder' },
      ]}
    />
  );
};
