import { LinkMode } from '@shared/gql/graphql';
import type { ReactNode } from 'react';
import { DownloadIcon, FileIcon } from '../PicrIcons';

export const linkModeStyle: {
  [key in LinkMode]: { icon: ReactNode; color: string };
} = {
  [LinkMode.FinalDelivery]: {
    icon: <DownloadIcon />,
    color: 'green',
  },
  [LinkMode.ProofNoDownloads]: {
    icon: <FileIcon />,
    color: 'gray',
  },
};
