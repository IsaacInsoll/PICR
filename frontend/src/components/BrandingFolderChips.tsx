import { Badge, Group, Text, Tooltip } from '@mantine/core';
import { useMe } from '../hooks/useMe';
import { useSetFolder } from '../hooks/useSetFolder';

type FolderChip = {
  id: string;
  name?: string | null;
  parents?: Array<{ id: string }> | null;
};

const isAccessible = (folder: FolderChip, myFolderId: string | undefined) => {
  if (!myFolderId || myFolderId === '1') return true;
  return [folder.id, ...(folder.parents ?? []).map((p) => p.id)].includes(
    myFolderId,
  );
};

export const BrandingFolderChips = ({
  folders,
  showLabel = true,
}: {
  folders: FolderChip[] | null | undefined;
  showLabel?: boolean;
}) => {
  const me = useMe();
  const setFolder = useSetFolder();

  if (!folders || folders.length === 0) return null;

  const myFolderId = me?.folderId ?? undefined;

  return (
    <Group gap="xs" wrap="wrap">
      {showLabel && (
        <Text size="sm" c="dimmed" fw={500}>
          Applied to:
        </Text>
      )}
      {folders.map((folder) => {
        const accessible = isAccessible(folder, myFolderId);
        if (accessible) {
          return (
            <Badge
              key={folder.id}
              variant="light"
              style={{ cursor: 'pointer' }}
              onClick={() =>
                setFolder({ id: folder.id, name: folder.name ?? undefined })
              }
            >
              {folder.name ?? folder.id}
            </Badge>
          );
        }
        return (
          <Tooltip
            key={folder.id}
            label="This folder is outside your access scope"
          >
            <Badge variant="outline" color="gray" style={{ cursor: 'default' }}>
              {folder.name ?? folder.id}
            </Badge>
          </Tooltip>
        );
      })}
    </Group>
  );
};
