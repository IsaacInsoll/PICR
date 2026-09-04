import type { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';

type MockIconProps = {
  name?: string;
  testID?: string;
};

type MockIconButtonProps = MockIconProps & {
  accessibilityLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
};

const MockIcon = ({ name, testID }: MockIconProps) => (
  <Text testID={testID}>{name}</Text>
);

const MockIconButton = ({
  accessibilityLabel,
  children,
  disabled,
  name,
  onPress,
  testID,
}: MockIconButtonProps) => (
  <TouchableOpacity
    accessibilityLabel={accessibilityLabel}
    disabled={disabled}
    onPress={onPress}
    testID={testID}
  >
    <Text>{name}</Text>
    {children}
  </TouchableOpacity>
);

export const Ionicons = Object.assign(MockIcon, { Button: MockIconButton });
