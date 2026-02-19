import {
  TbArrowAutofitHeight,
  TbArrowAutofitWidth,
  TbAspectRatio,
  TbBrandSpeedtest,
  TbCalendar,
  TbCalendarBolt,
  TbCheck,
  TbChevronDown,
  TbChevronRight,
  TbChevronUp,
  TbCircleCheck,
  TbCircleXFilled,
  TbClipboard,
  TbClock,
  TbCloudDownload,
  TbCloudUpload,
  TbDeviceMobileShare,
  TbDots,
  TbDownload,
  TbEqual,
  TbExclamationCircle,
  TbFile,
  TbFileTypography,
  TbFilter,
  TbFolder,
  TbFolderOpen,
  TbFolderShare,
  TbFolderStar,
  TbFolders,
  TbHome,
  TbInfoTriangle,
  TbLabel,
  TbLayoutGrid,
  TbLink,
  TbList,
  TbLogout,
  TbMathEqualGreater,
  TbMathEqualLower,
  TbNotification,
  TbPhoto,
  TbPhotoCheck,
  TbPhotoHeart,
  TbPhotoVideo,
  TbRefresh,
  TbSearch,
  TbSlideshow,
  TbSortAscending,
  TbSortDescending,
  TbSpy,
  TbStar,
  TbTableExport,
  TbThumbDown,
  TbThumbUp,
  TbTrash,
  TbTypeface,
  TbUnlink,
  TbUser,
  TbUserCog,
  TbUserPlus,
  TbUsersGroup,
  TbVideo,
  TbVolume,
} from 'react-icons/tb';
import { CiAt, CiDark, CiLight } from 'react-icons/ci';
import { IconBaseProps } from 'react-icons';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import {
  MdBrightnessAuto,
  MdCameraRoll,
  MdOutlineCameraRoll,
  MdOutlineCropFree,
  MdOutlineCropLandscape,
  MdOutlineCropPortrait,
  MdOutlineCropSquare,
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineNetworkCheck,
  MdOutlineSdStorage,
  MdOutlineShutterSpeed,
} from 'react-icons/md';
import {
  BiComment,
  BiCommentAdd,
  BiCommentDetail,
  BiCommentX,
  BiSolidError,
} from 'react-icons/bi';
import { LuGalleryThumbnails, LuInfo, LuLayoutGrid } from 'react-icons/lu';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import { IoApertureOutline } from 'react-icons/io5';
import { LiaSignatureSolid } from 'react-icons/lia';
import { GiStarsStack } from 'react-icons/gi';
import { FaGithub } from 'react-icons/fa6';
import { VscDebugDisconnect } from 'react-icons/vsc';

// Most icons are used in multiple places, so lets have a master list for consistency
export const PublicLinkIcon = (props: IconBaseProps) => <TbLink {...props} />;
export const InfoIcon = (props: IconBaseProps) => <LuInfo {...props} />;
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
export const OpenInAppIcon = (props: IconBaseProps) => (
  <TbDeviceMobileShare {...props} />
);
export const CommentsIcon = (props: IconBaseProps) => (
  <BiCommentDetail {...props} />
);
export const DashboardIcon = (props: IconBaseProps) => (
  <LuLayoutGrid {...props} />
);

export const NotificationIcon = (props: IconBaseProps) => (
  <TbNotification {...props} />
);
export const ThumbnailsIcon = (props: IconBaseProps) => (
  <LuGalleryThumbnails {...props} />
);

// Metadata icons
export const CameraIcon = (props: IconBaseProps) => <BsCamera {...props} />;
export const LensIcon = (props: IconBaseProps) => <BsCamera2 {...props} />;
export const ISOIcon = (props: IconBaseProps) => <MdCameraRoll {...props} />;
export const ShutterSpeedIcon = (props: IconBaseProps) => (
  <MdOutlineShutterSpeed {...props} />
);
export const ApertureIcon = (props: IconBaseProps) => (
  <IoApertureOutline {...props} />
);
export const ArtistIcon = (props: IconBaseProps) => (
  <LiaSignatureSolid {...props} />
);
export const DateEditedIcon = (props: IconBaseProps) => (
  <TbCalendarBolt {...props} />
);
export const CalendarIcon = (props: IconBaseProps) => <TbCalendar {...props} />;
export const AudioIcon = (props: IconBaseProps) => <TbVolume {...props} />;
export const FramerateIcon = (props: IconBaseProps) => (
  <TbBrandSpeedtest {...props} />
);
export const HeightIcon = (props: IconBaseProps) => (
  <TbArrowAutofitHeight {...props} />
);
export const WidthIcon = (props: IconBaseProps) => (
  <TbArrowAutofitWidth {...props} />
);
export const VideoMetadataIcon = (props: IconBaseProps) => (
  <TbPhotoVideo {...props} />
);
export const DurationIcon = (props: IconBaseProps) => <TbClock {...props} />;
export const BitrateIcon = (props: IconBaseProps) => (
  <MdOutlineNetworkCheck {...props} />
);
export const AspectRatioIcon = (props: IconBaseProps) => (
  <TbAspectRatio {...props} />
);
export const RatingStarsIcon = (props: IconBaseProps) => (
  <GiStarsStack {...props} />
);

