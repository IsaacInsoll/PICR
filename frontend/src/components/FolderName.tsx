import { MinimalFolder } from '../../types';
import { Code, Group, Tooltip } from '@mantine/core';
import { joiner } from '../../../backend/helpers/joinTitle';
import { TbChevronRight, TbChevronsRight } from 'react-icons/tb';
import { HomeIcon } from '../PicrIcons';

export const FolderName = ({ folder }: { folder: MinimalFolder }) => {
  return (
    <Tooltip
      withArrow={true}
      color="blue.9"
      disabled={folder.parents?.length == 0}
      label={
        <Group gap={1}>
          {folder.parents?.toReversed().map((f) => (
            <>
              <Code key={f.id} color="blue.8">
                {f.name}
              </Code>
              <Joiner />
            </>
          ))}
          <Code color="blue.7">{folder.name}</Code>
        </Group>
      }
    >
      <Code>
        {folder.id == 1 ? (
          <HomeIcon opacity={0.5} style={{ paddingTop: 3, marginRight: 2 }} />
        ) : null}
        {folder.name}
      </Code>
    </Tooltip>
  );
};

export const Joiner = () => {
  // eslint-disable-next-line react/jsx-no-undef
  return <TbChevronRight style={{ opacity: 0.5 }} />;
};
