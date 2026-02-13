import { memo } from 'react';
import { Folder } from '@shared/gql/graphql';
import { AppHeaderPadding } from '@/src/components/AppHeaderPadding';
import { FolderHeading } from '@/src/components/FolderView/FolderHeading';

const FolderListHeaderComponent = ({ folder }: { folder: Folder }) => {
  return (
    <>
      <AppHeaderPadding />
      <FolderHeading folder={folder} />
    </>
  );
};

export const FolderListHeader = memo(FolderListHeaderComponent);
FolderListHeader.displayName = 'FolderListHeader';
