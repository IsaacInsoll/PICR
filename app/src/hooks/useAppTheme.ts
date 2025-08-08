import { useColorScheme } from 'react-native';

interface PicrAppTheme {
  mode: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  tabColor?: string;
  brandColor: string;
  dimmedColor: string;

  // file flags/star colors
  red: string;
  green: string;
  blue: string;
  gold: string;
}

export const useAppTheme = (): PicrAppTheme => {
  let colorScheme = useColorScheme();
  const isDark = colorScheme == 'dark';
  return isDark ? darkTheme : lightTheme;
};

const baseTheme: Pick<PicrAppTheme, 'green' | 'red' | 'gold' | 'blue'> = {
  green: '#00FF00',
  red: '#FF0000',
  gold: '#FFCC00',
  blue: '#99ccff',
} as const;

const darkTheme: PicrAppTheme = {
  ...baseTheme,
  mode: 'dark',
  backgroundColor: '#111111',
  textColor: '#ffffff',
  dimmedColor: '#666666',
  brandColor: '#2F8084',
  tabColor: '#000000', //android natively supports dark mode for this
} as const;
const lightTheme: PicrAppTheme = {
  ...baseTheme,
  mode: 'light',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  dimmedColor: '#999999',
  brandColor: '#1C4B4F',
  tabColor: undefined,
} as const;
