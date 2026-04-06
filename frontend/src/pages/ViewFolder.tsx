import { useMutation, useQuery } from 'urql';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSetFolder } from '../hooks/useSetFolder';
import { useCanDownload, useMe } from '../hooks/useMe';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { useAtom, useSetAtom } from 'jotai';
import { selectedViewAtom, viewOptions } from '../components/selectedViewAtom';
import {
  assignBrandingToFolderAtom,
  editBrandingAtom,
} from '../atoms/editBrandingAtom';
import { BrandingDrawer } from './management/BrandingDrawer';
import { FolderModalManager } from '../components/FolderModalManager';
import { Page } from '../components/Page';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '@shared/hooks/useRequery';
import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import {
  FileSortMenuItems,
  FileSortSelector,
} from '../components/FileListView/FileSortSelector';
import { FolderActivity } from './FolderActivity';
import type { PicrFolder } from '@shared/types/picr';
import { DotsIcon, FolderIcon } from '../PicrIcons';
import { setFolderBrandingMutation } from '@shared/urql/mutations/setFolderBrandingMutation';
import { defaultBranding } from '../helpers/defaultBranding';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { filterAtom } from '@shared/filterAtom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import {
  ManageFolderDrawer,
  ManageFolderDrawerLoading,
} from '../components/ManageFolderDrawer';
import { FolderMenuItems } from '../components/FileListView/FolderMenu';
import { FolderCsvExportModal } from '../components/FileListView/FolderCsvExportModal';
import { FolderBanner } from '../components/FolderBanner';
import { GalleryFooter } from '../components/GalleryFooter';
import { DownloadZipButton } from '../components/DownloadZipButton';

type ViewFolderMode = 'files' | 'manage' | 'activity';

export const ViewFolder = () => {
  const { folderId } = useParams();

  return (
    <>
      <Suspense fallback={<PlaceholderFolderHeader />}>
        <ViewFolderBody key={folderId ?? '1'} />
      </Suspense>
    </>
  );
};

const ViewFolderBody = () => {
  const { folderId, fileId, tab } = useParams();
  const navigate = useNavigate();
  const setFolder = useSetFolder();
  const setThemeMode = useSetAtom(themeModeAtom);
  const [editBranding, setEditBranding] = useAtom(editBrandingAtom);
  const [csvExportOpen, setCsvExportOpen] = useState(false);
  const [assignBrandingToFolderId, setAssignBrandingToFolderId] = useAtom(
    assignBrandingToFolderAtom,
  );
  const [, setFolderBranding] = useMutation(setFolderBrandingMutation);

  const mode: ViewFolderMode = ['manage', 'activity'].includes(fileId ?? '')
    ? (fileId as ViewFolderMode)
    : 'files';
  const managing = mode === 'manage';
  const activity = mode === 'activity';
  const currentFolderId = folderId && folderId !== '' ? folderId : '1';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId: currentFolderId },
  });
  useRequery(reQuery as Parameters<typeof useRequery>[0], 20000);

  const branding = data.data?.folder.branding;
  // Create a stable key from the branding values to avoid re-running effect on object reference changes
  const brandingKey = branding
    ? `${branding.id}-${branding.mode}-${branding.primaryColor}-${branding.headingFontKey}`
    : 'default';
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
  const hasFiles = folder && folder.files.length > 0;

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
  const showOverflow =
    !!folder && (!!me?.isUser || canView || canDownload || !!hasFiles);

  if (mode !== 'activity') {
    if (folder)
      actions.push(<ViewSelectorButton folder={folder} key="ViewSelector" />);
    if (hasFiles)
      actions.push(
        <Box visibleFrom="md" key="FileSortSelector">
          <FileSortSelector />
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
        Back to folder
      </Button>,
    );
  }

  return (
    <>
      <LoggedInHeader
        folder={folder}
        managing={managing}
        flushBottom={Boolean(folder?.bannerImage) && !activity}
      />
      <QuickFind folder={folder} />
      {folder ? <FolderModalManager folder={folder} /> : null}
      {folder ? (
        <FolderCsvExportModal
          folder={folder}
          opened={csvExportOpen}
          onClose={() => setCsvExportOpen(false)}
        />
      ) : null}
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <Title order={1}>Folder Not Found</Title>
      ) : (
        <>
          {!activity ? <FolderBanner folder={folder} /> : null}
          <FolderHeader
            folder={folder}
            customSubtitle={folder.subtitle ?? undefined}
            subtitle={folderSubtitle(folder)}
            actions={<Group>{actions}</Group>}
            hideTitleAndCustomSubtitle={Boolean(folder.bannerImage)}
            hideBreadcrumbs={!activity && Boolean(folder.bannerImage)}
          />
          <TaskSummary folderId={folder.id} />
          {managing && !editBranding ? (
            <Suspense
              fallback={
                <ManageFolderDrawerLoading
                  folderName={folder.name}
                  onClose={() => setFolder(folder)}
                />
              }
            >
              <ManageFolderDrawer
                folder={folder}
                onClose={() => setFolder(folder)}
              />
            </Suspense>
          ) : null}
          {editBranding ? (
            <BrandingDrawer
              branding={editBranding}
              onClose={closeBranding}
              onSaved={onBrandingSaved}
            />
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
              <FolderContentsView folder={folder} />
              <GalleryFooter />
            </>
          ) : null}
        </>
      )}
    </>
  );
};

const ViewSelectorButton = ({ folder }: { folder: PicrFolder }) => {
  const [view, setView] = useAtom(selectedViewAtom);
  const me = useMe();
  const restricted = folder.branding?.availableViews;
  const shownOptions =
    me?.isLink && restricted?.length
      ? viewOptions.filter((v) => restricted.includes(v.name))
      : viewOptions;

  if (shownOptions.length <= 1) return null;

  const restrictedLabel =
    me?.isUser && restricted?.length
      ? `Link users restricted to: ${restricted
          .map(
            (name) => viewOptions.find((v) => v.name === name)?.label ?? name,
          )
          .join(', ')}`
      : null;

  return (
    <Tooltip label={restrictedLabel} disabled={!restrictedLabel} withArrow>
      <Button.Group>
        {shownOptions.map((v) => (
          <Button
            key={v.name}
            variant={view === v.name ? 'filled' : 'default'}
            onClick={() => setView(v.name)}
            title={v.label}
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
}: {
  folder: PicrFolder;
  onCsvExport: () => void;
  hasFiles: boolean;
}) => {
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
      setEditBranding({ ...defaultBranding, name: folder.name ?? '' });
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
      name: folder.name ?? '',
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
          <ActionIcon variant="default" color="gray" size="lg">
            <DotsIcon />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>{folder.name}</Menu.Label>
          <FolderMenuItems
            folder={folder}
            showOpenItem={false}
            onFilterFiles={hasFiles ? () => setFiltering(true) : undefined}
            onCsvExport={onCsvExport}
            onBranding={handleBranding}
          />
          {hasFiles ? (
            <Box hiddenFrom="md">
              <FileSortMenuItems />
            </Box>
          ) : null}
        </Menu.Dropdown>
      </Menu>

      <InheritedBrandingModal
        opened={inheritedDialogOpen}
        onClose={closeInheritedDialog}
        folderName={folder.name ?? 'this folder'}
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
