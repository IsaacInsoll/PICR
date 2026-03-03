import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  AccessLogsIcon,
  BrandingIcon,
  EditIcon,
  FolderIcon,
  PublicLinkIcon,
} from '../PicrIcons';
import { ManagePublicLinks } from './management/ManagePublicLinks';
import { GenerateThumbnailsButton } from './GenerateThumbnailsButton';
import { AccessLogs } from './management/AccessLogs/AccessLogs';
import { useNavigate, useParams } from 'react-router';
import { useSetAtom } from 'jotai';
import {
  assignBrandingToFolderAtom,
  editBrandingAtom,
} from '../atoms/editBrandingAtom';
import { useMutation, useQuery } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { setFolderBrandingMutation } from '@shared/urql/mutations/setFolderBrandingMutation';
import { viewBrandingsQuery } from '@shared/urql/queries/viewBrandingsQuery';
import { ErrorAlert } from '../components/ErrorAlert';
import { defaultBranding } from '../helpers/defaultBranding';
import type { PicrFolder } from '@shared/types/picr';
import type { BrandingRow } from '@shared/types/queryRows';
import type { BrandingInput } from './management/BrandingForm';
import type { SocialLink } from '@shared/branding/socialLinkTypes';

export const ManageFolder = ({ folder }: { folder: PicrFolder }) => {
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

  const setActiveTab = (tab: string | null) => {
    if (!tab) return;
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
                onChange={(e) => setTitle(e.currentTarget.value)}
              />
              <TextInput
                label="Subtitle"
                placeholder="Optional folder subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.currentTarget.value)}
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
              <BrandingSelector folder={folder} />
            </Stack>
          </Paper>
          <Stack gap="xs">
            <Group justify="flex-start">
              <GenerateThumbnailsButton folderId={folder.id} />
            </Group>
          </Stack>
        </Stack>
      </Tabs.Panel>
      <Tabs.Panel value="links">
        <ManagePublicLinks folder={folder} relations="options" variant="list" />
      </Tabs.Panel>
      <Tabs.Panel value="logs">
        <AccessLogs folderId={folder.id} variant="list" />
      </Tabs.Panel>
    </Tabs>
  );
};

const BrandingSelector = ({ folder }: { folder: PicrFolder }) => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const setEditBranding = useSetAtom(editBrandingAtom);
  const setAssignBrandingToFolder = useSetAtom(assignBrandingToFolderAtom);
  const [brandingsResult] = useQuery({ query: viewBrandingsQuery });
  const [, setFolderBranding] = useMutation(setFolderBrandingMutation);
  const [saving, setSaving] = useState(false);

  const brandings = (brandingsResult.data?.brandings ?? []).filter(
    (b): b is BrandingRow => b != null,
  );
  const currentBrandingId = folder.brandingId?.toString() ?? null;
  const inheritedBranding = folder.branding ?? null;
  const isInherited = !folder.brandingId && inheritedBranding?.id !== '0';

  const options = [
    { value: '', label: 'None (inherit from parent)' },
    { value: '__create__', label: '+ Create new branding...' },
    ...brandings.map((b) => ({ value: b.id, label: b.name ?? 'Unnamed' })),
  ];

  const selectedBranding = currentBrandingId
    ? (brandings.find((b) => b.id === currentBrandingId) ?? null)
    : null;

  const openBranding = (b: BrandingInput) => {
    setEditBranding(b);
    navigate(`/admin/f/${folderId}/manage/branding`);
  };

  const handleChange = async (value: string | null) => {
    if (value === '__create__') {
      setAssignBrandingToFolder(folder.id);
      openBranding({
        ...(inheritedBranding && inheritedBranding.id !== '0'
          ? {
              ...inheritedBranding,
              socialLinks:
                (inheritedBranding.socialLinks as
                  | SocialLink[]
                  | null
                  | undefined) ?? null,
            }
          : defaultBranding),
        id: '0',
        name: folder.name ?? '',
      });
      return;
    }

    setSaving(true);
    await setFolderBranding({
      folderId: folder.id,
      brandingId: value || null,
    });
    setSaving(false);
  };

  const handleEdit = () => {
    if (!selectedBranding) return;
    openBranding({
      ...selectedBranding,
      socialLinks:
        (selectedBranding.socialLinks as SocialLink[] | null | undefined) ??
        null,
    });
  };

  return (
    <>
      <Group align="flex-end" gap="xs">
        <Select
          label="Branding"
          placeholder="Select a branding"
          data={options}
          value={currentBrandingId}
          onChange={handleChange}
          disabled={saving}
          leftSection={<BrandingIcon />}
          clearable={false}
          allowDeselect={false}
          style={{ flex: 1 }}
        />
        <Tooltip label="Edit branding">
          <ActionIcon
            variant="default"
            size="lg"
            disabled={!selectedBranding}
            onClick={handleEdit}
          >
            <EditIcon />
          </ActionIcon>
        </Tooltip>
      </Group>
      {isInherited ? (
        <Text size="xs" c="dimmed">
          Currently inheriting: {inheritedBranding?.name ?? 'Default'}
        </Text>
      ) : null}
    </>
  );
};
