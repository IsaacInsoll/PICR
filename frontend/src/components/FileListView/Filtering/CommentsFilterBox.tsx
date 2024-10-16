import { ActionIcon, Button, Group } from '@mantine/core';
import { useAtom } from 'jotai/index';
import {
  CommentsFilterOptions,
  filterOptions,
} from '../../../atoms/filterAtom';
import { ReactNode } from 'react';
import { TbEqual, TbMathEqualLower } from 'react-icons/tb';
import { FileRating } from '../Review/FileRating';
import { BiComment, BiCommentDetail } from 'react-icons/bi';

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
  { v: 'None', title: 'No Comments', icon: <BiComment /> },
  { v: 'Some', title: 'Has Comments', icon: <BiCommentDetail /> },
];
