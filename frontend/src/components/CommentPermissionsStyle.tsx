import { CommentPermissions } from '../../../graphql-types';
import { ReactNode } from 'react';
import { BiCommentAdd, BiCommentX } from 'react-icons/bi';
import { CommentIcon } from '../PicrIcons';

export const commentPermissionsStyle: {
  [key in CommentPermissions]: { icon: ReactNode; color: string };
} = {
  [CommentPermissions.None]: {
    icon: <BiCommentX />,
    color: 'gray',
  },
  [CommentPermissions.Read]: {
    icon: <CommentIcon />,
    color: 'blue',
  },
  [CommentPermissions.Edit]: {
    icon: <BiCommentAdd />,
    color: 'green',
  },
};
