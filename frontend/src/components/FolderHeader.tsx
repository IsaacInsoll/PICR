import { Anchor, Page, PageContent, PageHeader } from 'grommet';
import { MinimalFolder } from '../../types';
import { FolderLink } from './FolderLink';
import { Helmet } from 'react-helmet';
import { Suspense } from 'react';
import { atom, useAtomValue } from 'jotai';

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
              <Suspense>
                <FolderLink folderId={folder.parentId} />
              </Suspense>
            ) : (
              <Anchor style={{ opacity: 0.0 }}> </Anchor>
            )
          }
          // actions={<Button label="Edit" primary />}
        />
      </PageContent>
    </Page>
  );
};

export const PlaceholderFolderHeader = () => {
  //todo ditch atom
  // i really want to do a graphicache lookup of folder(with certain id) and get it's .name as we probably have it in the cache
  const folderName = useAtomValue(placeholderFolderName);
  return (
    <Page>
      <PageContent>
        <PageHeader
          title={folderName ?? 'Loading...'}
          subtitle=" "
          parent={<Anchor style={{ opacity: 0.0 }}> </Anchor>}
        />
      </PageContent>
    </Page>
  );
};

export const placeholderFolderName = atom<string | undefined>(undefined);
