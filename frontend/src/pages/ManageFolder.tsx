import { useState } from 'react';
import { BrandingModal } from './management/BrandingModal';
import {
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import {
  AccessLogsIcon,
  BrandingIcon,
  FolderIcon,
  PublicLinkIcon,
} from '../PicrIcons';
import { Page } from '../components/Page';
import { ManagePublicLinks } from './management/ManagePublicLinks';
import { GenerateThumbnailsButton } from './GenerateThumbnailsButton';
import { AccessLogs } from './management/AccessLogs/AccessLogs';
import { useNavigate, useParams } from 'react-router';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { ErrorAlert } from '../components/ErrorAlert';

export const ManageFolder = ({ folder, toggleManaging }) => {
  const { folderId, tab } = useParams();
  const navigate = useNavigate();
  const [, mutate] = useMutation(editFolderMutation);
  const [title, setTitle] = useState(folder.title ?? '');
  const [subtitle, setSubtitle] = useState(folder.subtitle ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const normalizedTitle = title.trim() === '' ? '' : title;
  const normalizedSubtitle = subtitle.trim() === '' ? '' : subtitle;
  const currentTitle = folder.title ?? '';
  const currentSubtitle = folder.subtitle ?? '';
  const isDirty =
    normalizedTitle !== currentTitle || normalizedSubtitle !== currentSubtitle;
  const brandingFolderId = folder?.branding?.folderId;
  const brandingSourceName = folder?.branding?.folder?.name;
  const brandingSourceLabel =
    brandingFolderId && brandingFolderId === folder.id
      ? 'This folder'
      : brandingSourceName
        ? brandingSourceName
        : 'Unknown';

  const setActiveTab = (tab: string) => {
    //TODO: I hate this hard coded navigation but don't know a better way :/
    navigate(`/admin/f/${folderId}/manage/${tab}`);
  };

  const onSave = () => {
    setSaving(true);
    setError('');
    mutate({
      folderId: folder.id,
      title: normalizedTitle,
      subtitle: normalizedSubtitle,
    }).then(({ error }) => {
      setSaving(false);
      if (error) {
        setError(error.toString());
      }
    });
  };

  return (
    <Page>
      <Tabs value={tab ?? 'folder'} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="folder" leftSection={<FolderIcon />}>
            Folder
          </Tabs.Tab>
          <Tabs.Tab value="links" leftSection={<PublicLinkIcon />}>
            Links
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<AccessLogsIcon />}>
            Access Logs
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="folder">
          <Stack>
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm" c="dimmed">
                  Folder Details
                </Text>
                <TextInput
                  label="Title"
                  placeholder={folder.name ?? 'Optional folder title'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <TextInput
                  label="Subtitle"
                  placeholder="Optional folder subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
                <Button loading={saving} onClick={onSave} disabled={!isDirty}>
                  Save
                </Button>
                <ErrorAlert message={error} />
              </Stack>
            </Paper>
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm" c="dimmed">
                  Branding
                </Text>
                <Text size="sm" c="dimmed">
                  Branding source:{' '}
                  <Text span fw={600}>
                    {brandingSourceLabel}
                  </Text>
                </Text>
                <BrandingButton folder={folder} />
              </Stack>
            </Paper>
            <Stack gap="xs">
              <Group justify="flex-start">
                <GenerateThumbnailsButton folderId={folder.id} />
                {/*<Button onClick={toggleManaging}>Close Settings</Button>*/}
              </Group>
            </Stack>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="links">
          <ManagePublicLinks
            folder={folder}
            relations="options"
          ></ManagePublicLinks>
        </Tabs.Panel>
        <Tabs.Panel value="logs">
          <AccessLogs folderId={folder.id} />
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
};
const BrandingButton = ({ folder }) => {
  const folderHasBranding = folder.branding.folderId == folder.id;
  // it might be a branding from parent so lets set sensible defaults if so
  const branding = {
    ...folder.branding,
    folderId: folder.id,
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <BrandingModal branding={branding} onClose={() => setOpen(false)} />
      ) : null}
      <Button
        variant="default"
        leftSection={<BrandingIcon />}
        onClick={() => setOpen(true)}
      >
        {folderHasBranding ? 'Edit Branding' : 'Add Branding'}
      </Button>
    </>
  );
};
