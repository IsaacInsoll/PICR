import { ReactNode } from 'react';
import { Box, Text } from '@mantine/core';

export const EmptyPlaceholder = ({
  text,
  icon,
}: {
  text: string;
  icon: ReactNode;
}) => {
  return (
    <Box style={{ opacity: 0.33 }} ta="center" p="md">
      <Box style={{ fontSize: 72, opacity: 0.5 }} p="md">
        {icon}
      </Box>
      <Text ta="center">{text}</Text>
    </Box>
  );
};
