import { useMutation, useQuery } from 'urql';
import { normalizeDisplayName } from '@shared/displayName';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { FolderContentsView } from '../components/FileListView/FolderContentsView';
import QueryFeedback from '../components/QueryFeedback';
import { TaskSummary } from '../components/TaskSummary';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useSetFolder } from '../hooks/useSetFolder';
import { useCanDownload, useMe } from '../hooks/useMe';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { useAtom, useSetAtom } from 'jotai';
import { selectedViewAtom, viewOptions } from '../components/selectedViewAtom';
import {
  assignBrandingToFolderAtom,
  editBrandingAtom,
} from '../atoms/editBrandingAtom';
import { FolderModalManager } from '../components/FolderModalManager';
import { Page } from '../components/Page';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '@shared/hooks/useRequery';
import {
  FileSortMenuItems,
  FileSortSelector,
} from '../components/FileListView/FileSortSelector';
import type { PicrFolder } from '@shared/types/picr';
import { DotsIcon, FolderIcon } from '../PicrIcons';
import { setFolderBrandingMutation } from '@shared/urql/mutations/setFolderBrandingMutation';
import { recordFolderVisitMutation } from '@shared/urql/mutations/recordFolderVisitMutation';
import { defaultBranding } from '../helpers/defaultBranding';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { filterAtom } from '@shared/filterAtom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { FolderMenuItems } from '../components/FileListView/FolderMenu';
import { FolderBanner } from '../components/FolderBanner';
import { GalleryFooter } from '../components/GalleryFooter';
import { DownloadZipButton } from '../components/DownloadZipButton';
import { viewFolderModeFromFileId } from '../helpers/viewFolderMode';
import { getUUID } from '../helpers/getUUID';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

const LoggedInHeader = lazy(() =>
  import('../components/Header/LoggedInHeader').then((module) => ({
    default: module.LoggedInHeader,
  })),
);
const BrandingDrawer = lazy(() =>
  import('./management/BrandingDrawer').then((module) => ({
    default: module.BrandingDrawer,
  })),
);
const FolderActivity = lazy(() =>
  import('./FolderActivity').then((module) => ({
    default: module.FolderActivity,
  })),
);
const loadFolderCsvExportModal = () =>
  import('../components/FileListView/FolderCsvExportModal').then((module) => ({
    default: module.FolderCsvExportModal,
  }));
const FolderCsvExportModal = lazy(loadFolderCsvExportModal);
const ManageFolderDrawer = lazy(() =>
  import('../components/ManageFolderDrawer').then((module) => ({
    default: module.ManageFolderDrawer,
  })),
);

let publicLinkVisitRecordedUuidForVisibleSession: string | null = null;

export const ViewFolder = () => {
  const { folderId, fileId } = useParams();
  const currentFolderId = folderId ?? '1';

  return (
    <>
      {/* The key must be on the Suspense boundary, not on ViewFolderBody.
          React Router wraps navigation in startTransition, and during a
          transition React deliberately keeps already-revealed content on screen
          rather than showing a fallback - so a keyed child alone leaves you
          staring at the previous folder until the new one has fully loaded.
          Keying the boundary tells React this is different content, so the
          placeholder header shows immediately. */}
      <Suspense
        key={currentFolderId}
        fallback={
          <PlaceholderFolderHeader
            folderId={currentFolderId}
            mode={viewFolderModeFromFileId(fileId)}
          />
        }
      >
        <ViewFolderBody />
      </Suspense>
    </>
  );
};

