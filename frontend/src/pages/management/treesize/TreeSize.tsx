import { Suspense, useState } from 'react';
import {
  Anchor,
  Box,
  Breadcrumbs,
  Code,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { useTreeSize } from './useTreeSize';
import { PicrPie } from './PicrPie';
import { useNavigate, useParams } from 'react-router';
import { FolderSummary, treeSizeTabAtom } from './FolderSummary';
import { prettyBytes } from '@shared/prettyBytes';
import { useSetAtom } from 'jotai';

export const TreeSize = ({ rootId }: { rootId?: string }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const setTreeSizeTab = useSetAtom(treeSizeTabAtom);

  const setFolderId = (id: string) => {
    //todo: URL state instead of atom
    if (id == 'files') {
      setTreeSizeTab('files');
    } else {
      navigate('/admin/settings/treesize/' + id);
    }
  };
  return (
    <Box>
      <Suspense fallback={<LoadingIndicator />}>
        <TreeSizeNode
          folderId={slug ?? rootId ?? '1'}
          setFolderId={setFolderId}
        />
      </Suspense>
    </Box>
  );
};

const TreeSizeNode = ({
  folderId,
  setFolderId,
}: {
  folderId: string;
  setFolderId: (id: string) => void;
}) => {
  const { slices, folder } = useTreeSize(folderId);
  const [hover, setHover] = useState<string | null>(null);

  // i was passing this to FolderSummary so you got sweet mouseover of subfolder but it feels kinda clunky.
  // it was still good though so feel free to revert this
  // const hoveredFolder: PicrFolder =
  //   folder?.subFolders.find(({ id }) => id == hover) ?? folder;

  const crumbs = [
    ...(folder?.parents?.toReversed().map((f) => (
      <Anchor key={f.id} onClick={() => setFolderId(f.id)}>
        {f?.name}
      </Anchor>
    )) ?? []),
    <Text key="current">{folder?.name}</Text>,
  ];
  return (
    <Stack pt="md">
      <Group justify="space-between">
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {crumbs}
        </Breadcrumbs>
        <Code>{prettyBytes(Number(folder?.totalSize ?? 0))}</Code>
      </Group>
      <Divider />
      <Group style={{ alignItems: 'start' }}>
        {folder ? (
          <>
            <PicrPie
              key={folder.id}
              slices={slices}
              setHover={setHover}
              setFolderId={setFolderId}
              hover={hover}
            />
            <FolderSummary
              slices={slices}
              folder={folder}
              setFolderId={setFolderId}
              hover={hover}
              setHover={setHover}
            />
          </>
        ) : null}
      </Group>
    </Stack>
  );
};
