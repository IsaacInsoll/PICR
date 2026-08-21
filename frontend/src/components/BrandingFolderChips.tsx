import { Badge, Group, Text, Tooltip } from '@mantine/core';
import { useMe } from '../hooks/useMe';
import { useFolderLink } from '../hooks/useSetFolder';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';

type FolderChip = {
  id: string;
  name?: string | null;
  parentId?: string | null;
  parents?: Array<{ id: string }> | null;
};

// Extracted so each chip can call useFolderLink - hooks can't run inside the
// .map() over folders.
const AccessibleFolderChip = ({ folder }: { folder: FolderChip }) => {
  const formatFolderName = useFolderNameFormatter();
  return (
    <Badge
      variant="light"
      style={{ cursor: 'pointer' }}
      {...useFolderLink({ id: folder.id })}
    >
      {formatFolderName(folder) ?? folder.id}
    </Badge>
  );
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
  const { t } = useTranslation('admin');
  const formatFolderName = useFolderNameFormatter();
  const me = useMe();

  if (!folders || folders.length === 0) return null;

  const myFolderId = me?.folderId ?? undefined;

  return (
    <Group gap="xs" wrap="wrap">
      {showLabel && (
        <Text size="sm" c="dimmed" fw={500}>
          {t('branding.appliedTo')}
        </Text>
      )}
      {folders.map((folder) => {
        const accessible = isAccessible(folder, myFolderId);
        if (accessible) {
          return <AccessibleFolderChip key={folder.id} folder={folder} />;
        }
        return (
          <Tooltip key={folder.id} label={t('branding.outsideScope')}>
            <Badge variant="outline" color="gray" style={{ cursor: 'default' }}>
              {formatFolderName(folder) ?? folder.id}
            </Badge>
          </Tooltip>
        );
      })}
    </Group>
  );
};
