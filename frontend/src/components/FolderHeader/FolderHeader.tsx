import { MinimalFolder } from '../../../types';
import { FolderLink } from '../FolderLink';
import { Helmet } from 'react-helmet-async';
import { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolder } from './PlaceholderFolder';
import { TbChevronRight } from 'react-icons/tb';
import { LoadingIndicator } from '../LoadingIndicator';
import { Page } from '../Page';
import {
  Anchor,
  Box,
  Breadcrumbs,
  Container,
  Group,
  Text,
  Title,
} from '@mantine/core';
import { i } from 'vite/dist/node/types.d-aGj9QkWt';

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
    <HeaderWrapper
      title={folder.name ?? '(Unnamed Folder)'}
      subtitle={subtitle}
      actions={actions}
      parent={folder.parents}
    />
  );
};

export const PlaceholderFolderHeader = () => {
  //todo ditch atom
  // i really want to do a graphicache lookup of folder(with certain id) and get it's .name as we probably have it in the cache
  const folder = useAtomValue(placeholderFolder);
  return (
    <>
      <HeaderWrapper
        title={folder?.name ?? 'Loading'}
        subtitle=" "
        parent={folder?.parents}
      />
      <LoadingIndicator size="large" />
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
  parent?: MinimalFolder[];
}) => {
  const crumbs =
    parent && parent.length
      ? parent
          .slice(-3)
          .reverse()
          .map((p, i) => <FolderLink folder={p} key={i} />)
      : null;
  return (
    <Page>
      <Helmet>
        <title>{title ?? 'PICR'}</title>
      </Helmet>
      <Container>
        <Box style={{ minHeight: 25 }}>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {crumbs}
          </Breadcrumbs>
        </Box>
        <Title order={1}>{title}</Title>
        <Text>{subtitle}</Text>
        {actions}
      </Container>
      {children}
    </Page>
  );
};
