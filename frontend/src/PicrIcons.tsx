import {
  TbClipboard,
  TbDots,
  TbDownload,
  TbFile,
  TbFilter,
  TbFolder,
  TbHome,
  TbInfoCircle,
  TbInfoTriangle,
  TbLayoutDashboard,
  TbLink,
  TbLogout,
  TbNotification,
  TbSearch,
  TbSpy,
  TbThumbDown,
  TbThumbUp,
  TbTrash,
  TbTypeface,
  TbUserCog,
  TbVideo,
} from 'react-icons/tb';
import { CiAt } from 'react-icons/ci';
import { IconBaseProps } from 'react-icons/lib/iconBase';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import { BiComment, BiCommentDetail, BiSolidError } from 'react-icons/bi';

// Most icons are used in multiple places, so lets have a master list for consistency
export const PublicLinkIcon = (props: IconBaseProps) => <TbLink {...props} />;
export const InfoIcon = (props: IconBaseProps) => <TbInfoCircle {...props} />;
export const UserSettingsIcon = (props: IconBaseProps) => (
  <TbUserCog {...props} />
);

export const ClipboardIcon = (props: IconBaseProps) => (
  <TbClipboard {...props} />
);
export const ApproveIcon = (props: IconBaseProps) => <TbThumbUp {...props} />;
export const RejectIcon = (props: IconBaseProps) => <TbThumbDown {...props} />;
export const NoFlagIcon = (props: IconBaseProps) => (
  <MdOutlineThumbsUpDown {...props} />
);
export const FilterIcon = (props: IconBaseProps) => <TbFilter {...props} />;
export const DownloadIcon = (props: IconBaseProps) => <TbDownload {...props} />;
export const SearchIcon = (props: IconBaseProps) => <TbSearch {...props} />;
export const HomeIcon = (props: IconBaseProps) => <TbHome {...props} />;
export const WarningIcon = (props: IconBaseProps) => (
  <TbInfoTriangle {...props} />
);

export const FolderIcon = (props: IconBaseProps) => <TbFolder {...props} />;
export const LogOutIcon = (props: IconBaseProps) => <TbLogout {...props} />;

export const FileIcon = (props: IconBaseProps) => <TbFile {...props} />;
export const VideoIcon = (props: IconBaseProps) => <TbVideo {...props} />;

export const EmailIcon = (props: IconBaseProps) => <CiAt {...props} />;
export const BrandingIcon = (props: IconBaseProps) => <TbTypeface {...props} />;
export const DeleteIcon = (props: IconBaseProps) => <TbTrash {...props} />;
export const AccessLogsIcon = (props: IconBaseProps) => <TbSpy {...props} />;
export const ErrorIcon = (props: IconBaseProps) => <BiSolidError {...props} />;
export const DotsIcon = (props: IconBaseProps) => <TbDots {...props} />;
export const CommentIcon = (props: IconBaseProps) => <BiComment {...props} />;
export const CommentsIcon = (props: IconBaseProps) => (
  <BiCommentDetail {...props} />
);
export const DashboardIcon = (props: IconBaseProps) => (
  <TbLayoutDashboard {...props} />
);

export const NotificationIcon = (props: IconBaseProps) => (
  <TbNotification {...props} />
);
