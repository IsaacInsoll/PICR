import { useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';

export const useIsSmallScreen = () => {
  const theme = useMantineTheme();
  const size = theme.breakpoints.sm;
  return useMediaQuery(`(max-width: ${size})`);
};

export const useIsMobile = () => {
  const theme = useMantineTheme();
  const size = theme.breakpoints.xs;
  return useMediaQuery(`(max-width: ${size})`);
};
