import { ActionIcon } from '@mantine/core';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { FileFlag } from '../../../../../graphql-types';
import { useState } from 'react';
import { fileFlagStyles } from './FileFlagBadge';

// Buttons to `approve` and `reject` the selected file
export const FileFlagButtons = ({
  flag,
  onChange,
}: {
  flag: FileFlag;
  onChange: (flag: FileFlag) => void;
}) => {
  // We can't really use disabled prop on this as it removes color from box which is essential to the UI

  const [loading, setLoading] = useState(false);
  const setFlag = async (flag: FileFlag) => {
    setLoading(true);
    await onChange(flag);
    setLoading(false);
  };

  const isApproved = flag == 'approved';
  const isRejected = flag == 'rejected';

  return (
    <>
      <ActionIcon
        variant={isApproved ? 'filled' : 'default'}
        onClick={() => setFlag(!isApproved ? 'approved' : 'none')}
        title="Approve"
        color={fileFlagStyles['approved'].color}
        loading={loading}
      >
        {fileFlagStyles['approved'].icon}
      </ActionIcon>
      <ActionIcon
        variant={isRejected ? 'filled' : 'default'}
        onClick={() => setFlag(!isRejected ? 'rejected' : 'none')}
        title="Reject"
        color={fileFlagStyles['rejected'].color}
        loading={loading}
      >
        {fileFlagStyles['rejected'].icon}
      </ActionIcon>
    </>
  );
};
