import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import type { PicrFolder } from '@shared/types/picr';
import { useIsSmallScreen } from '../../hooks/useIsMobile';
import { FolderSelector } from '../FolderSelector';
import { renameFolderMutation } from '@shared/urql/mutations/renameFolderMutation';
import { ModalLoadingIndicator } from '../ModalLoadingIndicator';
import { readAllFoldersQuery } from '@shared/urql/queries/readAllFoldersQuery';
import { useMe } from '../../hooks/useMe';
import type { AllFoldersRow } from '@shared/types/queryRows';
import {
  validateFolderNameCode,
  validateRelativePath,
} from '@shared/validation/folderPath';
import { useTranslation } from 'react-i18next';
import type { AdminT } from '../../i18n/adminLabels';

export const MoveRenameFolderModal = ({
  folder,
  opened,
  onClose,
}: {
  folder: PicrFolder;
  opened: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const isMobile = useIsSmallScreen();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('folder.moveRename.title', {
        folder: normalizeDisplayName(folder.name),
      })}
      centered
      fullScreen={isMobile}
      overlayProps={{ blur: 3 }}
    >
      <Suspense fallback={<ModalLoadingIndicator />}>
        <MoveRenameFolderModalBody
          folder={folder}
          opened={opened}
          onClose={onClose}
        />
      </Suspense>
    </Modal>
  );
};

const MoveRenameFolderModalBody = ({
  folder,
  opened,
  onClose,
}: {
  folder: PicrFolder;
  opened: boolean;
  onClose: () => void;
}) => {
  const me = useMe();
  const homeFolderId = me?.folderId;
  const [result] = useQuery({
    query: readAllFoldersQuery,
    variables: { id: homeFolderId || folder.id },
    pause: !opened || !homeFolderId,
  });

  const foldersList = useMemo(
    () =>
      (result.data?.allFolders ?? []).filter(
        (f): f is AllFoldersRow => f != null,
      ),
    [result.data],
  );

  const foldersById = useMemo(() => {
    const map = new Map<string, PicrFolder>();
    foldersList.forEach((f) => {
      if (f.id) map.set(f.id, f);
    });
    return map;
  }, [foldersList]);

  const currentFolder = withParents(
    foldersById.get(folder.id) ?? folder,
    foldersById,
  );
  const defaultParent = currentFolder.parentId
    ? withParents(
        foldersById.get(currentFolder.parentId) ?? currentFolder,
        foldersById,
      )
    : currentFolder;
  const initialName = currentFolder.name ?? folder.name ?? '';

  if (!foldersById.size) {
    return <ModalLoadingIndicator />;
  }

  return (
    <MoveRenameFolderModalForm
      key={`${folder.id}:${opened ? 'open' : 'closed'}:${currentFolder.parentId ?? 'root'}:${currentFolder.name ?? ''}`}
      folder={folder}
      currentFolder={currentFolder}
      defaultParent={defaultParent}
      foldersById={foldersById}
      foldersList={foldersList}
      initialName={initialName}
      onClose={onClose}
    />
  );
};

