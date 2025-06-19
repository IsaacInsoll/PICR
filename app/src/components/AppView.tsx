import { View, ViewProps } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export const AppView = ({ children, style, ...props }: ViewProps) => {
  const theme = useAppTheme();
  return (
    <View style={{ backgroundColor: theme.backgroundColor, ...style }}>
      {children}
    </View>
  );
};
