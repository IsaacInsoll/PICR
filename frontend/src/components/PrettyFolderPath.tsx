import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import type { MantineColor } from '@mantine/core';
import { Code, Group } from '@mantine/core';
import { Joiner } from './FolderName';
import type { MouseEvent } from 'react';

export const PrettyFolderPath = ({
  folder,
  subColor,
  onClick,
}: {
  folder: PicrFolder;
  subColor?: MantineColor;
  onClick?: (e: MouseEvent, f: PicrFolder) => void;
}) => {
  const handleClick = (e: MouseEvent, f: PicrFolder) => {
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
            {normalizeDisplayName(f.name)}
          </Code>
          <Joiner />
        </>
      ))}
      <Code
        color="blue.7"
        style={style}
        onClick={(e) => handleClick(e, folder)}
      >
        {normalizeDisplayName(folder.name)}
      </Code>
    </Group>
  );
};
