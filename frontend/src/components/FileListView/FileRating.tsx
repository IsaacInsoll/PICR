import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Indicator,
  Rating,
  SegmentedControl,
} from '@mantine/core';
import { useState } from 'react';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { BiComment, BiCommentDetail } from 'react-icons/bi';
import { MinimalFile } from '../../../types';

export const FileRating = ({ file }: { file: MinimalFile }) => {
  const [value, setValue] = useState(2);
  const [flag, setFlag] = useState<'approved' | 'rejected' | null>('approved');
  const [commentCount, setCommentCount] = useState(0);

  // Note when plumbing in mutations:
  // ActionIcons have a loading prop
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    <Group gap="xs">
      <ActionIcon
        variant={flag == 'approved' ? 'filled' : 'default'}
        onClick={() => setFlag(flag != 'approved' ? 'approved' : null)}
        title="Approve"
        color="green"
      >
        <TbThumbUp />
      </ActionIcon>
      <ActionIcon
        variant={flag == 'rejected' ? 'filled' : 'default'}
        onClick={() => setFlag(flag != 'rejected' ? 'rejected' : null)}
        title="Reject"
        color="red"
      >
        <TbThumbDown />
      </ActionIcon>
      <Divider orientation="vertical" />
      <Rating value={value} onChange={setValue} />
      <Divider orientation="vertical" />
      <Indicator
        inline
        label={commentCount}
        size={16}
        disabled={commentCount === 0}
      >
        <ActionIcon
          variant="default"
          onClick={() => setCommentCount(commentCount + 1)}
        >
          {commentCount == 0 ? <BiComment /> : <BiCommentDetail />}
        </ActionIcon>
      </Indicator>
    </Group>
  );
};
