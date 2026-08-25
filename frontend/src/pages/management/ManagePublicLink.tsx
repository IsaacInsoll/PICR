import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { randomString } from '../../helpers/randomString';
import { useState } from 'react';
import { useMutation } from 'urql';
import { editUserMutation } from '@shared/urql/mutations/editUserMutation';
import { deleteUserMutation } from '@shared/urql/mutations/deleteUserMutation';
import type { MutationEditUserArgs } from '@shared/gql/graphql';
import {
  ActionIcon,
  Box,
  Button,
  Code,
  Divider,
  Group,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { LinkModeSelector } from '../../components/LinkModeSelector';
import { DateTimePicker } from '@mantine/dates';
import { CommentPermissions, LinkMode } from '@shared/gql/graphql';
import {
  DeleteIcon,
  EmailIcon,
  LabelIcon,
  PasswordIcon,
  PublicLinkIcon,
  RefreshIcon,
  SaveIcon,
  UsersGroupIcon,
} from '../../PicrIcons';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { ErrorAlert } from '../../components/ErrorAlert';
import { badChars } from '@shared/badChars';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import { useLanguage } from '../../i18n/useLanguage';
import { dateTimePickerFormatFor } from '../../i18n/mantineDates';
import dayjs from 'dayjs';

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
  const { formattingLocale } = useLanguage();
  const formatFolderName = useFolderNameFormatter();
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editUserMutation);
  const [, deleteUser] = useMutation(deleteUserMutation);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      username,
      galleryPasscode,
      expiresAt: expiresAt?.toISOString() ?? null,
    };
    void mutate(data).then(({ error }) => {
      if (error) {
        setError(error.toString());
      } else {
        onClose();
      }
    });
  };

  const badLink = badChars(link);
  const invalidLink = badLink.length > 0 || name === '' || link.length < 6;

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
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Divider label={t('links.editor.publicUrl')} labelPosition="left" />
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
                      normalizeDisplayName(folder?.name)?.replaceAll(' ', '-') +
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
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing="md">
          <Stack gap="md">
            <Divider label={t('links.editor.recipient')} labelPosition="left" />
            <TextInput
              leftSection={<UsersGroupIcon />}
              placeholder={t('users.editor.namePlaceholder')}
              value={name}
              label={t('users.editor.name')}
              onChange={(e) => setName(e.currentTarget.value)}
              error={
                name.length === 0 ? t('links.editor.nameRequired') : undefined
              }
            />
            <TextInput
              leftSection={<EmailIcon />}
              label={t('links.editor.email')}
              value={username}
              description={t('links.editor.optional')}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />
            <PasswordInput
              leftSection={<PasswordIcon />}
              label={t('links.editor.passcode')}
              value={galleryPasscode}
              description={t('links.editor.optional')}
              onChange={(e) => setGalleryPasscode(e.currentTarget.value)}
            />
            <Switch
              checked={enabled}
              label={t('common.enabled')}
              description={t('links.editor.enabledDescription')}
              onChange={(event) => setEnabled(event.currentTarget.checked)}
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
            <Divider label={t('users.editor.access')} labelPosition="left" />
            <LinkModeSelector value={linkMode} onChange={setLinkMode} />
            <CommentPermissionsSelector
              value={commentPermissions}
              onChange={setCommentPermissions}
            />
          </Stack>
        </SimpleGrid>

        {/* Advanced section reserved for future lower-priority link options. */}

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
              <CopyPublicLinkButton
                disabled={invalidLink}
                folderId={f?.id}
                hash={link}
              />
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
    </Modal>
  );
};
