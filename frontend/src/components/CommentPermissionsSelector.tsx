import { Box, Button, InputDescription, InputLabel } from '@mantine/core';
import { CommentPermissions } from '@shared/gql/graphql';
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
          const isSelected = opt.value === value;
          const { icon } = commentPermissionsStyle[opt.value];
          return (
            <Button
              leftSection={icon}
              title={opt.label}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt.value)}
              key={opt.value}
              size="xs"
            >
              {opt.label}
            </Button>
          );
        })}
      </Button.Group>
      <InputDescription pb="xs">{description[value]}</InputDescription>
    </Box>
  );
};

const options: Array<{ value: CommentPermissions; label: string }> = [
  { value: CommentPermissions.None, label: 'none' },
  { value: CommentPermissions.Read, label: 'read' },
  { value: CommentPermissions.Edit, label: 'edit' },
];

const description = {
  none: 'Users cannot see or edit ratings/comments',
  read: "Users can see other users ratings/comments but can't change ratings or add comments",
  edit: 'Users can see other users comments/ratings and add their own',
} as const;
