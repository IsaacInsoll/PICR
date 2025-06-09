import { Platform, useColorScheme } from 'react-native';

interface PicrAppTheme {
  mode: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  tabColor?: string;
  brandColor: string;
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
  backgroundColor: '#111',
  textColor: '#fff',
  brandColor: '#2F8084',
  tabColor: '#000', //android natively supports dark mode for this
} as const;
const lightTheme: PicrAppTheme = {
  ...baseTheme,
  mode: 'light',
  backgroundColor: '#fff',
  textColor: '#000',
  brandColor: '#1C4B4F',
  tabColor: undefined,
} as const;
