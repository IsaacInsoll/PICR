import { Badge, Group, Text, Tooltip } from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import { useMe } from '../hooks/useMe';
import { useFolderLink } from '../hooks/useSetFolder';

type FolderChip = {
  id: string;
  name?: string | null;
  parents?: Array<{ id: string }> | null;
};

// Extracted so each chip can call useFolderLink - hooks can't run inside the
// .map() over folders.
const AccessibleFolderChip = ({ folder }: { folder: FolderChip }) => (
  <Badge
    variant="light"
    style={{ cursor: 'pointer' }}
    {...useFolderLink({ id: folder.id })}
  >
    {normalizeDisplayName(folder.name) ?? folder.id}
  </Badge>
);

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
          return <AccessibleFolderChip key={folder.id} folder={folder} />;
        }
        return (
          <Tooltip
            key={folder.id}
            label="This folder is outside your access scope"
          >
            <Badge variant="outline" color="gray" style={{ cursor: 'default' }}>
              {normalizeDisplayName(folder.name) ?? folder.id}
            </Badge>
          </Tooltip>
        );
      })}
    </Group>
  );
};
