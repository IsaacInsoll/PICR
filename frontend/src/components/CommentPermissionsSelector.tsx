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
      <InputDescription pb="xs">
        This includes comments, ratings and flags
      </InputDescription>
      <Button.Group>
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
    </Box>
  );
};

const options: CommentPermissions[] = ['none', 'read', 'edit'];