const ViewFolderBody = () => {
  const { t } = useTranslation('gallery');
  const { folderId, fileId, tab } = useParams();
  const navigate = useNavigate();
  const setFolder = useSetFolder();
  const setThemeMode = useSetAtom(themeModeAtom);
  const mantineTheme = useMantineTheme();
  const sortMenuInOverflow = useMediaQuery(
    `(max-width: ${mantineTheme.breakpoints.md})`,
  );
  const [editBranding, setEditBranding] = useAtom(editBrandingAtom);
  const [csvExportOpen, setCsvExportOpen] = useState(false);
  const [assignBrandingToFolderId, setAssignBrandingToFolderId] = useAtom(
    assignBrandingToFolderAtom,
  );
  const [, setFolderBranding] = useMutation(setFolderBrandingMutation);
  const [, recordFolderVisit] = useMutation(recordFolderVisitMutation);

  const mode = viewFolderModeFromFileId(fileId);
  const managing = mode === 'manage';
  const activity = mode === 'activity';
  const currentFolderId = folderId && folderId !== '' ? folderId : '1';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId: currentFolderId },
  });
  useRequery(reQuery as Parameters<typeof useRequery>[0], 20000);

  const branding = data.data?.folder.branding;
  // Create a stable key from display branding values to avoid re-running the
  // effect on object reference changes while still reacting to visual updates.
  // Memoised so JSON.stringify only runs when the branding reference changes
  // (every poll), not every render.
  const brandingKey = useMemo(
    () =>
      branding
        ? JSON.stringify({
            id: branding.id,
            mode: branding.mode,
            primaryColor: branding.primaryColor,
            headingFontKey: branding.headingFontKey,
            galleryLayout: branding.galleryLayout,
            thumbnailSize: branding.thumbnailSize,
            thumbnailSpacing: branding.thumbnailSpacing,
            thumbnailBorderRadius: branding.thumbnailBorderRadius,
            headingFontSize: branding.headingFontSize,
            headingAlignment: branding.headingAlignment,
            footerTitle: branding.footerTitle,
            footerUrl: branding.footerUrl,
            logoUrl: branding.logoUrl,
            socialLinks: branding.socialLinks,
            defaultFileSort: branding.defaultFileSort,
          })
        : 'default',
    [branding],
  );
  const theme = useMemo(
    () => applyBrandingDefaults(branding),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandingKey],
  );

  useEffect(() => {
    setThemeMode(theme);
  }, [setThemeMode, theme]);

  const me = useMe();
  const canDownload = useCanDownload();
  const { canView } = useCommentPermissions();
  const folder = data.data?.folder;
  const folderLoaded = !!folder;
  const publicLinkUuid = getUUID();

  useEffect(() => {
    if (!publicLinkUuid || !me?.isLink || !folderLoaded) return;

    const recordVisit = () => {
      if (document.visibilityState !== 'visible') return;
      if (publicLinkVisitRecordedUuidForVisibleSession === publicLinkUuid)
        return;

      publicLinkVisitRecordedUuidForVisibleSession = publicLinkUuid;
      void recordFolderVisit({ folderId: currentFolderId });
    };

    recordVisit();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        publicLinkVisitRecordedUuidForVisibleSession = null;
        return;
      }

      recordVisit();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [
    currentFolderId,
    folderLoaded,
    me?.isLink,
    publicLinkUuid,
    recordFolderVisit,
  ]);

  const hasFiles = folder && folder.files.length > 0;
  // Sorting applies to subfolders too (see sortFolderContents), so the sort UI
  // should show whenever the folder has anything in it - not only when it has
  // direct files. This is what lets a folders-only home folder be re-sorted.
  const hasFolders = folder && folder.subFolders.length > 0;
  const hasContent = hasFiles || hasFolders;
  // Only expose the "Date taken" sort when at least one file carries an EXIF
  // capture date - a folder of videos/documents wouldn't benefit from it.
  const hasCaptureDates =
    folder?.files.some(
      (f) => f.__typename === 'Image' && !!f.metadata?.DateTimeOriginal,
    ) ?? false;

  // redirect to 'no file selected' if you are in a valid folder but the file isn't found
  useEffect(() => {
    const fileIds = folder?.files.map((f) => f.id) ?? [];
    if (fileId && fileIds.length > 0 && !managing && !activity) {
      if (!fileIds.includes(fileId)) {
        if (folder) void setFolder(folder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting folder/setFolder to avoid spurious redirects on query refresh
  }, [activity, fileId, managing]);

  // redirect if someone navigates directly to manage/branding without the atom being set
  useEffect(() => {
    if (managing && tab === 'branding' && !editBranding) {
      void navigate(`/admin/f/${currentFolderId}/manage/folder`, {
        replace: true,
      });
    }
  }, [managing, tab, editBranding, navigate, currentFolderId]);

  const closeBranding = () => {
    setEditBranding(null);
    setAssignBrandingToFolderId(null);
    if (managing && folder) {
      void navigate(`/admin/f/${currentFolderId}/manage/folder`);
    }
  };

  const onBrandingSaved = (savedId: string) => {
    if (assignBrandingToFolderId) {
      void setFolderBranding({
        folderId: assignBrandingToFolderId,
        brandingId: savedId,
      });
      setAssignBrandingToFolderId(null);
    }
  };

  const actions = [];
  if (me?.isLink)
    actions.push(<LanguageSwitcher compact key="LanguageSwitcher" />);
  const hasOverflowActions =
    !!folder && (!!me?.isUser || canView || canDownload || !!hasFiles);
  // The sort menu lives in overflow only below the md breakpoint. On desktop the
  // standalone sort button is already visible, so don't show an otherwise-empty
  // dots menu for folders-only public galleries.
  const hasSortOverflowAction = !!folder && !!hasContent && sortMenuInOverflow;
  const showOverflow = hasOverflowActions || hasSortOverflowAction;

  useEffect(() => {
    if (!hasFiles || !showOverflow) return;
    const timeout = window.setTimeout(() => {
      void loadFolderCsvExportModal();
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [hasFiles, showOverflow]);

  if (mode !== 'activity') {
    if (folder)
      actions.push(<ViewSelectorButton folder={folder} key="ViewSelector" />);
    if (hasContent)
      actions.push(
        <Box visibleFrom="md" key="FileSortSelector">
          <FileSortSelector
            hasMetadata={hasCaptureDates}
            hasFiles={!!hasFiles}
            hasFolders={!!hasFolders}
          />
        </Box>,
      );
    if (hasFiles && canDownload && me?.isLink)
      actions.push(<DownloadZipButton folder={folder} key="downloadbutton" />);
    if (showOverflow)
      actions.push(
        <FolderOverflowMenu
          folder={folder}
          key="Overflow"
          onCsvExport={() => setCsvExportOpen(true)}
          hasFiles={!!hasFiles}
          hasFolders={!!hasFolders}
          hasContent={!!hasContent}
          sortMenuInOverflow={!!sortMenuInOverflow}
          hasCaptureDates={hasCaptureDates}
        />,
      );
  } else {
    actions.push(
      <Button
        variant="default"
        onClick={() => {
          if (folder) void setFolder(folder);
        }}
        leftSection={<FolderIcon />}
        key="BackToFolder"
      >
        {t('folder.back')}
      </Button>,
    );
  }

  return (
    <>
      {me?.isUser ? (
        <Suspense fallback={null}>
          <LoggedInHeader
            folder={folder}
            managing={managing}
            flushBottom={Boolean(folder?.bannerImage) && !activity}
          />
        </Suspense>
      ) : null}
      <QuickFind folder={folder} />
      {folder ? <FolderModalManager folder={folder} /> : null}
      {folder && csvExportOpen ? (
        <Suspense fallback={null}>
          <FolderCsvExportModal
            folder={folder}
            opened={csvExportOpen}
            onClose={() => setCsvExportOpen(false)}
          />
        </Suspense>
      ) : null}
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <Title order={1}>{t('folder.notFound')}</Title>
      ) : (
        <>
          {!activity ? <FolderBanner folder={folder} /> : null}
          <FolderHeader
            folder={folder}
            customSubtitle={folder.subtitle ?? undefined}
            subtitle={folderSubtitle(folder, t)}
            actions={<Group>{actions}</Group>}
            hideTitleAndCustomSubtitle={Boolean(folder.bannerImage)}
            hideBreadcrumbs={!activity && Boolean(folder.bannerImage)}
            hasBannerLayout={!activity && Boolean(folder.bannerImage)}
          />
          <TaskSummary folderId={folder.id} />
          {managing && !editBranding ? (
            <Suspense fallback={null}>
              <ManageFolderDrawer
                folder={folder}
                onClose={() => setFolder(folder)}
              />
            </Suspense>
          ) : null}
          {editBranding ? (
            <Suspense fallback={null}>
              <BrandingDrawer
                branding={editBranding}
                onClose={closeBranding}
                onSaved={onBrandingSaved}
              />
            </Suspense>
          ) : null}
          {activity ? (
            <Suspense
              fallback={
                <Page>
                  <Center>
                    <LoadingIndicator />
                  </Center>
                </Page>
              }
            >
              <Page>
                <FolderActivity folderId={folder.id} />
              </Page>
            </Suspense>
          ) : null}
          {!activity ? (
            <>
              {/*<SubfolderListView folder={folder} />*/}
              <FolderContentsView
                folder={folder}
                hasCaptureDates={hasCaptureDates}
              />
              <GalleryFooter />
            </>
          ) : null}
        </>
      )}
    </>
  );
};

const ViewSelectorButton = ({ folder }: { folder: PicrFolder }) => {
  const { t } = useTranslation('gallery');
  const [view, setView] = useAtom(selectedViewAtom);
  const me = useMe();
  const restricted = folder.branding?.availableViews;
  const shownOptions =
    me?.isLink && restricted?.length
      ? viewOptions.filter((v) => restricted.includes(v.key))
      : viewOptions;

  if (shownOptions.length <= 1) return null;

  const restrictedLabel =
    me?.isUser && restricted?.length
      ? `Link users restricted to: ${restricted
          .map((name) => {
            const option = viewOptions.find((v) => v.key === name);
            return option ? t(option.labelKey) : name;
          })
          .join(', ')}`
      : null;

  return (
    <Tooltip label={restrictedLabel} disabled={!restrictedLabel} withArrow>
      <Button.Group>
        {shownOptions.map((v) => (
          <Button
            key={v.key}
            variant={view === v.key ? 'filled' : 'default'}
            onClick={() => setView(v.key)}
            title={t(v.labelKey)}
            px="xs"
          >
            {v.icon}
          </Button>
        ))}
      </Button.Group>
    </Tooltip>
  );
};

const FolderOverflowMenu = ({
  folder,
  onCsvExport,
  hasFiles,
  hasFolders,
  hasContent,
  sortMenuInOverflow,
  hasCaptureDates,
}: {
  folder: PicrFolder;
  onCsvExport: () => void;
  hasFiles: boolean;
  hasFolders: boolean;
  hasContent: boolean;
  sortMenuInOverflow: boolean;
  hasCaptureDates: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const displayFolderName = normalizeDisplayName(folder.name);
  const setFiltering = useSetAtom(filterAtom);
  const setEditBranding = useSetAtom(editBrandingAtom);
  const setAssignBrandingToFolder = useSetAtom(assignBrandingToFolderAtom);
  const [
    inheritedDialogOpen,
    { open: openInheritedDialog, close: closeInheritedDialog },
  ] = useDisclosure(false);

  const hasOwnBranding = !!folder.brandingId;
  const hasInheritedBranding =
    !hasOwnBranding && !!folder.branding && folder.branding.id !== '0';

  const openBrandingForEdit = (branding: NonNullable<typeof folder.branding>) =>
    setEditBranding({
      ...branding,
      socialLinks:
        (branding.socialLinks as SocialLink[] | null | undefined) ?? null,
    });

  const handleBranding = () => {
    if (hasOwnBranding && folder.branding) {
      openBrandingForEdit(folder.branding);
    } else if (hasInheritedBranding) {
      openInheritedDialog();
    } else {
      setAssignBrandingToFolder(folder.id);
      setEditBranding({ ...defaultBranding, name: displayFolderName ?? '' });
    }
  };

  const handleEditInherited = () => {
    closeInheritedDialog();
    if (folder.branding) openBrandingForEdit(folder.branding);
  };

  const handleCreateForFolder = () => {
    closeInheritedDialog();
    setAssignBrandingToFolder(folder.id);
    setEditBranding({
      ...folder.branding,
      socialLinks:
        (folder.branding?.socialLinks as SocialLink[] | null | undefined) ??
        null,
      id: '0',
      name: displayFolderName ?? '',
    });
  };

  return (
    <>
      <Menu
        shadow="md"
        width={200}
        openDelay={0}
        trigger="hover"
        position="bottom-end"
      >
        <Menu.Target>
          <ActionIcon
            variant="default"
            color="gray"
            size="lg"
            aria-label={t('folder.actions')}
          >
            <DotsIcon />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>{displayFolderName}</Menu.Label>
          <FolderMenuItems
            folder={folder}
            showOpenItem={false}
            onFilterFiles={hasFiles ? () => setFiltering(true) : undefined}
            onCsvExport={onCsvExport}
            onBranding={handleBranding}
          />
          {/* Gated on the same JS media query that decides whether the sort
              belongs in overflow, so this can never disagree with the standalone
              desktop button (a CSS hiddenFrom would differ at the md boundary). */}
          {hasContent && sortMenuInOverflow ? (
            <FileSortMenuItems
              hasMetadata={hasCaptureDates}
              hasFiles={hasFiles}
              hasFolders={hasFolders}
            />
          ) : null}
        </Menu.Dropdown>
      </Menu>

      <InheritedBrandingModal
        opened={inheritedDialogOpen}
        onClose={closeInheritedDialog}
        folderName={displayFolderName ?? 'this folder'}
        brandingName={folder.branding?.name ?? 'Unnamed'}
        onEditInherited={handleEditInherited}
        onCreateForFolder={handleCreateForFolder}
      />
    </>
  );
};

const InheritedBrandingModal = ({
  opened,
  onClose,
  folderName,
  brandingName,
  onEditInherited,
  onCreateForFolder,
}: {
  opened: boolean;
  onClose: () => void;
  folderName: string;
  brandingName: string;
  onEditInherited: () => void;
  onCreateForFolder: () => void;
}) => (
  <Modal opened={opened} onClose={onClose} title="Folder Branding" size="sm">
    <Stack>
      <Text>
        <strong>{folderName}</strong> doesn&apos;t have its own branding. It
        currently inherits <strong>{brandingName}</strong>.
      </Text>
      <Button onClick={onCreateForFolder}>
        Create branding for {folderName}
      </Button>
      <Stack gap={4}>
        <Button variant="default" onClick={onEditInherited}>
          Edit {brandingName}
        </Button>
        <Text size="xs" c="dimmed">
          This will affect all folders using {brandingName}.
        </Text>
      </Stack>
      <Button variant="subtle" onClick={onClose}>
        Cancel
      </Button>
    </Stack>
  </Modal>
);
