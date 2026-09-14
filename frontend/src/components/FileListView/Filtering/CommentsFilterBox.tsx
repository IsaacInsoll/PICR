import { Button } from '@mantine/core';
import type {
  CommentPresence,
  GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import type { ReactNode } from 'react';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

export const CommentsFilterBox = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  const { t } = useTranslation('gallery');

  const value = filters.comments;

  return (
    <Button.Group>
      {commentOptions.map(({ value: optionValue, labelKey, icon }) => {
        const isSelected = optionValue === value;
        const label = t(labelKey);
        return (
          <Button
            style={{ flexGrow: 1 }}
            title={label}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() =>
              onChange({
                ...filters,
                comments: isSelected ? null : optionValue,
              })
            }
            key={optionValue}
            size="xs"
            leftSection={icon}
          >
            {label}
          </Button>
        );
      })}
    </Button.Group>
  );
};

const commentOptions: {
  value: CommentPresence;
  labelKey: 'filter.commentsNone' | 'filter.commentsHas';
  icon: ReactNode;
}[] = [
  {
    value: 'none',
    labelKey: 'filter.commentsNone',
    icon: <CommentIcon />,
  },
  {
    value: 'some',
    labelKey: 'filter.commentsHas',
    icon: <CommentsIcon />,
  },
];
