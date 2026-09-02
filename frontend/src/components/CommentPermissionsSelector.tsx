import { Box, Button, InputDescription, InputLabel } from '@mantine/core';
import { CommentPermissions } from '@shared/gql/graphql';
import { commentPermissionsStyle } from './CommentPermissionsStyle';
import { useTranslation } from 'react-i18next';

export const CommentPermissionsSelector = ({
  value,
  onChange,
}: {
  value: CommentPermissions;
  onChange: (value: CommentPermissions) => void;
}) => {
  const { t } = useTranslation('admin');
  const selectedOption = options.find((option) => option.value === value);
  return (
    <Box>
      <InputLabel>{t('links.comments.label')}</InputLabel>

      <Button.Group pb="xs">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const { icon } = commentPermissionsStyle[opt.value];
          return (
            <Button
              leftSection={icon}
              title={t(opt.labelKey)}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt.value)}
              key={opt.value}
              size="xs"
            >
              {t(opt.labelKey)}
            </Button>
          );
        })}
      </Button.Group>
      <InputDescription pb="xs">
        {selectedOption ? t(selectedOption.descriptionKey) : null}
      </InputDescription>
    </Box>
  );
};

const options: Array<{
  value: CommentPermissions;
  labelKey:
    'links.comments.none' | 'links.comments.read' | 'links.comments.edit';
  descriptionKey:
    | 'links.comments.noneDescription'
    | 'links.comments.readDescription'
    | 'links.comments.editDescription';
}> = [
  {
    value: CommentPermissions.None,
    labelKey: 'links.comments.none',
    descriptionKey: 'links.comments.noneDescription',
  },
  {
    value: CommentPermissions.Read,
    labelKey: 'links.comments.read',
    descriptionKey: 'links.comments.readDescription',
  },
  {
    value: CommentPermissions.Edit,
    labelKey: 'links.comments.edit',
    descriptionKey: 'links.comments.editDescription',
  },
];
