import { Box, Button, InputDescription, InputLabel } from '@mantine/core';
import { CommentPermissions } from '../../../graphql-types';
import { commentPermissionsStyle } from './CommentPermissionsStyle';

export const CommentPermissionsSelector = ({
  value,
  onChange,
}: {
  value: CommentPermissions;
  onChange: (value: CommentPermissions) => void;
}) => {
  return (
    <Box>
      <InputLabel>Comment Permissions</InputLabel>

      <Button.Group pb="xs">
        {options.map((opt) => {
          const isSelected = opt === value;
          const { icon, color } = commentPermissionsStyle[opt];
          return (
            <Button
              leftSection={icon}
              title={opt}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt)}
              key={opt}
              size="xs"
            >
              {opt}
            </Button>
          );
        })}
      </Button.Group>
      <InputDescription pb="xs">{description[value]}</InputDescription>
    </Box>
  );
};

const options: CommentPermissions[] = ['none', 'read', 'edit'];

const description = {
  none: 'Users cannot see or edit ratings/comments',
  read: "Users can see other users ratings/comments but can't change ratings or add comments",
  edit: 'Users can see other users comments/ratings and add their own',
} as const;
