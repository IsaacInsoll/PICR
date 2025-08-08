import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

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
