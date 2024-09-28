import { ActionIcon, Divider, Group, Indicator, Rating } from '@mantine/core';
import { useState } from 'react';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { BiComment, BiCommentDetail } from 'react-icons/bi';
import { MinimalFile } from '../../../types';
import { gql } from '../../helpers/gql';
import { FileRatingFlag } from './Filtering/FileRatingFlag';
import { useMutation } from 'urql';

export const FileRating = ({ file }: { file: MinimalFile }) => {
  const [commentCount, setCommentCount] = useState(0);

  const [, mutate] = useMutation(addCommentMutation);

  const { id, flag, rating } = file;

  // Note when plumbing in mutations:
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    <Group gap="xs">
      <FileRatingFlag flag={flag} onChange={(flag) => mutate({ id, flag })} />
      <Divider orientation="vertical" />
      <Rating
        value={rating}
        onChange={(rating) => mutate({ id: id, rating })}
      />
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

const addCommentMutation = gql(/* GraphQL */ `
  mutation addComment(
    $id: ID!
    $rating: Int
    $flag: FileFlag
    $comment: String
    $name: String
  ) {
    addComment(
      id: $id
      rating: $rating
      flag: $flag
      comment: $comment
      name: $name
    ) {
      ...FileFragment
    }
  }
`);
