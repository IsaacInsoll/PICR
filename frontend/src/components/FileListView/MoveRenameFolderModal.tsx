import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { MinimalFolder } from '../../../types';
import { useIsSmallScreen } from '../../hooks/useIsMobile';
import { FolderSelector } from '../FolderSelector';
import { renameFolderMutation } from '@shared/urql/mutations/renameFolderMutation';
import { ModalLoadingIndicator } from '../ModalLoadingIndicator';
import { readAllFoldersQuery } from '@shared/urql/queries/readAllFoldersQuery';
import { useMe } from '../../hooks/useMe';
import {
  validateFolderName,
  validateRelativePath,
} from '@shared/validation/folderPath';

export const MoveRenameFolderModal = ({
  folder,
  opened,
  onClose,
}: {
  folder: MinimalFolder;
  opened: boolean;
  onClose: () => void;
}) => {
  const isMobile = useIsSmallScreen();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Move/Rename Folder: ${folder.name}`}
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
  folder: MinimalFolder;
  opened: boolean;
  onClose: () => void;
}) => {
  const [, mutate] = useMutation(renameFolderMutation);
  const me = useMe();
  const [result] = useQuery({
    query: readAllFoldersQuery,
    variables: { id: me?.folderId },
    pause: !opened,
  });
  const [name, setName] = useState(folder.name ?? '');
  const [parentFolder, setParentFolder] = useState<MinimalFolder>(folder);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foldersList = useMemo(
    () => (result.data?.allFolders ?? []).filter(Boolean),
    [result.data],
  );

  const foldersById = useMemo(() => {
    const map = new Map<string, MinimalFolder>();
    foldersList.forEach((f) => {
      if (f?.id) map.set(f.id, f as MinimalFolder);
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

  const lastInitializedFolderId = useRef<string | undefined>(undefined);
  const initialName = currentFolder.name ?? folder.name ?? '';

  useEffect(() => {
    if (!opened) return;
    if (!foldersById.size) return;
    if (lastInitializedFolderId.current === folder.id) return;
    setName(initialName);
    setParentFolder(defaultParent);
    setError(null);
    lastInitializedFolderId.current = folder.id;
  }, [opened, foldersById.size, initialName, defaultParent, folder.id]);

  const oldPath = buildRelativePath(currentFolder);
  const trimmedName = name.trim();
  const parentPath = buildRelativePath(parentFolder, true);
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
      }),
    [
      foldersList,
      currentFolder,
      parentFolder,
      oldPath,
      newPath,
      trimmedName,
      me,
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

  const handleParentChange = (selected: MinimalFolder) => {
    const resolved = foldersById.get(selected.id) ?? selected;
    setParentFolder(withParents(resolved, foldersById));
  };

  return (
    <Stack>
      {submitting ? <ModalLoadingIndicator /> : null}
      <TextInput
        label="Folder name"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <FolderSelector
        folder={parentFolder}
        setFolder={handleParentChange}
        label="Parent folder"
        description="Move this folder under the selected parent"
      />
      <Text size="sm" c="dimmed">
        New path: {newPath || '--'}
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
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit}>
          Move/Rename
        </Button>
      </Group>
    </Stack>
  );
};

const withParents = (
  folder: MinimalFolder,
  foldersById: Map<string, MinimalFolder>,
) => {
  const parents: MinimalFolder[] = [];
  let current = folder;
  while (current?.parentId) {
    const parent = foldersById.get(current.parentId);
    if (!parent) break;
    parents.push(parent);
    current = parent;
  }
  return { ...folder, parents };
};

const buildRelativePath = (folder?: MinimalFolder) => {
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
}: {
  foldersList: MinimalFolder[];
  currentFolder: MinimalFolder;
  parentFolder: MinimalFolder | null;
  oldPath: string;
  newPath: string;
  trimmedName: string;
  me?: ReturnType<typeof useMe>;
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
    return 'Login required.';
  }
  if (!me.isAdmin) {
    return 'Admin permissions required.';
  }
  if (!me.clientInfo?.canWrite) {
    return 'Server is read-only.';
  }
  if (currentFolder.id === '1' || currentFolder.parentId == null) {
    return 'Root folders cannot be moved or renamed.';
  }
  if (me.folderId && currentFolder.id === me.folderId) {
    return 'Your root folder cannot be moved or renamed.';
  }
  if (oldPath.length === 0) {
    return 'Folder path unavailable for this account.';
  }
  if (validateRelativePath(oldPath)) {
    return 'Folder path invalid.';
  }
  if (!parentFolder) {
    return 'Select a parent folder.';
  }
  if (
    me.folderId &&
    parentFolder.id !== me.folderId &&
    !(parentFolder.parents ?? []).some((p) => p.id === me.folderId)
  ) {
    return 'Select a parent within your root folder.';
  }
  const nameError = validateFolderName(trimmedName);
  if (nameError) return nameError;
  if (validateRelativePath(newPath, { requireNonEmpty: true })) {
    return 'Folder path invalid.';
  }
  if (isSelfParent) {
    return 'Choose a parent folder that is not this folder.';
  }
  if (isDescendant) {
    return 'Cannot move a folder into its own subfolder.';
  }
  if (hasNameConflict) {
    return 'A folder with this name already exists in that location.';
  }
  if (oldPath === newPath) {
    return 'No changes to apply.';
  }
  return null;
};
