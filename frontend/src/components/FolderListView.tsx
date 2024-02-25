import { MinimalFolder } from '../../types';
import { Box, List, Menu } from 'grommet';
import { Folder as FolderIcon } from 'grommet-icons';

interface FolderListViewProps {
  folders: MinimalFolder[];
  onClick: (folder: MinimalFolder) => void;
}

export const FolderListView = ({ folders, onClick }: FolderListViewProps) => {
  return (
    <Box pad="large">
      <List
        data={folders}
        pad={{ left: 'small', right: 'none' }}
        primaryKey="name"
        onClickItem={(e: any) => {
          const selected: MinimalFolder = e.item;
          console.log(selected);
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
    </Box>
  );
};
