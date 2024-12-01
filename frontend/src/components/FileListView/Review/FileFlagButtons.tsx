import { ActionIcon, Tooltip } from '@mantine/core';
import { FileFlag } from '../../../../../graphql-types';
import { useId, useState } from 'react';

import { approvedFlagStyle, rejectedFlagStyle } from './fileFlagStyles';
import { greenBaloonsOptions } from './ConfettiOptions';
import { useReward } from 'react-rewards';

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
  const id = useId();
  const { reward } = useReward(id, 'balloons', greenBaloonsOptions);
  const setFlag = async (flag: FileFlag) => {
    if (flag == 'approved') reward();
    setLoading(true);
    await onChange(flag);
    setLoading(false);
  };

  const isApproved = flag == 'approved';
  const isRejected = flag == 'rejected';

  return (
    <>
      <span id={id} />
      <Tooltip label="Approve (Thumbs Up)">
        <ActionIcon
          variant={isApproved ? 'filled' : 'default'}
          onClick={() => setFlag(!isApproved ? 'approved' : 'none')}
          title="Approve"
          color={approvedFlagStyle.color}
          loading={loading}
        >
          {approvedFlagStyle.icon}
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Reject (Thumbs Down)">
        <ActionIcon
          variant={isRejected ? 'filled' : 'default'}
          onClick={() => setFlag(!isRejected ? 'rejected' : 'none')}
          title="Reject"
          color={rejectedFlagStyle.color}
          loading={loading}
        >
          {rejectedFlagStyle.icon}
        </ActionIcon>
      </Tooltip>
    </>
  );
};
