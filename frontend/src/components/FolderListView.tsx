import { MinimalFolder } from '../../types';
import { List, Menu, Page, PageContent } from 'grommet';
import { Folder as FolderIcon } from 'grommet-icons';

interface FolderListViewProps {
  folders: MinimalFolder[];
  onClick: (folder: MinimalFolder) => void;
}

export const FolderListView = ({ folders, onClick }: FolderListViewProps) => {
  if (!folders || folders.length === 0) return undefined;
  return (
    <Page>
      <PageContent>
        <List
          data={folders}
          pad={{ left: 'small', right: 'none' }}
          primaryKey="name"
          onClickItem={(e: any) => {
            const selected: MinimalFolder = e.item;
            onClick(selected);
          }}
          action={(item, index) => (
            <Menu
              key={item.id}
              icon={<FolderIcon />}
              hoverIndicator
              items={[{ label: item.name }]}
            />
          )}
        />
      </PageContent>
    </Page>
  );
};
