import { useComputedColorScheme } from '@mantine/core';

export const useIsDarkMode = () => {
  const theme = useComputedColorScheme();
  return theme == 'dark';
};