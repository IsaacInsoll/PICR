import { memo } from 'react';
import type { ViewFolder } from '@shared/files/sortFiles';
import { AppHeaderPadding } from '@/src/components/AppHeaderPadding';
import { FolderHeading } from '@/src/components/FolderView/FolderHeading';

const FolderListHeaderComponent = ({ folder }: { folder: ViewFolder }) => {
  return (
    <>
      <AppHeaderPadding />
      <FolderHeading folder={folder} />
    </>
  );
};

export const FolderListHeader = memo(FolderListHeaderComponent);
FolderListHeader.displayName = 'FolderListHeader';
