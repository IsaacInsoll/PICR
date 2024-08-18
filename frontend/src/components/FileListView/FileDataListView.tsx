import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { PicrColumns, PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';
import { Menu } from '@mantine/core';
import { TbCloudDownload, TbFile, TbInfoCircle } from 'react-icons/tb';
import { useSetFolder } from '../../hooks/useSetFolder';
import { imageURL } from '../../helpers/imageURL';

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();

  const fileMenuItems = ({ row }) => {
    const f: MinimalFile = row.original;
    return [
      <Menu.Item
        leftSection={<TbFile size="20" />}
        key={1}
        onClick={() => {
          setFolder({ id: folderId }, f);
        }}
      >
        View {f.name}
      </Menu.Item>,
      <Menu.Item
        leftSection={<TbInfoCircle size="20" />}
        key={2}
        onClick={() => {
          setFolder({ id: folderId }, f, 'info');
        }}
      >
        Details
      </Menu.Item>,
      <Menu.Item
        component="a"
        leftSection={<TbCloudDownload />}
        key={3}
        href={imageURL(f, 'raw')}
        download={true}
      >
        Download
      </Menu.Item>,
    ];
  };

  return (
    <Page>
      <PicrDataGrid
        columns={columns}
        data={files}
        onClick={(row) => setSelectedFileId(row.id)}
        menuItems={fileMenuItems}
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
