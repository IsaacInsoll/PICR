import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { PicrColumns, PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';

export const FileDataListView = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  return (
    <Page>
      <PicrDataGrid
        columns={columns}
        data={files}
        onClick={(row) => setSelectedFileId(row.id)}
      />
    </Page>
  );
};

const columns: PicrColumns<MinimalFile>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    accessorFn: ({ fileSize }) => (fileSize ? prettyBytes(fileSize) : null),
  },
];
