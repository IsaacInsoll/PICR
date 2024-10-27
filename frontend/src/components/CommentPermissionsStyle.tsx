import { CommentPermissions } from '../../../graphql-types';
import { ReactNode } from 'react';
import { BiComment, BiCommentAdd, BiCommentX } from 'react-icons/bi';

export const commentPermissionsStyle: {
  [key in CommentPermissions]: { icon: ReactNode; color: string };
} = {
  [CommentPermissions.None]: {
    icon: <BiCommentX />,
    color: 'gray',
  },
  [CommentPermissions.Read]: {
    icon: <BiComment />,
    color: 'blue',
  },
  [CommentPermissions.Edit]: {
    icon: <BiCommentAdd />,
    color: 'green',
  },
};
