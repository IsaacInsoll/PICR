import { useDebouncedValue, useHotkeys } from '@mantine/hooks';
import { normalizeDisplayName } from '@shared/displayName';
import {
  Alert,
  Button,
  Code,
  Divider,
  Drawer,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { useMe } from '../../hooks/useMe';
import type { PicrFolder } from '@shared/types/picr';
import type { AppSearchFileFragmentFragment } from '@shared/gql/graphql';
import { atom, useAtomValue, useAtom, useSetAtom } from 'jotai';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { LoadingIndicator } from '../LoadingIndicator';
import { useQuery } from 'urql';
import { PrettyFolderPath } from '../PrettyFolderPath';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useSelectedFileId } from '../../hooks/useSelectedFileId';
import { InfoIcon } from '../../PicrIcons';
import { Joiner } from '../FolderName';
import { useQuickFind } from './useQuickFind';
import { searchQuery } from '@shared/urql/queries/searchQuery';
import type { SearchResultType } from '@shared/search/searchResults';
import {
  buildSearchResultList,
  getSearchResultMeta,
  isFolderResult,
} from '@shared/search/searchResults';
import { useTranslation } from 'react-i18next';

type Scope = 'all' | 'current';
const scopeAtom = atom<Scope>('current');
const scopeTypeAtom = atom<SearchResultType>('all');
// Exported so other surfaces (e.g. the dashboard search box) can pre-fill the
// query before opening QuickFind.
export const quickFindQueryAtom = atom('');

