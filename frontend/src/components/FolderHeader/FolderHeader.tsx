import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
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
  Loader,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { PicrTitle } from '../PicrTitle';
import { LoggedInHeader } from '../Header/LoggedInHeader';
import { getBreadcrumbFolders } from '../../helpers/getBreadcrumbFolders';
import { normalizeHeadingAlignment } from '@shared/branding/galleryPresets';

export const FolderHeader = ({
  folder,
  subtitle,
  customSubtitle,
  actions,
  hideTitleAndCustomSubtitle,
  hideBreadcrumbs,
  hasBannerLayout,
}: {
  folder: PicrFolder;
  subtitle?: string;
  customSubtitle?: string | null;
  actions?: ReactElement;
  hideTitleAndCustomSubtitle?: boolean;
  hideBreadcrumbs?: boolean;
  hasBannerLayout?: boolean;
}) => {
  return (
    <HeaderWrapper
      title={
        folder.title ?? normalizeDisplayName(folder.name) ?? '(Unnamed Folder)'
      }
      customSubtitle={customSubtitle ?? undefined}
      subtitle={subtitle}
      actions={actions}
      parent={folder.parents}
      hideTitleAndCustomSubtitle={hideTitleAndCustomSubtitle}
      hideBreadcrumbs={hideBreadcrumbs}
      hasBannerLayout={hasBannerLayout}
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
        title={normalizeDisplayName(folder?.name) ?? 'Loading'}
        subtitle={<Loader type="dots" />}
        parent={folder?.parents}
      />
      <Page>
        <Skeleton width="100%" height="300" />
      </Page>
    </>
  );
};

const TitleBlock = ({
  title,
  customSubtitle,
  headingFontSize,
  textAlign,
}: {
  title?: string;
  customSubtitle?: string;
  headingFontSize?: number;
  textAlign: React.CSSProperties['textAlign'];
}) => (
  <Box>
    <Title
      order={1}
      style={{
        fontSize: headingFontSize ?? undefined,
        textAlign,
      }}
    >
      {title}
    </Title>
    {customSubtitle ? (
      <Title
        order={2}
        style={{
          paddingTop: headingFontSize ? headingFontSize * 0.1 : undefined,
          fontSize: headingFontSize ? headingFontSize * 0.5 : undefined,
          opacity: 0.5,
          textAlign,
        }}
      >
        {customSubtitle}
      </Title>
    ) : null}
  </Box>
);

const HeaderWrapper = ({
  title,
  customSubtitle,
  subtitle,
  children,
  actions,
  parent,
  hideTitleAndCustomSubtitle,
  hideBreadcrumbs,
  hasBannerLayout: hasBannerLayoutProp,
}: {
  title?: string;
  customSubtitle?: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  parent?: PicrFolder[];
  hideTitleAndCustomSubtitle?: boolean;
  hideBreadcrumbs?: boolean;
  hasBannerLayout?: boolean;
}) => {
  const theme = useAtomValue(themeModeAtom);
  const headingFontSize = theme.headingFontSize ?? undefined;
  const headingAlignment = normalizeHeadingAlignment(theme.headingAlignment);
  const normalizedCustomSubtitle = customSubtitle?.trim();
  const hasBannerLayout =
    hasBannerLayoutProp ??
    Boolean(hideBreadcrumbs || hideTitleAndCustomSubtitle);
  const titleTextAlign = headingAlignment as React.CSSProperties['textAlign'];
  // Mobile always centers the title regardless of branding alignment — left/right
  // alignment looks awkward at phone widths, so the alignment setting only affects
  // tablet/desktop. See frontend/AGENTS.md for the broader branding alignment rules.
  const desktopLayout: 'stacked' | 'sideBySide' =
    headingAlignment === 'center' ? 'stacked' : 'sideBySide';
  const titleBlockStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: headingAlignment === 'center' ? 720 : 900,
    textAlign: titleTextAlign,
    marginInline: headingAlignment === 'center' ? 'auto' : undefined,
  };

  //let's populate each parent folder with a list of its parents so when we click one the placeholder has its parent hierachy for good UI
  const crumbs = getBreadcrumbFolders(parent).map((parentFolder) => (
    <FolderLink folder={parentFolder} key={parentFolder.id} />
  ));

  return (
    <Page>
      <Box
        pt={hasBannerLayout ? 'sm' : undefined}
        pb={hasBannerLayout ? 'sm' : 'lg'}
      >
        <PicrTitle title={[title, 'PICR'].filter(Boolean) as string[]} />
        {!hideBreadcrumbs ? (
          <Box style={{ minHeight: 25 }}>
            <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
              {crumbs}
            </Breadcrumbs>
          </Box>
        ) : null}
        <Box hiddenFrom="sm">
          <Stack gap="md">
            {!hideTitleAndCustomSubtitle ? (
              <TitleBlock
                title={title}
                customSubtitle={normalizedCustomSubtitle}
                headingFontSize={headingFontSize}
                textAlign="center"
              />
            ) : null}
            <Text ta="center">{subtitle}</Text>
            <Flex justify="center" pb={hasBannerLayout ? 'sm' : 'md'}>
              {actions}
            </Flex>
          </Stack>
        </Box>
        <Box visibleFrom="sm">
          {desktopLayout === 'stacked' ? (
            <Box pb={hasBannerLayout ? 'sm' : undefined}>
              {!hideTitleAndCustomSubtitle ? (
                <Box style={titleBlockStyle}>
                  <TitleBlock
                    title={title}
                    customSubtitle={normalizedCustomSubtitle}
                    headingFontSize={headingFontSize}
                    textAlign={titleTextAlign}
                  />
                </Box>
              ) : null}
              <Text style={titleBlockStyle}>{subtitle}</Text>
              <Flex justify="center" mt="lg">
                {actions}
              </Flex>
            </Box>
          ) : (
            <Flex align="flex-start" justify="space-between">
              <Box style={{ flex: '1 1 auto', minWidth: 0 }}>
                {!hideTitleAndCustomSubtitle ? (
                  <Box style={titleBlockStyle}>
                    <TitleBlock
                      title={title}
                      customSubtitle={normalizedCustomSubtitle}
                      headingFontSize={headingFontSize}
                      textAlign={titleTextAlign}
                    />
                  </Box>
                ) : null}
                <Text style={titleBlockStyle}>{subtitle}</Text>
              </Box>
              <Flex justify="flex-end" style={{ flex: '0 0 auto' }}>
                {actions}
              </Flex>
            </Flex>
          )}
        </Box>

        {children}
      </Box>
    </Page>
  );
};
