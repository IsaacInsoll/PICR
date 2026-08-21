import type { PicrFolder } from '@shared/types/picr';
import { FolderLink } from '../FolderLink';
import type React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import {
  useFolderPlaceholder,
  useFolderPlaceholderIdentity,
} from '../../hooks/useFolderPlaceholder';
import { FolderBannerView } from '../FolderBanner';
import type { ViewFolderMode } from '../../helpers/viewFolderMode';
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
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';

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
  const { t } = useTranslation('gallery');
  const formatFolderName = useFolderNameFormatter();
  return (
    <HeaderWrapper
      title={folder.title ?? formatFolderName(folder) ?? t('folder.unnamed')}
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

// Shown while a folder view loads. Folder identity comes from graphcache (see
// useFolderPlaceholderIdentity) - breadcrumb parents may only have enough cached
// fields for the heading. Full placeholder data (breadcrumbs/banner) comes from
// useFolderPlaceholder when the full MinimumFolderFragment is cached. Falls back
// to a generic "Loading" on a total cache miss, e.g. a direct URL into a cold
// tab.
//
// The banner branches here MUST mirror ViewFolder's, or the placeholder renders
// a layout the real page then tears down. A wrong banner isn't possible: it
// needs a real bannerImage object to build a URL from, which a cache miss cannot
// fabricate - the failure mode is no banner, i.e. today's behaviour.
export const PlaceholderFolderHeader = ({
  folderId,
  mode = 'files',
}: {
  folderId?: string;
  mode?: ViewFolderMode;
}) => {
  const { t } = useTranslation('gallery');
  const formatFolderName = useFolderNameFormatter();
  const identityFolder = useFolderPlaceholderIdentity(folderId);
  const fullFolder = useFolderPlaceholder(folderId);
  const folder = fullFolder ?? identityFolder;
  const activity = mode === 'activity';
  const hasBanner = Boolean(fullFolder?.bannerImage) && !activity;
  return (
    <>
      <LoggedInHeader folder={folder ?? undefined} flushBottom={hasBanner} />
      {hasBanner && fullFolder ? (
        <FolderBannerView folder={fullFolder} />
      ) : null}
      <HeaderWrapper
        // `title ?? name` matches FolderHeader's precedence, so the heading
        // doesn't change once the real query lands.
        title={folder?.title ?? formatFolderName(folder) ?? t('folder.loading')}
        subtitle={<Loader type="dots" />}
        parent={fullFolder?.parents}
        hideTitleAndCustomSubtitle={hasBanner}
        hideBreadcrumbs={hasBanner}
        hasBannerLayout={hasBanner}
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
