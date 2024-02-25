import { List, Page, PageContent } from 'grommet';
import { FileListViewStyleComponentProps } from './FileListView';

export const BoringFileListView = ({
  files,
}: FileListViewStyleComponentProps) => {
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
