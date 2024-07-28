import { MinimalSharedFolder } from '../../types';
import { PicrColumns, PicrDataGrid } from './PicrDataGrid';
import { Page } from './Page';
import { Folder } from '../../../graphql-types';
import { useSetFolder } from '../hooks/useSetFolder';

export const SubfolderListView = ({ folder }: { folder: Folder }) => {
  const setFolder = useSetFolder();

  if (!folder || folder.subFolders.length === 0) return undefined;
  const parents = [folder, ...folder.parents];
  return (
    <Page>
      <PicrDataGrid
        data={folder.subFolders}
        columns={columns}
        onClick={(row) => setFolder({ ...row, parents })}
      />
    </Page>
  );
};

const columns: PicrColumns<MinimalSharedFolder>[] = [
  { accessorKey: 'name', header: 'Folder Name' },
];
