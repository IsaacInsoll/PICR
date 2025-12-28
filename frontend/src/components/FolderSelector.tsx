import { Button, Group, Input, Paper, Tree, useTree } from '@mantine/core';
import {
  TbChevronDown,
  TbChevronUp,
  TbFolderOpen,
  TbFolders,
} from 'react-icons/tb';
import { useQuery } from 'urql';
import { readAllFoldersQuery } from '@shared/urql/queries/readAllFoldersQuery';
import { buildTreeArray, treeNode } from '../helpers/buildTreeArray';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MouseEvent } from 'react';
import { MinimalFolder } from '../../types';
import { LoadingIndicator } from './LoadingIndicator';
import { values } from 'lodash';
import { FolderIcon } from '../PicrIcons';

const prettyFolderPath = (folder: MinimalFolder) => {
  const chev = ' › ';

  const parents = folder.parents
    ?.slice()
    .reverse()
    .map((f) => f.name)
    .join(chev);

  return (parents ? parents + chev : '') + folder?.name;
};

export const FolderSelector = ({
  folder,
  setFolder,
  label = 'Folder',
  description = 'This user can control public links and other users under this folder',
}: {
  folder: MinimalFolder;
  setFolder: (folder: MinimalFolder) => void;
  label?: string;
  description?: string;
}) => {
  const [open, setOpen] = useState(false);

  const fullFolderName = prettyFolderPath(folder);

  return (
    <>
      <Input.Wrapper label={label} description={description}>
        <Input
          placeholder="Folder Name"
          onClick={() => setOpen(true)}
          value={fullFolderName}
          readOnly={true}
          rightSectionPointerEvents="all"
          rightSectionWidth="50"
          rightSection={
            <Button variant="subtle" onClick={() => setOpen((o) => !o)}>
              {open ? <TbChevronUp /> : <TbChevronDown />}
            </Button>
          }
        />
        <Suspense fallback={<LoadingIndicator />}>
          <FolderTreeView
            folder={folder}
            setFolder={setFolder}
            rootId={'1'}
            open={open}
            // onBlur={() => setOpen(false)}
          />
        </Suspense>
      </Input.Wrapper>
    </>
  );
};

const FolderTreeView = ({
  folder,
  rootId,
  setFolder,
  open,
}: {
  folder: MinimalFolder;
  rootId: string; // the most parent folder available to select
  setFolder: (f: MinimalFolder) => void;
  open: boolean;
}) => {
  const [result] = useQuery({
    query: readAllFoldersQuery,
    variables: { id: rootId },
  });
  const tree = useTree({
    initialSelectedState: [folder.id],
    initialExpandedState: expandedParents(folder),
    multiple: false,
  });

  const folders = useMemo(
    () => (result?.data?.allFolders ?? []).filter(Boolean),
    [result?.data?.allFolders],
  );

  const treeData = useMemo(() => {
    const treeRaw: treeNode[] = folders.map((f) => ({
      id: f.id, // buildTree
      value: f.id, // <Tree> view
      label: f.name,
      parentId: f.parentId,
    }));
    return buildTreeArray(treeRaw, rootId);
  }, [folders, rootId]);

  const foldersById = useMemo(() => {
    const map = new Map<string, MinimalFolder>();
    folders.forEach((f) => {
      if (f?.id) map.set(f.id, f);
    });
    return map;
  }, [folders]);

  const lastSelectedId = useRef<string | undefined>(folder?.id);

  const selectFolderById = useCallback(
    (id: string | undefined) => {
      if (!id) return;
      if (lastSelectedId.current === id) return;
      const selected = foldersById.get(id);
      if (!selected) return;
      lastSelectedId.current = id;
      setFolder(selected);
    },
    [foldersById, setFolder],
  );

  // Sync selected folder when tree selection changes.
  useEffect(() => {
    selectFolderById(tree.selectedState[0]);
  }, [tree.selectedState, selectFolderById]);

  //expand the selected parents if we have nothing expanded (IE: first open) {
  useEffect(() => {
    if (open && !values(tree.expandedState).includes(true)) {
      tree.setExpandedState(expandedParents(folder));
    }
  }, [open]);

  const lastFolderId = useRef<string | undefined>(folder?.id);

  useEffect(() => {
    if (!folder?.id) return;
    if (lastFolderId.current !== folder.id) {
      tree.setSelectedState([folder.id]);
      tree.setExpandedState(expandedParents(folder));
      lastFolderId.current = folder.id;
      lastSelectedId.current = folder.id;
    }
  }, [folder?.id]);

  if (!open) return null;
  return (
    <Paper
      shadow="xs"
      radius="sm"
      withBorder
      p="sm"
      style={{ borderColor: 'Highlight' }}
    >
      <Tree
        selectOnClick
        tree={tree}
        data={treeData}
        levelOffset="lg"
        style={{ overflowY: 'scroll', height: 250 }}
        // not onAbortCapture,onBlur, onAbort
        renderNode={({ node, hasChildren, elementProps, selected }) => {
          const onClick = (event: MouseEvent) => {
            elementProps.onClick?.(event);
            selectFolderById(node.value);
          };
          return (
            <Group gap={5} {...elementProps} onClick={onClick}>
              {selected ? (
                <TbFolderOpen style={{ color: 'Highlight' }} />
              ) : hasChildren ? (
                <TbFolders opacity={0.66} />
              ) : (
                <FolderIcon opacity={0.33} />
              )}
              <span>{node.label}</span>
            </Group>
          );
        }}
      />
    </Paper>
  );
};

const expandedParents = (folder: MinimalFolder) => {
  const ex = { [folder.id]: true };
  folder.parents?.forEach((p) => (ex[p.id] = true));
  return ex;
};
