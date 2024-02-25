import { Page, PageContent, PageHeader } from 'grommet';
import { MinimalFolder } from '../../types';
import { FolderLink } from './FolderLink';
import { Helmet } from 'react-helmet';

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
        <Helmet>
          <title>{folder.name ?? 'PICR'}</title>
        </Helmet>
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
