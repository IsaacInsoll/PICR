import { Button } from '@mantine/core';
import { useAtom } from 'jotai';
import type {
  CommentsFilterOptions,
  FilterOptionsInterface,
} from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import type { ReactNode } from 'react';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

export const CommentsFilterBox = () => {
  const { t } = useTranslation('gallery');
  const [options, setOptions] = useAtom(filterOptions);

  const value = options.comments;

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
              setOptions((o: FilterOptionsInterface) => ({
                ...o,
                comments: isSelected ? null : optionValue,
              }))
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
  value: CommentsFilterOptions;
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
