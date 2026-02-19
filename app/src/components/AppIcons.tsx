import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextStyle } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

type IIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;
type IIconButtonProps = ComponentProps<typeof Ionicons.Button>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const ApprovedIcon = (props: IIconProps) => {
  return <Ionicons name="thumbs-up-outline" {...props} />;
};
export const FolderIcon = (props: IIconProps) => {
  return <Ionicons name="folder-outline" {...props} />;
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
        !totalComments || totalComments === 0
          ? 'chatbubble-outline'
          : 'chatbubble-ellipses-outline'
      }
      {...props}
    />
  );
};

export const AppIconButton = ({ style, ...props }: IIconButtonProps) => {
  const theme = useAppTheme();
  const defaultStyles: TextStyle = { backgroundColor: theme.brandColor };
  const mergedStyle = StyleSheet.flatten([defaultStyles, style]);
  return <Ionicons.Button size={16} style={mergedStyle} {...props} />;
};

export const appMetadataIcons: Record<string, IoniconName> = {
  __typename: 'information-circle-outline',
  //   //PHOTO
  Camera: 'camera-outline',
  Lens: 'telescope-outline',
  ISO: 'film-outline',
  ExposureTime: 'stopwatch-outline',
  Aperture: 'aperture-outline',
  Artist: 'person',
  DateTimeEdit: 'time-outline',
  DateTimeOriginal: 'time-outline',
  //   //VIDEO
  Audio: 'volume-medium-outline',
  Framerate: 'videocam-outline',
  Height: 'resize',
  Width: 'resize',
  Video: 'videocam-outline',
  Format: 'information',
  Duration: 'stopwatch-outline',
  Bitrate: 'pulse-outline',
  AspectRatio: 'resize-outline',
  Rating: 'star-half-outline',
} as const;
