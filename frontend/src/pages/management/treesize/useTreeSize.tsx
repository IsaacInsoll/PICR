import { useQuery } from 'urql';
import { chartColorFiles, chartColorRest, chartColors } from './chartColors';
import { treeSizeQuery } from '@shared/urql/fragments/treeSizeQuery';
import type { TreeSizeQueryQuery } from '@shared/gql/graphql';

type TreeFolder = NonNullable<TreeSizeQueryQuery['folder']>;
type TreeSubFolder = TreeFolder['subFolders'][number];

// Queries server then formats data with colors for presentation
export const useTreeSize = (
  folderId: string,
): { slices: PieSlice[]; folder: TreeFolder | null } => {
  const [result] = useQuery({ query: treeSizeQuery, variables: { folderId } });
  const folder = result.data?.folder;
  if (!folder) return { slices: [], folder: null };

  const subFolders = folder.subFolders
    .map((f) => ({
      ...f,
      color: chartColors[parseInt(f.id) % chartColors.length],
    }))
    .sort((a, b) => parseInt(b.totalSize) - parseInt(a.totalSize));

  return {
    slices: folderToSlices({ ...folder, subFolders }),
    folder: { ...folder, subFolders },
  };
};

const folderToSlices = (
  folder: TreeFolder & { subFolders: (TreeSubFolder & { color: string })[] },
): PieSlice[] => {
  const slices: PieSlice[] =
    folder?.subFolders.map(
      ({
        id,
        name,
        totalSize,
        color,
      }: {
        id: string;
        name: string;
        totalSize: string;
        color: string;
      }) => {
        return { x: id, y: parseInt(totalSize), label: name, color };
      },
    ) ?? [];

  const minSize = parseInt(folder?.totalSize) / 50;

  const { big, small } = Object.groupBy(slices, ({ y }) =>
    y < minSize ? 'small' : 'big',
  );

  const list = big ?? [];

  const rest = small?.reduce((acc, curr) => acc + curr.y, 0) ?? 0;
  if (rest) {
    list.push({ x: 'rest', y: rest, label: '(Other)', color: chartColorRest });
  }

  if (parseInt(folder.totalDirectSize) > 0) {
    list.push({
      x: 'files',
      y: parseInt(folder.totalDirectSize),
      label: '(Files)',
      color: chartColorFiles,
    });
  }
  // const files = folder.files.reduce((acc, curr) => acc + curr.fileSize, 0);
  // if (files) {
  //   big?.push({ x: 'files', y: files, label: '(Files)' });
  // }
  return list.sort((a, b) => b.y - a.y);
};

export interface PieSlice {
  x: string;
  y: number;
  label: string;
  color: string;
}
