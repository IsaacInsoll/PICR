import { File } from '../gql/graphql';
import { MinimalFile, MinimalFolder } from '../../types';
import { Box, List, Menu, Page, PageContent } from 'grommet';
import { Folder as FolderIcon } from 'grommet-icons/icons';

interface FileListViewProps {
  files: MinimalFile[];
}

export const FileListView = ({ files }: FileListViewProps) => {
  return <BoringFileListView files={files} />;
};

export const BoringFileListView = ({ files }: FileListViewProps) => {
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
