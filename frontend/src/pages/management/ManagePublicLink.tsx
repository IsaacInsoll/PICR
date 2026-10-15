import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { randomString } from '../../helpers/randomString';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { editUserMutation } from '@shared/urql/mutations/editUserMutation';
import { deleteUserMutation } from '@shared/urql/mutations/deleteUserMutation';
import { generateThumbnailsMutation } from '@shared/urql/mutations/generateThumbnailsMutation';
import { generateThumbnailsQuery } from '@shared/urql/queries/generateThumbnailsQuery';
import type { MutationEditUserArgs } from '@shared/gql/graphql';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Group,
  Loader,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { LinkModeSelector } from '../../components/LinkModeSelector';
import { DateTimePicker } from '@mantine/dates';
import {
  CommentPermissions,
  LinkMode,
  LinkPublicationState,
} from '@shared/gql/graphql';
import {
  AccessLogsIcon,
  DeleteIcon,
  EmailIcon,
  EditIcon,
  LabelIcon,
  PasswordIcon,
  PublicLinkIcon,
  RefreshIcon,
  SaveIcon,
  UsersGroupIcon,
} from '../../PicrIcons';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { publicURLFor } from '../../helpers/copyToClipboard';
import { useBaseUrl } from '../../hooks/useMe';
import { ErrorAlert } from '../../components/ErrorAlert';
import { badChars } from '@shared/badChars';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import { useLanguage } from '../../i18n/useLanguage';
import { dateTimePickerFormatFor } from '../../i18n/mantineDates';
import dayjs from 'dayjs';
import { AccessLogs } from './AccessLogs/AccessLogs';
import { ComingSoonPage } from '../../components/ComingSoonPage';

