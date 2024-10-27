import {
  TbClipboard,
  TbDownload,
  TbFilter,
  TbHome,
  TbInfoCircle,
  TbLink,
  TbSearch,
  TbThumbDown,
  TbThumbUp,
  TbUserCog,
} from 'react-icons/tb';
import { IconBaseProps } from 'react-icons/lib/iconBase';
import { MdOutlineThumbsUpDown } from 'react-icons/md';

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
