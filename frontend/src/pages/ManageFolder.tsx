import { useState } from 'react';
import { BrandingModal } from './management/BrandingModal';
import {
  Button,
  Group,
  Paper,
  Select,
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
import { useMutation, useQuery } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { setFolderBrandingMutation } from '@shared/urql/mutations/setFolderBrandingMutation';
import { viewBrandingsQuery } from '@shared/urql/queries/viewBrandingsQuery';
import { ErrorAlert } from '../components/ErrorAlert';
import { defaultBranding } from '../helpers/defaultBranding';
import { Branding } from '../../../graphql-types';

export const ManageFolder = ({ folder }) => {
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
                <BrandingSelector folder={folder} />
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

const BrandingSelector = ({ folder }) => {
  const [brandingsResult] = useQuery({ query: viewBrandingsQuery });
  const [, setFolderBranding] = useMutation(setFolderBrandingMutation);
  const [modalBranding, setModalBranding] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);

  const brandings = brandingsResult.data?.brandings ?? [];
  const currentBrandingId = folder.brandingId?.toString() ?? null;
  const inheritedBranding = folder.branding;
  const isInherited = !folder.brandingId && inheritedBranding?.id !== '0';

  const options = [
    { value: '', label: 'None (inherit from parent)' },
    ...brandings.map((b) => ({ value: b.id, label: b.name ?? 'Unnamed' })),
    { value: '__create__', label: '+ Create new branding...' },
  ];

  const handleChange = async (value: string | null) => {
    if (value === '__create__') {
      setModalBranding({ ...defaultBranding });
      return;
    }

    setSaving(true);
    await setFolderBranding({
      folderId: folder.id,
      brandingId: value || null,
    });
    setSaving(false);
  };

  return (
    <>
      {modalBranding ? (
        <BrandingModal
          branding={modalBranding}
          onClose={() => setModalBranding(null)}
        />
      ) : null}
      <Select
        label="Branding"
        placeholder="Select a branding"
        data={options}
        value={currentBrandingId}
        onChange={handleChange}
        disabled={saving}
        leftSection={<BrandingIcon />}
        clearable={false}
      />
      {isInherited ? (
        <Text size="xs" c="dimmed">
          Currently inheriting: {inheritedBranding?.name ?? 'Default'}
        </Text>
      ) : null}
    </>
  );
};
