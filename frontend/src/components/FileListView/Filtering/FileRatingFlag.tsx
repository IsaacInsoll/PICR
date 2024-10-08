import { ActionIcon } from '@mantine/core';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { FileFlag } from '../../../../../graphql-types';
import { useState } from 'react';

export const FileRatingFlag = ({
  flag,
  onChange,
}: {
  flag: FileFlag;
  onChange: (flag: FileFlag) => void;
}) => {
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
        color="green"
        loading={loading}
      >
        <TbThumbUp />
      </ActionIcon>
      <ActionIcon
        variant={isRejected ? 'filled' : 'default'}
        onClick={() => setFlag(!isRejected ? 'rejected' : 'none')}
        title="Reject"
        color="red"
        loading={loading}
      >
        <TbThumbDown />
      </ActionIcon>
    </>
  );
};
