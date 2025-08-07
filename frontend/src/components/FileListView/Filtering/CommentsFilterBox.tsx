import { Button } from '@mantine/core';
import { useAtom } from 'jotai/index';
import {
  CommentsFilterOptions,
  filterOptions,
} from '@shared/filterAtom';
import { ReactNode } from 'react';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';

export const CommentsFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  const onChange = (comments: CommentsFilterOptions) =>
    setOptions((o) => ({ ...o, comments }));

  const value = options.comments;

  return (
    <Button.Group>
      {x.map(({ title, v, icon }) => {
        const isSelected = v === value;
        return (
          <Button
            style={{ flexGrow: 1 }}
            title={title}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() => onChange(isSelected ? null : v)}
            key={title}
            size="xs"
            leftSection={icon}
          >
            {title}
          </Button>
        );
      })}
    </Button.Group>
  );
};

const x: {
  v: CommentsFilterOptions;
  title: string;
  icon: ReactNode;
}[] = [
  { v: 'None', title: 'No Comments', icon: <CommentIcon /> },
  { v: 'Some', title: 'Has Comments', icon: <CommentsIcon /> },
];
