import { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TextStyle } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import {
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '@shared/gql/graphql';

type IIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;
type IIconButtonProps = ComponentProps<typeof Ionicons.Button>;

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

export const appMetadataIcons: Record<
  keyof ImageMetadataSummary | keyof VideoMetadataSummary,
  string
> = {
  __typename: null,
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
