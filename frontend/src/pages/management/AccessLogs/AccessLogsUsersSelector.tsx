import { useQuery } from 'urql';
import { manageFolderQuery } from '@shared/urql/queries/manageFolderQuery';
import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const AccessLogsUsersSelector = ({
  folderId,
  userId,
  setUserId,
  includeChildren = false,
}: {
  folderId: string;
  userId?: string;
  setUserId: (userId?: string) => void;
  includeChildren?: boolean;
}) => {
  const { t } = useTranslation('admin');
  const [result] = useQuery({
    query: manageFolderQuery,
    variables: { folderId, includeParents: false, includeChildren },
  });
  const users = result.data?.users ?? [];
  if (!users.length) return null;
  return (
    <Select
      pt="md"
      clearable
      label={t('accessLogs.filterLabel')}
      placeholder={t('accessLogs.filterPlaceholder')}
      value={userId ?? null}
      onChange={(e) => setUserId(e ?? undefined)}
      data={users
        .filter((u) => u.id != null)
        .map((u) => ({
          value: u.id as string,
          label: u.name ?? t('common.unnamed'),
        }))}
    />
  );
};