const MoveRenameFolderModalForm = ({
  folder,
  currentFolder,
  defaultParent,
  foldersById,
  foldersList,
  initialName,
  onClose,
}: {
  folder: PicrFolder;
  currentFolder: PicrFolder;
  defaultParent: PicrFolder;
  foldersById: Map<string, PicrFolder>;
  foldersList: PicrFolder[];
  initialName: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const [, mutate] = useMutation(renameFolderMutation);
  const me = useMe();
  const [name, setName] = useState(initialName);
  const [parentFolder, setParentFolder] = useState<PicrFolder>(defaultParent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oldPath = buildRelativePath(currentFolder);
  const trimmedName = name.trim();
  const parentPath = buildRelativePath(parentFolder);
  const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
  const validationError = useMemo(
    () =>
      validateMoveRename({
        foldersList,
        currentFolder,
        parentFolder,
        oldPath,
        newPath,
        trimmedName,
        me,
        t,
      }),
    [
      foldersList,
      currentFolder,
      parentFolder,
      oldPath,
      newPath,
      trimmedName,
      me,
      t,
    ],
  );

  const canSubmit = !validationError && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await mutate({
      folderId: folder.id,
      oldPath,
      newPath,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onClose();
  };
  const handleSubmit = () => {
    void onSubmit();
  };

  const handleParentChange = (selected: PicrFolder) => {
    const resolved = foldersById.get(selected.id) ?? selected;
    setParentFolder(withParents(resolved, foldersById));
  };

  return (
    <Stack>
      {submitting ? <ModalLoadingIndicator /> : null}
      <TextInput
        label={t('folder.moveRename.name')}
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <FolderSelector
        folder={parentFolder}
        setFolder={handleParentChange}
        label={t('folder.moveRename.parent')}
        description={t('folder.moveRename.parentDescription')}
      />
      <Text size="sm" c="dimmed">
        {t('folder.moveRename.newPath', { path: newPath || '--' })}
      </Text>
      {validationError ? (
        <Text size="sm" c="red">
          {validationError}
        </Text>
      ) : null}
      {error ? (
        <Text size="sm" c="red">
          {error}
        </Text>
      ) : null}
      <Group justify="end">
        <Button variant="default" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {t('folder.moveRename.action')}
        </Button>
      </Group>
    </Stack>
  );
};

const withParents = (
  folder: PicrFolder,
  foldersById: Map<string, PicrFolder>,
) => {
  const parents: PicrFolder[] = [];
  let current = folder;
  while (current.parentId) {
    const parent = foldersById.get(current.parentId);
    if (!parent) break;
    parents.push(parent);
    current = parent;
  }
  return { ...folder, parents };
};

const buildRelativePath = (folder?: PicrFolder) => {
  if (!folder?.name) return '';
  if (folder.parentId == null) return '';
  const parents = folder.parents ?? [];
  const names = parents
    .slice()
    .reverse()
    .filter((p) => p.parentId != null)
    .map((p) => p.name)
    .filter(Boolean);
  names.push(folder.name);
  return names.join('/');
};

const validateMoveRename = ({
  foldersList,
  currentFolder,
  parentFolder,
  oldPath,
  newPath,
  trimmedName,
  me,
  t,
}: {
  foldersList: PicrFolder[];
  currentFolder: PicrFolder;
  parentFolder: PicrFolder | null;
  oldPath: string;
  newPath: string;
  trimmedName: string;
  me?: ReturnType<typeof useMe>;
  t: AdminT;
}) => {
  const isSelfParent = parentFolder?.id === currentFolder.id;
  const isDescendant =
    parentFolder?.parents?.some((p) => p.id === currentFolder.id) ?? false;
  const normalizedName = trimmedName.toLocaleLowerCase();
  const hasNameConflict =
    !!normalizedName &&
    foldersList.some(
      (f) =>
        f.id !== currentFolder.id &&
        f.parentId === parentFolder?.id &&
        (f.name ?? '').trim().toLocaleLowerCase() === normalizedName,
    );

  if (!me) {
    return t('folder.moveRename.validation.loginRequired');
  }
  if (!me.isAdmin) {
    return t('folder.moveRename.validation.adminRequired');
  }
  if (!me.clientInfo.canWrite) {
    return t('folder.moveRename.validation.readOnly');
  }
  if (currentFolder.id === '1' || currentFolder.parentId == null) {
    return t('folder.moveRename.validation.rootFolder');
  }
  if (me.folderId && currentFolder.id === me.folderId) {
    return t('folder.moveRename.validation.accountRoot');
  }
  if (oldPath.length === 0) {
    return t('folder.moveRename.validation.pathUnavailable');
  }
  if (validateRelativePath(oldPath)) {
    return t('folder.moveRename.validation.pathInvalid');
  }
  if (!parentFolder) {
    return t('folder.moveRename.validation.selectParent');
  }
  if (
    me.folderId &&
    parentFolder.id !== me.folderId &&
    !(parentFolder.parents ?? []).some((p) => p.id === me.folderId)
  ) {
    return t('folder.moveRename.validation.parentOutsideRoot');
  }
  const nameError = validateFolderNameCode(trimmedName);
  if (nameError) return t(`folder.moveRename.validation.name.${nameError}`);
  if (validateRelativePath(newPath, { requireNonEmpty: true })) {
    return t('folder.moveRename.validation.pathInvalid');
  }
  if (isSelfParent) {
    return t('folder.moveRename.validation.selfParent');
  }
  if (isDescendant) {
    return t('folder.moveRename.validation.descendant');
  }
  if (hasNameConflict) {
    return t('folder.moveRename.validation.conflict');
  }
  if (oldPath === newPath) {
    return t('folder.moveRename.validation.noChanges');
  }
  return null;
};
