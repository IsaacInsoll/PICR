import { useQuery } from 'urql';
import { gql } from '../../../helpers/gql';
import { chartColorFiles, chartColorRest, chartColors } from './chartColors';
import { Folder } from '../../../../../graphql-types';

// Queries server then formats data with colors for presentation
export const useTreeSize = (
  folderId: string,
): { slices: PieSlice[]; folder: Folder | null } => {
  const [result] = useQuery({ query: treeSizeQuery, variables: { folderId } });
  const folder = result.data?.folder;
  if (!folder) return { slices: [], folder: null };

  const subFolders = folder.subFolders
    .map((f) => ({
      ...f,
      color: chartColors[parseInt(f.id) % chartColors.length],
    }))
    .sort((a, b) => b.size - a.size);

  return {
    slices: folderToSlices({ ...folder, subFolders }),
    folder: { ...folder, subFolders },
  };
};

const folderToSlices = (folder): PieSlice[] => {
  const slices: PieSlice[] =
    folder?.subFolders.map(({ id, name, totalSize, color }) => {
      return { x: id, y: parseInt(totalSize), label: name, color };
    }) ?? [];

  const minSize = parseInt(folder?.totalSize) / 50;

  const { big, small } = Object.groupBy(slices, ({ y }) =>
    y < minSize ? 'small' : 'big',
  );

  const list = big ?? [];

  const rest = small?.reduce((acc, curr) => acc + curr.y, 0) ?? 0;
  if (rest) {
    list.push({ x: 'rest', y: rest, label: '(Other)', color: chartColorRest });
  }

  if (folder.totalDirectSize > 0) {
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

export const treeSizeQuery = gql(/* GraphQL */ `
  query TreeSizeQuery($folderId: ID!) {
    folder(id: $folderId) {
      parents {
        id
        name
      }
      ...TreeSizeFragment
      files {
        id
        name
        type
        fileSize
      }
      subFolders {
        ...TreeSizeFragment
        subFolders {
          ...TreeSizeFragment
        }
      }
    }
  }
`);

const treeSizeFragment = gql(/* GraphQL */ `
  fragment TreeSizeFragment on Folder {
    id
    name
    totalFiles
    totalFolders
    totalSize
    totalDirectSize
  }
`);

export interface PieSlice {
  x: string;
  y: number;
  label: string;
  color: string;
}
