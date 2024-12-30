import { Button, Group, Input, Paper, Tree, useTree } from '@mantine/core';
import {
  TbChevronDown,
  TbChevronUp,
  TbFolderOpen,
  TbFolders,
} from 'react-icons/tb';
import { useQuery } from 'urql';
import { readAllFoldersQuery } from '../urql/queries/readAllFoldersQuery';
import { buildTreeArray, treeNode } from '../helpers/buildTreeArray';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
}: {
  folder: MinimalFolder;
  setFolder: (folder: MinimalFolder) => void;
}) => {
  const [open, setOpen] = useState(false);

  const fullFolderName = prettyFolderPath(folder);

  return (
    <>
      <Input.Wrapper
        label="Folder"
        description="This user can control public links and other users under this folder"
        // error="Input error"
      >
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

  const treeData = useMemo(() => {
    const treeRaw: treeNode[] = result?.data?.allFolders.map((f) => ({
      id: f?.id, //buildTree
      value: f?.id, // <Tree> view
      label: f?.name,
      parentId: f?.parentId,
    }));
    return buildTreeArray(treeRaw, rootId);
  }, [result, rootId]);

  //setSelected when we observe the value has changed
  useEffect(() => {
    const selected = result?.data?.allFolders.find(
      ({ id }) => id === tree.selectedState[0],
    );
    if (selected) setFolder(selected);
    console.log(selected);
  }, [tree.selectedState, setFolder]);

  //expand the selected parents if we have nothing expanded (IE: first open) {
  useEffect(() => {
    if (open && !values(tree.expandedState).includes(true)) {
      tree.setExpandedState(expandedParents(folder));
    }
  }, [open]);

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
        renderNode={({
          node,
          expanded,
          hasChildren,
          elementProps,
          level,
          selected,
        }) => {
          return (
            <Group gap={5} {...elementProps}>
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
