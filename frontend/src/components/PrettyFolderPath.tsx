import { MinimalFolder } from '../../types';
import { Code, Group, MantineColor } from '@mantine/core';
import { Joiner } from './FolderName';

export const PrettyFolderPath = ({
  folder,
  subColor,
  onClick,
}: {
  folder: MinimalFolder;
  subColor?: MantineColor;
  onClick?: (e: MouseEvent, f: MinimalFolder) => void;
}) => {
  const handleClick = (f, e) => {
    if (onClick) {
      onClick(e, f);
    }
  };
  const style = { cursor: onClick ? 'pointer' : undefined };

  return (
    <Group gap={1}>
      {folder.parents?.toReversed().map((f) => (
        <>
          <Code
            key={f.id}
            style={style}
            color={subColor}
            onClick={(e) => handleClick(e, f)}
          >
            {f.name}
          </Code>
          <Joiner />
        </>
      ))}
      <Code color="blue.7" style={style} onClick={(e) => handleClick(e, f)}>
        {folder.name}
      </Code>
    </Group>
  );
};
