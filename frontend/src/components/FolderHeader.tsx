import { Anchor, Button, Page, PageContent, PageHeader } from 'grommet';
import { MinimalFolder } from '../../types';
import { FolderLink } from './FolderLink';

export const FolderHeader = ({
  folder,
  subtitle,
}: {
  folder: MinimalFolder;
  subtitle?: string;
}) => {
  return (
    <Page>
      <PageContent>
        <PageHeader
          title={folder.name ?? '(Unnamed Folder)'}
          subtitle={subtitle}
          parent={
            folder.parentId ? (
              <FolderLink folderId={folder.parentId} />
            ) : undefined
          }
          // actions={<Button label="Edit" primary />}
        />
      </PageContent>
    </Page>
  );
};
