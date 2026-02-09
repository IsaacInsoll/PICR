import { memo } from 'react';
import { Folder } from '@shared/gql/graphql';
import { AppHeaderPadding } from '@/src/components/AppHeaderPadding';
import { FolderHeading } from '@/src/components/FolderView/FolderHeading';

export const FolderListHeader = memo(({ folder }: { folder: Folder }) => {
  return (
    <>
      <AppHeaderPadding />
      <FolderHeading folder={folder} />
    </>
  );
});
