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
  Button,
  Center,
  Group,
  Menu,
  Modal,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useFolderLink, useSetFolder } from '../hooks/useSetFolder';
import { useCanDownload, useMe } from '../hooks/useMe';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { useAtom, useSetAtom } from 'jotai';
import {
  assignBrandingToFolderAtom,
  editBrandingAtom,
} from '../atoms/editBrandingAtom';
import { Page } from '../components/Page';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '@shared/hooks/useRequery';
import type { PicrFolder } from '@shared/types/picr';
import { CommentIcon, DotsIcon, FolderIcon } from '../PicrIcons';
import { setFolderBrandingMutation } from '@shared/urql/mutations/setFolderBrandingMutation';
import { recordFolderVisitMutation } from '@shared/urql/mutations/recordFolderVisitMutation';
import { defaultBranding } from '../helpers/defaultBranding';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ModalLoadingIndicator } from '../components/ModalLoadingIndicator';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { FolderMenuItems } from '../components/FileListView/FolderMenu';
import { FolderBanner } from '../components/FolderBanner';
import { GalleryFooter } from '../components/GalleryFooter';
import { DownloadZipButton } from '../components/DownloadZipButton';
import { ManageFolderButton } from '../components/ManageFolderButton';
import { FolderPublicLinks } from '../components/FolderPublicLinks';
import { FolderContentsControls } from '../components/FileListView/FolderContentsToolbar';
import { viewFolderModeFromFileId } from '../helpers/viewFolderMode';
import { getUUID } from '../helpers/getUUID';
import { Trans, useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';
import {
  newPublicLinkId,
  usePublicLinkEditorRoute,
} from '../hooks/usePublicLinkEditorRoute';
// Language switcher soft-disabled (#84) — restore alongside the action below.
// import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

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
const ManagePublicLink = lazy(() =>
  import('./management/ManagePublicLink').then((module) => ({
    default: module.ManagePublicLink,
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
  const {
    selectedLinkId: selectedPublicLinkId,
    closeEditor: closePublicLinkEditor,
  } = usePublicLinkEditorRoute({ returnToPreviousLocationOnClose: true });
  const setFolder = useSetFolder();
  const setThemeMode = useSetAtom(themeModeAtom);
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
  const directPublicLinkId =
    !managing && me?.isUser ? selectedPublicLinkId : null;
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
  // Language switcher soft-disabled (#84).
  // if (me?.isLink)
  //   actions.push(<LanguageSwitcher compact key="LanguageSwitcher" />);
  const showOverflow = !!folder && !!me?.isUser;

  useEffect(() => {
    if (!hasFiles || !showOverflow) return;
    const timeout = window.setTimeout(() => {
      void loadFolderCsvExportModal();
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [hasFiles, showOverflow]);

  if (mode !== 'activity') {
    if (folder && me?.isUser) {
      actions.push(
        <Suspense
          fallback={<Skeleton circle height={40} />}
          key="FolderPublicLinks"
        >
          <FolderPublicLinks folderId={folder.id} />
        </Suspense>,
      );
      actions.push(
        <ManageFolderButton
          folder={folder}
          managing={managing}
          key="ManageFolderButton"
        />,
      );
    }
    if (folder && me?.isLink) {
      actions.push(
        <FolderContentsControls
          folder={folder}
          hasCaptureDates={hasCaptureDates}
          key="FolderContentsControls"
        />,
      );
    }
    if (folder && canView && me?.isLink)
      actions.push(
        <FolderActivityButton folder={folder} key="FolderActivityButton" />,
      );
    if (hasFiles && canDownload && me?.isLink)
      actions.push(<DownloadZipButton folder={folder} key="downloadbutton" />);
    if (showOverflow)
      actions.push(
        <FolderOverflowMenu
          folder={folder}
          key="Overflow"
          onCsvExport={() => setCsvExportOpen(true)}
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
            flushBottom={Boolean(folder?.bannerImage) && !activity}
          />
        </Suspense>
      ) : null}
      <QuickFind folder={folder} />
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
            actions={<Group gap="xs">{actions}</Group>}
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
          {directPublicLinkId !== null ? (
            <Suspense fallback={<ModalLoadingIndicator />}>
              <ManagePublicLink
                key={directPublicLinkId}
                id={
                  directPublicLinkId === newPublicLinkId
                    ? ''
                    : directPublicLinkId
                }
                folder={folder}
                onClose={closePublicLinkEditor}
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

const FolderActivityButton = ({ folder }: { folder: PicrFolder }) => {
  const { t } = useTranslation('gallery');
  const activityLink = useFolderLink(folder, 'activity');
  const label = t('folder.viewActivity');

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        {...activityLink}
        variant="default"
        size="lg"
        aria-label={label}
      >
        <CommentIcon />
      </ActionIcon>
    </Tooltip>
  );
};

const FolderOverflowMenu = ({
  folder,
  onCsvExport,
}: {
  folder: PicrFolder;
  onCsvExport: () => void;
}) => {
  const { t } = useTranslation(['gallery', 'admin']);
  const formatFolderName = useFolderNameFormatter();
  const rawFolderName = normalizeDisplayName(folder.name);
  const localizedFolderName = formatFolderName(folder);
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
      setEditBranding({ ...defaultBranding, name: rawFolderName ?? '' });
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
      name: rawFolderName ?? '',
    });
  };

  return (
    <>
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="default"
            color="gray"
            size="lg"
            aria-label={t('folder.actions')}
            title={t('folder.actions')}
          >
            <DotsIcon />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>{localizedFolderName}</Menu.Label>
          <FolderMenuItems
            folder={folder}
            showOpenItem={false}
            showManageItem={false}
            onCsvExport={onCsvExport}
            onBranding={handleBranding}
          />
        </Menu.Dropdown>
      </Menu>

      <InheritedBrandingModal
        opened={inheritedDialogOpen}
        onClose={closeInheritedDialog}
        folderName={
          localizedFolderName ??
          t('folder.branding.thisFolder', { ns: 'admin' })
        }
        brandingName={
          folder.branding?.name ?? t('common.unnamed', { ns: 'admin' })
        }
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
}) => {
  const { t } = useTranslation('admin');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('folder.branding.modalTitle')}
      size="sm"
    >
      <Stack>
        <Text>
          <Trans
            t={t}
            i18nKey="folder.branding.inheritedDescription"
            values={{ folder: folderName, branding: brandingName }}
            components={{ strong: <strong /> }}
          />
        </Text>
        <Button onClick={onCreateForFolder}>
          {t('folder.branding.createFor', { folder: folderName })}
        </Button>
        <Stack gap={4}>
          <Button variant="default" onClick={onEditInherited}>
            {t('folder.branding.editNamed', { branding: brandingName })}
          </Button>
          <Text size="xs" c="dimmed">
            {t('folder.branding.editWarning', { branding: brandingName })}
          </Text>
        </Stack>
        <Button variant="subtle" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </Stack>
    </Modal>
  );
};
