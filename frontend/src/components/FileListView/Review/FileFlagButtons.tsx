import { ActionIcon, Tooltip } from '@mantine/core';
import { FileFlag } from '@shared/gql/graphql';
import { useId, useState } from 'react';
import type { ReviewButtonVariant } from './FileReview';

import { approvedFlagStyle, rejectedFlagStyle } from './fileFlagStyles';
import { greenBaloonsOptions } from './ConfettiOptions';
import { useReward } from 'react-rewards';

// Buttons to `approve` and `reject` the selected file

export const FileFlagButtons = ({
  flag,
  onChange,
  variant = 'default',
}: {
  flag: FileFlag;
  onChange: (flag: FileFlag) => void;
  variant?: ReviewButtonVariant;
}) => {
  // We can't really use disabled prop on this as it removes color from box which is essential to the UI

  const [loading, setLoading] = useState(false);
  const id = useId();
  const { reward } = useReward(id, 'balloons', greenBaloonsOptions);

  // Derived state must be declared *before* the handlers that read it. These
  // used to sit below, so the callbacks closed over a binding defined later in
  // the block; React Compiler memoises in source order, which left the handlers
  // holding a stale value while the JSX below rendered the fresh one — the
  // button looked toggled but the next click re-sent the previous action.
  const isApproved = flag === FileFlag.Approved;
  const isRejected = flag === FileFlag.Rejected;

  // `next` rather than `flag`: shadowing the prop here made the staleness above
  // much harder to see.
  const setFlag = async (next: FileFlag) => {
    if (next === FileFlag.Approved) reward();
    setLoading(true);
    await onChange(next);
    setLoading(false);
  };
  const handleApproveClick = () => {
    void setFlag(isApproved ? FileFlag.None : FileFlag.Approved);
  };
  const handleRejectClick = () => {
    void setFlag(isRejected ? FileFlag.None : FileFlag.Rejected);
  };

  return (
    <>
      <span id={id} />
      <Tooltip label="Approve (Thumbs Up)">
        <ActionIcon
          variant={isApproved ? 'filled' : variant}
          onClick={handleApproveClick}
          title="Approve"
          // Colour only when set. The `default` variant ignores `color`, but
          // `subtle` applies it to the icon — so passing it unconditionally
          // would make every file look permanently approved/rejected.
          color={isApproved ? approvedFlagStyle.color : undefined}
          loading={loading}
        >
          {approvedFlagStyle.icon}
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Reject (Thumbs Down)">
        <ActionIcon
          variant={isRejected ? 'filled' : variant}
          onClick={handleRejectClick}
          title="Reject"
          color={isRejected ? rejectedFlagStyle.color : undefined}
          loading={loading}
        >
          {rejectedFlagStyle.icon}
        </ActionIcon>
      </Tooltip>
    </>
  );
};
