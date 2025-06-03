import { useColorScheme } from 'react-native';

interface PicrAppTheme {
  mode: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
}

export const useTheme = (): PicrAppTheme => {
  let colorScheme = useColorScheme();
  const isDark = colorScheme == 'dark';
  return isDark ? darkTheme : lightTheme;
};

const baseTheme: Partial<PicrAppTheme> = {} as const;
const darkTheme: PicrAppTheme = {
  ...baseTheme,
  mode: 'dark',
  backgroundColor: '#000',
  textColor: '#fff',
} as const;
const lightTheme: PicrAppTheme = {
  ...baseTheme,
  mode: 'light',
  backgroundColor: '#fff',
  textColor: '#000',
} as const;
