import { LinkMode } from '../../../graphql-types';
import { ReactNode } from 'react';
import { DownloadIcon, FileIcon } from '../PicrIcons';

export const linkModeStyle: {
  [key in LinkMode]: { icon: ReactNode; color: string; label: string };
} = {
  [LinkMode.FinalDelivery]: {
    icon: <DownloadIcon />,
    color: 'green',
    label: 'Final Delivery',
  },
  [LinkMode.ProofNoDownloads]: {
    icon: <FileIcon />,
    color: 'gray',
    label: 'Proof (no downloads)',
  },
};
