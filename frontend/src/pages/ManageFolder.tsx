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
import { ScanFolderButton } from './ScanFolderButton';
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
import type { BrandingInput } from './management/BrandingForm';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';

export const ManageFolder = ({ folder }: { folder: PicrFolder }) => {
  const { t } = useTranslation('admin');
  const formatFolderName = useFolderNameFormatter();
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
    void navigate(`/admin/f/${folderId}/manage/${tab}`);
  };

  const onSave = () => {
    setSaving(true);
    setError('');
    void mutate({
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
          {t('folder.tabs.folder')}
        </Tabs.Tab>
        <Tabs.Tab value="links" leftSection={<PublicLinkIcon />}>
          {t('folder.tabs.links')}
        </Tabs.Tab>
        <Tabs.Tab value="logs" leftSection={<AccessLogsIcon />}>
          {t('folder.tabs.accessLogs')}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="folder">
        <Stack>
          <Paper p="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Text fw={600} size="sm" c="dimmed">
                {t('folder.details')}
              </Text>
              <TextInput
                label={t('folder.title')}
                placeholder={
                  formatFolderName(folder) ?? t('folder.titlePlaceholder')
                }
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
              />
              <TextInput
                label={t('folder.subtitle')}
                placeholder={t('folder.subtitlePlaceholder')}
                value={subtitle}
                onChange={(e) => setSubtitle(e.currentTarget.value)}
              />
              <Button loading={saving} onClick={onSave} disabled={!isDirty}>
                {t('common.save')}
              </Button>
              <ErrorAlert message={error} />
            </Stack>
          </Paper>
          <Paper p="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Text fw={600} size="sm" c="dimmed">
                {t('settings.tabs.branding')}
              </Text>
              <BrandingSelector folder={folder} />
            </Stack>
          </Paper>
          <Stack gap="xs">
            <Group justify="flex-start">
              <ScanFolderButton folderId={folder.id} />
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
  const { t } = useTranslation('admin');
  const { folderId } = useParams();
  const navigate = useNavigate();
  const setEditBranding = useSetAtom(editBrandingAtom);
  const setAssignBrandingToFolder = useSetAtom(assignBrandingToFolderAtom);
  const [brandingsResult] = useQuery({ query: viewBrandingsQuery });
  const [, setFolderBranding] = useMutation(setFolderBrandingMutation);
  const [saving, setSaving] = useState(false);

  const brandings = brandingsResult.data?.brandings ?? [];
  const currentBrandingId = folder.brandingId?.toString() || null;
  const inheritedBranding = folder.branding ?? null;
  const isInherited = !folder.brandingId && inheritedBranding?.id !== '0';

  const options = [
    { value: '', label: t('folder.branding.inherit') },
    { value: '__create__', label: t('folder.branding.create') },
    ...brandings.map((b) => ({
      value: b.id,
      label: b.name ?? t('common.unnamed'),
    })),
  ];

  const selectedBranding = currentBrandingId
    ? (brandings.find((b) => b.id === currentBrandingId) ?? null)
    : null;

  const openBranding = (b: BrandingInput) => {
    setEditBranding(b);
    void navigate(`/admin/f/${folderId}/manage/branding`);
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
                  SocialLink[] | null | undefined) ?? null,
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
  const onBrandingChange = (value: string | null) => {
    void handleChange(value);
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
          label={t('settings.tabs.branding')}
          placeholder={t('folder.branding.select')}
          data={options}
          value={currentBrandingId}
          onChange={onBrandingChange}
          disabled={saving}
          leftSection={<BrandingIcon />}
          clearable={false}
          allowDeselect={false}
          style={{ flex: 1 }}
        />
        <Tooltip label={t('folder.branding.edit')}>
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
          {t('folder.branding.currentlyInheriting', {
            name: inheritedBranding?.name ?? t('folder.branding.default'),
          })}
        </Text>
      ) : null}
    </>
  );
};
