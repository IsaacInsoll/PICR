import type { PicrFolder } from '@shared/types/picr';
import { FolderLink } from '../FolderLink';
import type React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { placeholderFolder } from './PlaceholderFolder';
import { themeModeAtom } from '../../atoms/themeModeAtom';
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
  customSubtitle,
  actions,
  hideTitleAndCustomSubtitle,
}: {
  folder: PicrFolder;
  subtitle?: string;
  customSubtitle?: string | null;
  actions?: ReactElement;
  hideTitleAndCustomSubtitle?: boolean;
}) => {
  return (
    <HeaderWrapper
      title={folder.title ?? folder.name ?? '(Unnamed Folder)'}
      customSubtitle={customSubtitle ?? undefined}
      subtitle={subtitle}
      actions={actions}
      parent={folder.parents}
      hideTitleAndCustomSubtitle={hideTitleAndCustomSubtitle}
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
  customSubtitle,
  subtitle,
  children,
  actions,
  parent,
  hideTitleAndCustomSubtitle,
}: {
  title?: string;
  customSubtitle?: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  parent?: PicrFolder[];
  hideTitleAndCustomSubtitle?: boolean;
}) => {
  const theme = useAtomValue(themeModeAtom);
  const headingFontSize = theme.headingFontSize ?? undefined;
  const headingAlignment = theme.headingAlignment ?? undefined;
  const normalizedCustomSubtitle = customSubtitle?.trim();

  //let's populate each parent folder with a list of its parents so when we click one the placeholder has its parent hierachy for good UI
  const filledParents: PicrFolder[] | undefined = parent?.map((f, i) => {
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
      <PicrTitle title={[title, 'PICR'].filter(Boolean) as string[]} />
      <Box style={{ minHeight: 25 }}>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {crumbs}
        </Breadcrumbs>
      </Box>
      <Grid>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          {!hideTitleAndCustomSubtitle ? (
            <>
              <Title
                order={1}
                style={{
                  fontSize: headingFontSize ?? undefined,
                  textAlign:
                    (headingAlignment as React.CSSProperties['textAlign']) ??
                    undefined,
                }}
              >
                {title}
              </Title>
              {normalizedCustomSubtitle ? (
                <Title
                  order={3}
                  style={{
                    paddingTop: headingFontSize
                      ? headingFontSize * 0.1
                      : undefined,
                    fontSize: headingFontSize
                      ? headingFontSize * 0.5
                      : undefined,
                    opacity: 0.5,
                    textAlign:
                      (headingAlignment as React.CSSProperties['textAlign']) ??
                      undefined,
                  }}
                >
                  {normalizedCustomSubtitle}
                </Title>
              ) : null}
            </>
          ) : null}
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
