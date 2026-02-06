import { CommentPermissions } from '../../../graphql-types';
import { ReactNode } from 'react';
import { CommentAddIcon, CommentDisabledIcon, CommentIcon } from '../PicrIcons';

export const commentPermissionsStyle: {
  [key in CommentPermissions]: { icon: ReactNode; color: string };
} = {
  [CommentPermissions.None]: {
    icon: <CommentDisabledIcon />,
    color: 'gray',
  },
  [CommentPermissions.Read]: {
    icon: <CommentIcon />,
    color: 'blue',
  },
  [CommentPermissions.Edit]: {
    icon: <CommentAddIcon />,
    color: 'green',
  },
};