export const QuickFind = ({ folder }: { folder?: PicrFolder }) => {
  const { t } = useTranslation('admin');
  const [opened, setOpened] = useQuickFind();
  const [query, setQuery] = useAtom(quickFindQueryAtom);
  const ref = useRef<HTMLInputElement | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable enough for this global keybinding usage
  const toggle = () => setOpened((o) => !o);
  const close = () => setOpened(false);

  useHotkeys([['ctrl+f', () => toggle()]]);

  //TODO: if activating: turn off modals (EG: comments modal, full screen image view
  // or don't allow it to activate while they are up because it's shit UI to open up underneath

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') {
        toggle();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [opened, toggle]);

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
            placeholder={t('quickFind.placeholder')}
            onChange={(e) => {
              const nativeEvent = e.nativeEvent as InputEvent;
              if (nativeEvent.data === '`') return; //don't allow entry of the backtick
              setQuery(e.currentTarget.value);
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

const Results = ({
  folder,
  close,
}: {
  folder?: PicrFolder;
  close: () => void;
}) => {
  const setFolder = useSetFolder();
  const setSelectedFileId = useSelectedFileId(folder?.id ?? '');
  const me = useMe();
  const query = useAtomValue(quickFindQueryAtom);
  const scope = useAtomValue(scopeAtom);
  const type = useAtomValue(scopeTypeAtom);
  const folderId = scope === 'all' || !folder?.id ? me?.folderId : folder.id;
  const queryFolderId = folderId as string;
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [index, setIndex] = useState<number | null>(null);

  // if query = '' return nothing
  const [results] = useQuery({
    query: searchQuery,
    variables: { query: debouncedQuery, folderId: queryFolderId },
    pause: debouncedQuery === '' || !folderId,
  });

  const folders = results.data?.searchFolders ?? [];
  const files = results.data?.searchFiles ?? [];

  const list = buildSearchResultList(files, folders, type);
  const { totalFiles, totalFolders, moreResults } = getSearchResultMeta(
    files,
    folders,
  );

  const handleClick = (
    e: React.MouseEvent | KeyboardEvent | undefined,
    targetFolder: PicrFolder,
    file?: AppSearchFileFragmentFragment,
  ) => {
    close();
    e?.preventDefault();
    e?.stopPropagation();
    // A hit in the folder we're already viewing is indistinguishable from opening
    // that file out of the listing behind the drawer, so it gets the marked push
    // and closing pops back to the folder.
    //
    // A hit in a *different* folder deliberately does not: closing should leave the
    // viewer in the folder the file actually lives in (so they can keep browsing it),
    // with back returning to where they searched from. The unmarked push plus the
    // hook's replace-on-close fallback gives exactly that.
    if (file && folder?.id && targetFolder.id === folder.id) {
      setSelectedFileId(file.id);
    } else {
      setFolder(targetFolder, file);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') {
        e.stopPropagation();
        setIndex((i) => {
          if (i == null) return null;
          return i > 0 ? i - 1 : null;
        });
      }
      if (e.code === 'ArrowDown') {
        e.stopPropagation();
        setIndex((i) =>
          i == null ? 0 : i >= list.length - 1 ? list.length - 1 : i + 1,
        );
      }
      if (e.code === 'Enter') {
        if (index == null) return;
        const item = list[index];
        if (isFolderResult(item)) {
          handleClick(e, item);
        } else {
          if (!item.folder) return;
          handleClick(e, item.folder, item);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  });
  if (!folderId || !debouncedQuery) return null;

  return (
    <Stack gap={0}>
      {list.map((item, i) => {
        if (isFolderResult(item)) {
          return (
            <ResultButton
              key={'folder' + item.id}
              onClick={(e: React.MouseEvent) => handleClick(e, item)}
              onMouseOver={() => setIndex(i)}
              selected={i === index}
            >
              <PrettyFolderPath
                folder={item}
                onClick={(e: React.MouseEvent) => handleClick(e, item)}
              />
            </ResultButton>
          );
        }
        const file = item;
        if (!file.folder) return null;
        const fileFolder = file.folder;
        return (
          <ResultButton
            key={file.id}
            onClick={(e: React.MouseEvent) => handleClick(e, fileFolder, file)}
            onMouseOver={() => setIndex(i)}
            selected={i === index}
          >
            <PrettyFilePath file={file} handleClick={handleClick} />
          </ResultButton>
        );
      })}

      <QuickFindFooter
        totalFiles={totalFiles}
        totalFolders={totalFolders}
        moreResults={moreResults}
        inHomeFolder={scope === 'current' && folderId !== me?.folderId}
      />
    </Stack>
  );
};

const PrettyFilePath = ({
  file,
  handleClick,
}: {
  file: AppSearchFileFragmentFragment;
  handleClick: (
    e: React.MouseEvent | KeyboardEvent | undefined,
    folder: PicrFolder,
    file?: AppSearchFileFragmentFragment,
  ) => void;
}) => {
  const folder = file.folder;
  if (!folder) return null;
  return (
    <Group
      onClick={(e) => handleClick(e, folder, file)}
      style={{ cursor: 'pointer' }}
      gap={1}
    >
      <Code onClick={(e) => handleClick(e, folder)}>
        {normalizeDisplayName(folder.name)}
      </Code>
      <Joiner />
      <Code color="green.7" onClick={(e) => handleClick(e, folder, file)}>
        {normalizeDisplayName(file.name)}
      </Code>
    </Group>
  );
};

const ResultButton = ({
  selected,
  children,
  onClick,
  onMouseOver,
  ...props
}: {
  selected: boolean;
  children: ReactNode;
  onClick?: (e: MouseEvent) => void;
  onMouseOver?: () => void;
  style?: CSSProperties;
}) => {
  return (
    <>
      <Button
        onClick={onClick}
        onMouseOver={onMouseOver}
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
  moreResults,
  inHomeFolder,
}: {
  totalFiles: number;
  totalFolders: number;
  moreResults: boolean;
  inHomeFolder: boolean;
}) => {
  const { t } = useTranslation('admin');
  const setSelectedScope = useSetAtom(scopeAtom);
  const total = totalFiles + totalFolders;
  return (
    <Stack p="lg">
      <Group gap="md">
        {total === 0 ? (
          <Alert
            variant="transparent"
            color="orange"
            title={t('quickFind.empty')}
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
            {t('quickFind.searchAllFolders')}
          </Button>
        ) : null}
      </Group>
      {moreResults ? (
        <Alert
          variant="light"
          color="orange"
          title={t('quickFind.limit.title')}
          icon={<InfoIcon />}
        >
          {t('quickFind.limit.description')}
        </Alert>
      ) : null}
    </Stack>
  );
};

const ScopeSelector = ({ folder }: { folder?: PicrFolder }) => {
  const { t } = useTranslation('admin');
  const me = useMe();
  const [selectedScope, setSelectedScope] = useAtom(scopeAtom);

  //if we are in root folder, no point specifying "this or all folders"
  if (me?.folderId === folder?.id) return null;

  return (
    <SegmentedControl
      value={selectedScope}
      onChange={(next) => setSelectedScope(next as Scope)}
      data={[
        {
          label: folder?.name ?? t('quickFind.scope.current'),
          value: 'current',
        },
        { label: t('quickFind.scope.all'), value: 'all' },
      ]}
    />
  );
};
const TypeSelector = () => {
  const { t } = useTranslation('admin');
  const [selectedType, setSelectedType] = useAtom(scopeTypeAtom);
  return (
    <SegmentedControl
      value={selectedType}
      onChange={(next) => setSelectedType(next as SearchResultType)}
      data={[
        { label: t('quickFind.type.all'), value: 'all' },
        { label: t('quickFind.type.file'), value: 'file' },
        { label: t('quickFind.type.folder'), value: 'folder' },
      ]}
    />
  );
};
