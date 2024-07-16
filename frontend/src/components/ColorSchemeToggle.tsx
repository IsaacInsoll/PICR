import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { CiDark, CiLight } from 'react-icons/ci';

const ColorSchemeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  const isLight = computedColorScheme === 'light';

  return (
    <ActionIcon
      onClick={() => setColorScheme(isLight ? 'dark' : 'light')}
      variant="default"
      // size="xl"
      aria-label="Toggle color scheme"
    >
      {isLight ? <CiDark /> : <CiLight />}
    </ActionIcon>
  );
};
