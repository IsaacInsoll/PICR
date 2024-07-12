import { MinimalFolder } from '../../../types';
import { FolderLink } from '../FolderLink';
import { Helmet } from 'react-helmet-async';
import { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolder } from './PlaceholderFolder';
import { LoadingIndicator } from '../LoadingIndicator';
import { Page } from '../Page';
import {
  Box,
  Breadcrumbs,
  Container,
  Divider,
  Flex,
  Grid,
  Group,
  Loader,
  Skeleton,
  Text,
  Title,
} from '@mantine/core';

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
        subtitle={<Loader color="blue" type="dots" />}
        parent={folder?.parents}
      />
      <Page>
        <Skeleton width="100%" height="150" />
      </Page>
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
  subtitle?: string | ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  parent?: MinimalFolder[];
}) => {
  //let's populate each parent folder with a list of its parents so when we click one the placeholder has its parent hierachy for good UI
  const filledParents: MinimalFolder[] | undefined = parent?.map((f, i) => {
    return { ...f, parents: parent.slice(i + 1) };
  });
  const crumbs = filledParents?.length
    ? filledParents
        .slice(-3)
        .reverse()
        .map((p, i) => <FolderLink folder={p} key={i} />)
    : null;

  return (
    <Page>
      <Helmet>
        <title>{title ?? 'PICR'}</title>
      </Helmet>
      <Box style={{ minHeight: 25 }}>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {crumbs}
        </Breadcrumbs>
      </Box>
      <Grid>
        <Grid.Col span={{ sm: 12, md: 6 }}>
          <Title order={1}>{title}</Title>
          <Text>{subtitle}</Text>
        </Grid.Col>
        <Grid.Col span={{ sm: 12, md: 6 }}>
          <Flex hiddenFrom="md" justify="space-evenly" mb="lg">
            {actions}
          </Flex>
          <Flex visibleFrom="md" justify="flex-end">
            {actions}
          </Flex>
        </Grid.Col>
      </Grid>

      {children}
    </Page>
  );
};