export const ManagePublicLink = ({
  id,
  folder,
  onClose,
}: {
  id?: string;
  folder?: PicrFolder; //if creating a new public link
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const { t: tGallery } = useTranslation('gallery');
  const { formattingLocale } = useLanguage();
  const formatFolderName = useFolderNameFormatter();
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editUserMutation);
  const [, deleteUser] = useMutation(deleteUserMutation);
  const [, generateThumbnails] = useMutation(generateThumbnailsMutation);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showComingSoonPreview, setShowComingSoonPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  const baseUrl = useBaseUrl();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [link, setLink] = useState(user?.uuid ?? randomString());
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [commentPermissions, setCommentPermissions] =
    useState<CommentPermissions>(
      user?.commentPermissions ?? CommentPermissions.None,
    );
  const [linkMode, setLinkMode] = useState<LinkMode>(
    user?.linkMode ?? LinkMode.FinalDelivery,
  );
  const [publicationState, setPublicationState] =
    useState<LinkPublicationState>(
      user?.publicationState ?? LinkPublicationState.Published,
    );
  const [comingSoonMessage, setComingSoonMessage] = useState(
    user?.comingSoonMessage ?? '',
  );
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState<Date | null>(
    user?.estimatedDeliveryAt ? new Date(user.estimatedDeliveryAt) : null,
  );
  const [galleryPasscode, setGalleryPasscode] = useState(
    user?.galleryPasscode ?? '',
  );
  // Captured once when the editor opens. The lower bound does not need to
  // follow the clock, and reading it during render would be an unmemoizable
  // side effect that React Compiler caches with no way to invalidate it.
  const [earliestExpiration] = useState(() => dayjs().startOf('day').toDate());
  const [expiresAt, setExpiresAt] = useState<Date | null>(
    user?.expiresAt ? new Date(user.expiresAt) : null,
  );
  const [error, setError] = useState('');

  //get folder from user if they exist as it may be a parent or child
  const f = user?.folder ?? folder;
  const folderName = formatFolderName(f);

  // Sharing a folder is the clearest signal that clients are about to look at
  // it, so offer to warm it here rather than leaving the first viewer to wait.
  // Counting missing thumbnails walks the whole subtree, so this stays lazy and
  // never blocks the form: the option simply appears once the count is known.
  const thumbnailQueryContext = useMemo(() => ({ suspense: false }), []);
  const [thumbnailStats] = useQuery({
    query: generateThumbnailsQuery,
    variables: { folderId: f?.id ?? '' },
    pause: !f?.id,
    requestPolicy: 'cache-and-network',
    context: thumbnailQueryContext,
  });
  const thumbnailCompletion = thumbnailStats.data?.folder.thumbnailCompletion;
  const incompleteFiles = thumbnailCompletion?.incompleteFiles ?? 0;
  const checkingThumbnails = thumbnailStats.fetching && !thumbnailCompletion;
  const [generateThumbs, setGenerateThumbs] = useState(true);

  const onSave = () => {
    if (!f?.id) return;
    setError('');
    const data: MutationEditUserArgs = {
      ...(id ? { id } : {}),
      name,
      uuid: link,
      enabled,
      folderId: f.id,
      commentPermissions,
      linkMode,
      publicationState,
      comingSoonMessage,
      estimatedDeliveryAt: estimatedDeliveryAt?.toISOString() ?? null,
      username,
      galleryPasscode,
      expiresAt: expiresAt?.toISOString() ?? null,
    };
    const folderId = f.id;
    void mutate(data).then(({ error }) => {
      if (error) {
        setError(error.toString());
        return;
      }
      // Deliberately not awaited: the link is saved either way, generation is a
      // background queue, and the admin can retrigger it from the folder.
      if (generateThumbs && incompleteFiles > 0) {
        void generateThumbnails({ folderId });
      }
      onClose();
    });
  };

  const badLink = badChars(link);
  const invalidLink =
    badLink.length > 0 ||
    name === '' ||
    link.length < 6 ||
    comingSoonMessage.length > 2000;

  // The field above is only the link ID. Show the URL that will actually be
  // handed to the recipient so it isn't mistaken for something pasteable.
  const publicUrl =
    badLink.length === 0 && link.length >= 6
      ? publicURLFor(baseUrl ?? '', link)
      : undefined;

  const onDelete = () => {
    if (!id) return;
    void deleteUser({ id }).then(({ error }) => {
      if (error) {
        setError(error.toString());
      } else {
        onClose();
      }
    });
  };

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          {t('links.editor.title')} <em>{folderName}</em>{' '}
        </>
      }
      centered
      opened={true}
      size="xl"
      closeButtonProps={{ 'aria-label': t('common.close') }}
    >
      <Stack gap="md">
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
        >
          <Tabs.List>
            <Tabs.Tab
              value="link"
              leftSection={<EditIcon />}
              rightSection={
                publicationState === LinkPublicationState.ComingSoon ? (
                  <Badge size="xs" variant="light">
                    {t('links.editor.comingSoon')}
                  </Badge>
                ) : undefined
              }
            >
              {t('links.editor.tabs.link')}
            </Tabs.Tab>
            <Tabs.Tab value="comingSoon">
              {t('links.editor.comingSoon')}
            </Tabs.Tab>
            {exists ? (
              <Tabs.Tab value="accessLogs" leftSection={<AccessLogsIcon />}>
                {t('links.editor.tabs.accessLogs')}
              </Tabs.Tab>
            ) : null}
          </Tabs.List>

          <Tabs.Panel value="link" pt="md">
            <Stack gap="md">
              <Stack gap="xs">
                <Divider
                  label={t('links.editor.publicUrl')}
                  labelPosition="left"
                />
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <TextInput
                    flex={1}
                    miw={0}
                    leftSection={<PublicLinkIcon />}
                    placeholder={t('links.editor.idPlaceholder')}
                    value={link}
                    label={t('links.editor.publicLink')}
                    description={t('links.editor.publicLinkDescription')}
                    onChange={(e) => setLink(e.currentTarget.value)}
                    error={
                      badLink.length > 0 ? (
                        <Group gap="xs">
                          <Text size="xs">{t('links.editor.cannotUse')}</Text>
                          {badLink.map((l) => (
                            <Code key={l}>
                              {l === ' ' ? t('links.editor.space') : l}
                            </Code>
                          ))}
                        </Group>
                      ) : link.length < 6 ? (
                        t('links.editor.minimumLength')
                      ) : undefined
                    }
                  />
                  <ActionIcon.Group>
                    <Tooltip label={t('links.editor.generatePretty')}>
                      <ActionIcon
                        size="lg"
                        variant="default"
                        onClick={() => {
                          const pretty =
                            normalizeDisplayName(folder?.name)?.replaceAll(
                              ' ',
                              '-',
                            ) +
                            '-' +
                            randomString().substring(0, 4);
                          setLink(pretty);
                        }}
                      >
                        <LabelIcon />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('links.editor.generateRandom')}>
                      <ActionIcon
                        size="lg"
                        variant="default"
                        onClick={() => setLink(randomString())}
                      >
                        <RefreshIcon />
                      </ActionIcon>
                    </Tooltip>
                  </ActionIcon.Group>
                </Group>
                {publicUrl ? (
                  <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                    {t('links.editor.fullLink')} <Code>{publicUrl}</Code>
                  </Text>
                ) : null}
              </Stack>

              <SimpleGrid
                cols={{ base: 1, sm: 2 }}
                spacing="lg"
                verticalSpacing="md"
              >
                <Stack gap="md">
                  <Divider
                    label={t('links.editor.recipient')}
                    labelPosition="left"
                  />
                  <TextInput
                    leftSection={<UsersGroupIcon />}
                    placeholder={t('users.editor.namePlaceholder')}
                    value={name}
                    label={t('users.editor.name')}
                    onChange={(e) => setName(e.currentTarget.value)}
                    error={
                      name.length === 0
                        ? t('links.editor.nameRequired')
                        : undefined
                    }
                  />
                  <TextInput
                    leftSection={<EmailIcon />}
                    label={t('links.editor.email')}
                    value={username}
                    description={t('links.editor.optional')}
                    autoComplete="off"
                    onChange={(e) => setUsername(e.currentTarget.value)}
                  />
                  <PasswordInput
                    leftSection={<PasswordIcon />}
                    label={t('links.editor.passcode')}
                    value={galleryPasscode}
                    description={t('links.editor.optional')}
                    autoComplete="new-password"
                    onChange={(e) => setGalleryPasscode(e.currentTarget.value)}
                  />
                  <DateTimePicker
                    value={expiresAt}
                    onChange={(date) => {
                      if (!date) {
                        setExpiresAt(null);
                        return;
                      }
                      const nextExpiration = dayjs(date);
                      if (nextExpiration.isValid()) {
                        setExpiresAt(nextExpiration.toDate());
                      }
                    }}
                    label={t('links.editor.expiration')}
                    description={t('links.editor.expirationDescription')}
                    defaultTimeValue="23:59"
                    minDate={earliestExpiration}
                    valueFormat={dateTimePickerFormatFor(formattingLocale)}
                    clearable
                  />
                </Stack>

                <Stack gap="md">
                  <Divider
                    label={t('users.editor.access')}
                    labelPosition="left"
                  />
                  <Switch
                    checked={enabled}
                    withThumbIndicator={true}
                    size="md"
                    label={t('links.editor.publicLinkEnabled')}
                    description={t('links.editor.enabledDescription')}
                    onChange={(event) =>
                      setEnabled(event.currentTarget.checked)
                    }
                  />
                  <LinkModeSelector value={linkMode} onChange={setLinkMode} />
                  <CommentPermissionsSelector
                    value={commentPermissions}
                    onChange={setCommentPermissions}
                  />
                </Stack>
              </SimpleGrid>

              {f?.id ? (
                <Box>
                  {checkingThumbnails ? (
                    <Group gap="xs">
                      <Loader size="xs" />
                      <Text size="sm">{t('folder.thumbnails.checking')}</Text>
                    </Group>
                  ) : thumbnailStats.error ? (
                    <ErrorAlert message={thumbnailStats.error.message} />
                  ) : incompleteFiles > 0 ? (
                    <Switch
                      checked={generateThumbs}
                      withThumbIndicator={true}
                      size="md"
                      label={t('folder.thumbnails.generateMissing', {
                        count: incompleteFiles,
                      })}
                      onChange={(event) =>
                        setGenerateThumbs(event.currentTarget.checked)
                      }
                    />
                  ) : thumbnailCompletion ? (
                    <Text size="sm" c="dimmed">
                      {t('folder.thumbnails.completeDescription')}
                    </Text>
                  ) : null}
                </Box>
              ) : null}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="comingSoon" pt="md">
            <Stack gap="md">
              <Switch
                checked={publicationState === LinkPublicationState.ComingSoon}
                withThumbIndicator
                size="md"
                label={t('links.editor.enableComingSoon')}
                description={
                  publicationState === LinkPublicationState.ComingSoon
                    ? t('links.editor.comingSoonDescription')
                    : t('links.editor.publishedDescription')
                }
                onChange={(event) =>
                  setPublicationState(
                    event.currentTarget.checked
                      ? LinkPublicationState.ComingSoon
                      : LinkPublicationState.Published,
                  )
                }
              />
              {publicationState === LinkPublicationState.ComingSoon ? (
                <>
                  <DateTimePicker
                    value={estimatedDeliveryAt}
                    onChange={(date) => {
                      if (!date) {
                        setEstimatedDeliveryAt(null);
                        return;
                      }
                      const estimate = dayjs(date);
                      if (estimate.isValid()) {
                        setEstimatedDeliveryAt(estimate.toDate());
                      }
                    }}
                    label={t('links.editor.estimatedDelivery')}
                    description={t('links.editor.estimatedDeliveryDescription')}
                    valueFormat={dateTimePickerFormatFor(formattingLocale)}
                    clearable
                  />
                  <Textarea
                    label={t('links.editor.comingSoonMessage')}
                    description={t('links.editor.comingSoonMessageDescription')}
                    placeholder={tGallery('comingSoon.description')}
                    value={comingSoonMessage}
                    onChange={(event) =>
                      setComingSoonMessage(event.currentTarget.value)
                    }
                    maxLength={2000}
                    minRows={3}
                    autosize
                  />
                  <Button
                    variant="default"
                    onClick={() => setShowComingSoonPreview(true)}
                  >
                    {t('links.editor.previewComingSoon')}
                  </Button>
                </>
              ) : null}
            </Stack>
          </Tabs.Panel>

          {exists ? (
            <Tabs.Panel value="accessLogs" pt="md">
              {activeTab === 'accessLogs' && f?.id && id ? (
                <AccessLogs
                  folderId={f.id}
                  fixedUserId={id}
                  includeChildren
                  variant="list"
                />
              ) : null}
            </Tabs.Panel>
          ) : null}
        </Tabs>

        <ErrorAlert message={error} />

        <Box
          bg="var(--mantine-color-body)"
          pt="sm"
          style={{ position: 'sticky', bottom: 0, zIndex: 1 }}
        >
          <Group justify="space-between" align="center">
            {exists ? (
              <Button
                color="red"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                leftSection={<DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
            ) : (
              <Box />
            )}
            <Group justify="flex-end">
              <CopyPublicLinkButton disabled={invalidLink} hash={link} />
              <Button disabled={invalidLink} onClick={onSave}>
                <SaveIcon />
                {exists ? t('common.save') : t('links.create')}
              </Button>
            </Group>
          </Group>
        </Box>
      </Stack>

      {showDeleteConfirm ? (
        <Modal
          opened={true}
          onClose={() => setShowDeleteConfirm(false)}
          title={t('links.editor.deleteTitle')}
          centered
          size="sm"
        >
          <Stack>
            <Text>{t('links.editor.deleteConfirmation')}</Text>
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                color="red"
                onClick={onDelete}
                leftSection={<DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
            </Group>
          </Stack>
        </Modal>
      ) : null}
      <Modal
        opened={showComingSoonPreview}
        onClose={() => setShowComingSoonPreview(false)}
        fullScreen
        title={t('links.editor.previewComingSoon')}
        closeButtonProps={{ 'aria-label': t('common.close') }}
      >
        <ComingSoonPage
          galleryName={f?.title || folderName || undefined}
          estimatedDeliveryAt={estimatedDeliveryAt?.toISOString()}
          message={comingSoonMessage}
          preview
        />
      </Modal>
    </Modal>
  );
};
