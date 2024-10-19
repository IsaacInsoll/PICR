import {
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Textarea,
  Timeline,
} from '@mantine/core';
import { closeModalAtom, modalAtom } from '../../../atoms/modalAtom';
import { useSetAtom } from 'jotai/index';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Suspense, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { MinimalFile } from '../../../../types';
import { CommentBodyItem } from './CommentBodyItem';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { addCommentMutation } from './AddCommentMutation';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { gql } from '../../../helpers/gql';
import { useAtomValue } from 'jotai';

export const CommentModal = () => {
  const { file, open } = useAtomValue(modalAtom);
  const onClose = useSetAtom(closeModalAtom);

  const isMobile = useIsSmallScreen();

  return (
    <>
      <Modal
        opened={open}
        onClose={onClose}
        title={'Comments on ' + file?.name}
        fullScreen={isMobile}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <CommentBody file={file} />
        </Suspense>
      </Modal>
    </>
  );
};

const CommentBody = ({ file }: { file: MinimalFile }) => {
  const [result, requery] = useQuery({
    query: commentHistoryQuery,
    variables: { fileId: file.id },
    requestPolicy: 'cache-and-network',
  });
  const [, mutate] = useMutation(addCommentMutation);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { commentPermissions, readOnly, canEdit } = useCommentPermissions();

  const onSubmit = async () => {
    setSubmitting(true);
    const result = await mutate({ id: file?.id, comment: text });
    await requery();
    setSubmitting(false);
    if (!result.error) setText('');
  };

  const comments = result.data.comments;

  return (
    <Stack>
      <ScrollArea>
        <Timeline active={1} bulletSize={24} lineWidth={2}>
          {comments.map((c) => (
            <CommentBodyItem comment={c} />
          ))}
        </Timeline>
      </ScrollArea>
      {canEdit ? (
        <>
          <Divider />
          <Textarea
            label="Add Comment"
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={4}
          />
          <Group justify="end">
            <Button
              variant="filled"
              disabled={text.length == 0}
              onClick={onSubmit}
              loading={submitting}
            >
              Add Comment
            </Button>
          </Group>
        </>
      ) : null}
    </Stack>
  );
};

const commentHistoryQuery = gql(/* GraphQL */ `
  query commentHistoryQuery($fileId: ID!) {
    comments(fileId: $fileId) {
      id
      comment
      systemGenerated
      timestamp
      user {
        id
      }
    }
  }
`);
