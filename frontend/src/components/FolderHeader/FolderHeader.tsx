import { Anchor, Box, Page, PageContent, PageHeader, Spinner } from 'grommet';
import { MinimalFolder } from '../../../types';
import { FolderLink } from '../FolderLink';
import { Helmet } from 'react-helmet';
import { ReactNode, Suspense } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolderName } from './PlaceholderFolderName';

export const FolderHeader = ({
  folder,
  subtitle,
  actions,
}: {
  folder: MinimalFolder;
  subtitle?: string;
  actions?: JSX.Element;
}) => {
  return (
    <HeaderWrapper title={folder.name}>
      <PageHeader
        margin="none"
        title={folder.name ?? '(Unnamed Folder)'}
        subtitle={subtitle}
        actions={actions}
        parent={
          folder.parentId ? (
            <Suspense>
              <FolderLink folderId={folder.parentId} />
            </Suspense>
          ) : (
            <EmptyParentFolder />
          )
        }
      />
    </HeaderWrapper>
  );
};

export const PlaceholderFolderHeader = () => {
  //todo ditch atom
  // i really want to do a graphicache lookup of folder(with certain id) and get it's .name as we probably have it in the cache
  const folderName = useAtomValue(placeholderFolderName);
  return (
    <HeaderWrapper title={folderName ?? 'Loading'}>
      <PageHeader
        margin="none"
        title={folderName ?? 'Loading...'}
        subtitle=" "
        parent={<EmptyParentFolder />}
      />
      <Box align="center">
        <Spinner size="large" />
      </Box>
    </HeaderWrapper>
  );
};

// if there is no parent then header moves up which is bad, so put some 'nothingness' in there to preserve layout
const EmptyParentFolder = () => {
  return <Anchor style={{ opacity: 0.0 }}>...</Anchor>;
};

const HeaderWrapper = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => {
  return (
    <Page>
      <Helmet>
        <title>{title ?? 'PICR'}</title>
      </Helmet>
      <PageContent>{children}</PageContent>
    </Page>
  );
};
