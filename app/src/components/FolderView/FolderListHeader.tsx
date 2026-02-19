import { memo } from 'react';
import type { ViewFolderQuery } from '@shared/gql/graphql';
import { AppHeaderPadding } from '@/src/components/AppHeaderPadding';
import { FolderHeading } from '@/src/components/FolderView/FolderHeading';

const FolderListHeaderComponent = ({
  folder,
}: {
  folder: ViewFolderQuery['folder'];
}) => {
  return (
    <>
      <AppHeaderPadding />
      <FolderHeading folder={folder} />
    </>
  );
};

export const FolderListHeader = memo(FolderListHeaderComponent);
FolderListHeader.displayName = 'FolderListHeader';
