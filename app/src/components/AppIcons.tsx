import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TextStyle } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

type IIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;
type IIconButtonProps = ComponentProps<typeof Ionicons.Button>;

export const ApprovedIcon = (props: IIconProps) => {
  return <Ionicons name="thumbs-up-outline" {...props} />;
};
export const RejectedIcon = (props: IIconProps) => {
  return <Ionicons name="thumbs-down-outline" {...props} />;
};

export const StarIcon = (props: IIconProps) => {
  return <Ionicons name="star" {...props} />;
};

export const GridIcon = (props: IIconProps) => {
  return <Ionicons name="grid-outline" {...props} />;
};

export const CommentIcon = ({
  totalComments,
  ...props
}: { totalComments?: number } & IIconProps) => {
  return (
    <Ionicons
      name={
        !totalComments || totalComments == 0
          ? 'chatbubble-outline'
          : 'chatbubble-ellipses-outline'
      }
      {...props}
    />
  );
};

export const AppIconButton = ({ style, ...props }: IIconProps) => {
  const theme = useAppTheme();
  const defaultStyles: TextStyle = { backgroundColor: theme.brandColor };
  return (
    <Ionicons.Button
      size={16}
      style={{ ...defaultStyles, ...style }}
      {...props}
    />
  );
};
