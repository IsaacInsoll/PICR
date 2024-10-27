import { MinimalFolder } from '../../types';
import { Code, Group, Tooltip } from '@mantine/core';
import { joiner } from '../../../backend/helpers/joinTitle';
import { TbChevronRight, TbChevronsRight } from 'react-icons/tb';

export const FolderName = ({ folder }: { folder: MinimalFolder }) => {
  return (
    <Tooltip
      withArrow={true}
      color="gray"
      disabled={folder.parents?.length == 0}
      label={
        <Group gap={1}>
          {folder.parents?.toReversed().map((f) => (
            <>
              <Code key={f.id}>{f.name}</Code>
              <Joiner />
            </>
          ))}
          <Code>{folder.name}</Code>
        </Group>
      }
    >
      <Code>{folder.name}</Code>
    </Tooltip>
  );
};

export const Joiner = () => {
  // eslint-disable-next-line react/jsx-no-undef
  return <TbChevronRight style={{ opacity: 0.5 }} />;
};
