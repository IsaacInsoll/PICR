import { useQuery } from 'urql';
import { manageFolderQuery } from '../../../urql/queries/manageFolderQuery';
import { Select } from '@mantine/core';

export const AccessLogsUsersSelector = ({
  folderId,
  userId,
  setUserId,
  includeChildren = false,
}: {
  folderId: string;
  userId: string;
  setUserId: (userId: string) => void;
  includeChildren?: boolean;
}) => {
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
      label="Filter by Link"
      placeholder="<Any user or link>"
      value={userId}
      onChange={(e) => setUserId(e)}
      data={users.map((u) => ({ value: u.id, label: u.name }))}
    />
  );
};
