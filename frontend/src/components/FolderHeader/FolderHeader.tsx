import { MinimalFolder } from '../../../types';
import { FolderLink } from '../FolderLink';
import { Helmet } from 'react-helmet-async';
import { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolderName } from './PlaceholderFolderName';
import { TbChevronRight } from 'react-icons/tb';
import { LoadingIndicator } from '../LoadingIndicator';
import { Page } from '../Page';
import { Container, Group } from '@mantine/core';

export const FolderHeader = ({
  folder,
  subtitle,
  actions,
}: {
  folder: MinimalFolder;
  subtitle?: string;
  actions?: JSX.Element;
}) => {
  const parents = folder.parents ? (
    <Group align="center">
      {folder.parents
        .slice(-3)
        .reverse()
        .map((p, i) => {
          const last = i + 1 === folder.parents?.length;
          return (
            <span key={i}>
              <FolderLink folder={p} />
              {!last ? <TbChevronRight style={{ opacity: 0.33 }} /> : null}
            </span>
          );
        })}
    </Group>
  ) : (
    ' '
  );

  return (
    <HeaderWrapper
      title={folder.name ?? '(Unnamed Folder)'}
      subtitle={subtitle}
      actions={actions}
      parent={parents}
    />
  );
};

export const PlaceholderFolderHeader = () => {
  //todo ditch atom
  // i really want to do a graphicache lookup of folder(with certain id) and get it's .name as we probably have it in the cache
  const folderName = useAtomValue(placeholderFolderName);
  return (
    <>
      <HeaderWrapper title={folderName ?? 'Loading'} subtitle=" " />
      <Container style={{ textAlign: 'center' }}>
        <LoadingIndicator size="large" />
      </Container>
    </>
  );
};

const HeaderWrapper = ({
  title,
  subtitle,
  children,
  actions,
  parent,
}: {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  parent?: ReactNode;
}) => {
  // TODO Beautify and mobile friendly
  return (
    <Page>
      <Helmet>
        <title>{title ?? 'PICR'}</title>
      </Helmet>
      <Container>
        {parent}
        <h1>{title}</h1>
        <h2>{subtitle}</h2>
        {actions}
      </Container>
      {children}
    </Page>
  );
};
