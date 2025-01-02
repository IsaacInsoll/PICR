import { MinimalFolder } from '../../../types';
import { FolderLink } from '../FolderLink';
import { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolder } from './PlaceholderFolder';
import { Page } from '../Page';
import {
  Box,
  Breadcrumbs,
  Flex,
  Grid,
  Loader,
  Skeleton,
  Text,
  Title,
} from '@mantine/core';
import { PicrTitle } from '../PicrTitle';
import { LoggedInHeader } from '../Header/LoggedInHeader';

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
      <LoggedInHeader folder={folder} />
      <HeaderWrapper
        title={folder?.name ?? 'Loading'}
        subtitle={<Loader type="dots" />}
        parent={folder?.parents}
      />
      <Page>
        <Skeleton width="100%" height="300" />
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
      <PicrTitle title={[title, 'PICR']} />
      <Box style={{ minHeight: 25 }}>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {crumbs}
        </Breadcrumbs>
      </Box>
      <Grid>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <Title order={1}>{title}</Title>
          <Text>{subtitle}</Text>
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <Flex hiddenFrom="sm" justify="space-evenly" pb="md">
            {actions}
          </Flex>
          <Flex visibleFrom="sm" justify="flex-end">
            {actions}
          </Flex>
        </Grid.Col>
      </Grid>

      {children}
      {/*<Divider mt="md" mb="md" />*/}
    </Page>
  );
};
