import { MinimalFile } from '../../types';
import {
  Box,
  ColumnConfig,
  DataTable,
  List,
  Page,
  PageContent,
  SortType,
} from 'grommet';

import { imageURL } from '../helpers/imageURL';
import { Gallery } from 'react-grid-gallery';
import { useSelectedView, ViewSelector } from './ViewSelector';
import { useState } from 'react';

interface FileListViewProps {
  files: MinimalFile[];
}

export const FileListView = ({ files }: FileListViewProps) => {
  const view = useSelectedView();
  return (
    <>
      <ViewSelector />
      {view === 'list' ? <DataGrid files={files} /> : null}
      {view === 'gallery' ? <GridGallery files={files} /> : null}
      {view === 'slideshow' ? <BoringFileListView files={files} /> : null}
    </>
  );
};

const DataGrid = ({ files }: FileListViewProps) => {
  const [sort, setSort] = useState<SortType>({
    property: 'name',
    direction: 'asc',
  });
  return (
    <Box align="center" pad="large">
      <DataTable
        fill={true}
        columns={dataTableColumnConfig}
        data={files}
        sort={sort}
        onSort={setSort}
        resizeable
      />
    </Box>
  );
};

const dataTableColumnConfig: ColumnConfig<MinimalFile>[] = [
  { property: 'name' },
];

const BoringFileListView = ({ files }: FileListViewProps) => {
  return (
    <Page>
      <PageContent>
        <List
          data={files}
          pad={{ left: 'small', right: 'none' }}
          primaryKey="name"
          // onClickItem={(e: any) => {
          //   const selected: MinimalFolder = e.item;
          //   console.log(selected);
          //   onClick(selected);
          // }}
          // action={(item, index) => (
          //   <Menu
          //     key={item.id}
          //     icon={<FolderIcon />}
          //     hoverIndicator
          //     items={[{ label: item.name }]}
          //   />
          // )}
        />
      </PageContent>
    </Page>
  );
};

//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
const GridGallery = ({ files }: FileListViewProps) => {
  const size = 250;

  const images = files.map((file) => ({
    src: imageURL(file, 'sm'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    //alt,tags,isSelected,caption,
  }));

  return <Gallery images={images} />;
};
