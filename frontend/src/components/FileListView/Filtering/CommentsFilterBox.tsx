import { Button } from '@mantine/core';
import { useAtom } from 'jotai';
import type {
  CommentsFilterOptions,
  FilterOptionsInterface,
} from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import type { ReactNode } from 'react';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';

export const CommentsFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  const value = options.comments;

  return (
    <Button.Group>
      {commentOptions.map(({ value: optionValue, label, icon }) => {
        const isSelected = optionValue === value;
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
  label: string;
  icon: ReactNode;
}[] = [
  { value: 'none', label: 'No Comments', icon: <CommentIcon /> },
  { value: 'some', label: 'Has Comments', icon: <CommentsIcon /> },
];
