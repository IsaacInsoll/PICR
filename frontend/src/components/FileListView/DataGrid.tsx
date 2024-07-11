import { useState } from 'react';
import { ColumnConfig, DataTable, SortType } from 'grommet';
import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FileListView';
import prettyBytes from 'pretty-bytes';
import { Box, Text } from '@mantine/core';

export const DataGrid = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const [sort, setSort] = useState<SortType>({
    property: 'name',
    direction: 'asc',
  });
  return (
    <Box p="lg" ta="center">
      <DataTable
        fill={true}
        columns={dataTableColumnConfig}
        data={files}
        sort={sort}
        onSort={setSort}
        resizeable
        onClickRow={({ datum }) => setSelectedFileId(datum.id)}
      />
    </Box>
  );
};
const dataTableColumnConfig: ColumnConfig<MinimalFile>[] = [
  { property: 'name', header: <Text>Name</Text> },
  { property: 'type', header: <Text>Type</Text> },
  {
    property: 'fileSize',
    header: <Text>File Size</Text>,
    render: ({ fileSize }) => (fileSize ? prettyBytes(fileSize) : null),
  },
];