// Sort/filter
export const FilenameIcon = (props: IconBaseProps) => (
  <TbFileTypography {...props} />
);
export const StarIcon = (props: IconBaseProps) => <TbStar {...props} />;
export const SortAscIcon = (props: IconBaseProps) => (
  <TbSortAscending {...props} />
);
export const SortDescIcon = (props: IconBaseProps) => (
  <TbSortDescending {...props} />
);
export const ChevronDownIcon = (props: IconBaseProps) => (
  <TbChevronDown {...props} />
);
export const ChevronUpIcon = (props: IconBaseProps) => (
  <TbChevronUp {...props} />
);
export const EqualIcon = (props: IconBaseProps) => <TbEqual {...props} />;
export const GreaterThanEqualIcon = (props: IconBaseProps) => (
  <TbMathEqualGreater {...props} />
);
export const LessThanEqualIcon = (props: IconBaseProps) => (
  <TbMathEqualLower {...props} />
);

// Aspect ratio
export const AspectAnyIcon = (props: IconBaseProps) => (
  <MdOutlineCropFree {...props} />
);
export const AspectSquareIcon = (props: IconBaseProps) => (
  <MdOutlineCropSquare {...props} />
);
export const AspectLandscapeIcon = (props: IconBaseProps) => (
  <MdOutlineCropLandscape {...props} />
);
export const AspectPortraitIcon = (props: IconBaseProps) => (
  <MdOutlineCropPortrait {...props} />
);

// Folder operations
export const ManageFolderIcon = (props: IconBaseProps) => (
  <TbFolderStar {...props} />
);
export const MoveFolderIcon = (props: IconBaseProps) => (
  <TbFolderShare {...props} />
);
export const CsvExportIcon = (props: IconBaseProps) => (
  <TbTableExport {...props} />
);
export const FolderOpenIcon = (props: IconBaseProps) => (
  <TbFolderOpen {...props} />
);
export const FoldersIcon = (props: IconBaseProps) => <TbFolders {...props} />;
export const ChevronRightIcon = (props: IconBaseProps) => (
  <TbChevronRight {...props} />
);

// File operations
export const CloudDownloadIcon = (props: IconBaseProps) => (
  <TbCloudDownload {...props} />
);
export const SlideshowIcon = (props: IconBaseProps) => (
  <TbSlideshow {...props} />
);
export const HeroImageIcon = (props: IconBaseProps) => (
  <TbPhotoHeart {...props} />
);

// Comments
export const CommentAddIcon = (props: IconBaseProps) => (
  <BiCommentAdd {...props} />
);
export const CommentDisabledIcon = (props: IconBaseProps) => (
  <BiCommentX {...props} />
);

// Theme
export const DarkModeIcon = (props: IconBaseProps) => <CiDark {...props} />;
export const LightModeIcon = (props: IconBaseProps) => <CiLight {...props} />;
export const BrightnessAutoIcon = (props: IconBaseProps) => (
  <MdBrightnessAuto {...props} />
);
export const DarkModeOutlineIcon = (props: IconBaseProps) => (
  <MdOutlineDarkMode {...props} />
);
export const LightModeOutlineIcon = (props: IconBaseProps) => (
  <MdOutlineLightMode {...props} />
);
export const CheckIcon = (props: IconBaseProps) => <TbCheck {...props} />;

// User management
export const SaveIcon = (props: IconBaseProps) => <TbCloudUpload {...props} />;
export const UserIcon = (props: IconBaseProps) => <TbUser {...props} />;
export const AddUserIcon = (props: IconBaseProps) => <TbUserPlus {...props} />;
export const UsersGroupIcon = (props: IconBaseProps) => (
  <TbUsersGroup {...props} />
);
export const LabelIcon = (props: IconBaseProps) => <TbLabel {...props} />;
export const RefreshIcon = (props: IconBaseProps) => <TbRefresh {...props} />;

// Misc
export const UnlinkIcon = (props: IconBaseProps) => <TbUnlink {...props} />;
export const DisconnectedIcon = (props: IconBaseProps) => (
  <VscDebugDisconnect {...props} />
);
export const AlertIcon = (props: IconBaseProps) => (
  <TbExclamationCircle {...props} />
);
export const PhotoCheckIcon = (props: IconBaseProps) => (
  <TbPhotoCheck {...props} />
);
export const CircleCheckIcon = (props: IconBaseProps) => (
  <TbCircleCheck {...props} />
);
export const CircleXIcon = (props: IconBaseProps) => (
  <TbCircleXFilled {...props} />
);
export const GridViewIcon = (props: IconBaseProps) => (
  <TbLayoutGrid {...props} />
);
export const ListViewIcon = (props: IconBaseProps) => <TbList {...props} />;
export const PhotoViewIcon = (props: IconBaseProps) => <TbPhoto {...props} />;
export const MetadataIcon = (props: IconBaseProps) => (
  <MdOutlineCameraRoll {...props} />
);
export const GitHubIcon = (props: IconBaseProps) => <FaGithub {...props} />;
export const StorageIcon = (props: IconBaseProps) => (
  <MdOutlineSdStorage {...props} />
);
