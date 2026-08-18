import type { ReactNode } from 'react';
import { FileFlag } from '@shared/gql/graphql';
import { ApproveIcon, NoFlagIcon, RejectIcon } from '../../../PicrIcons';

interface FlagStyle {
  color: string;
  icon: ReactNode;
  value: FileFlag;
  labelKey: 'review.approved' | 'review.rejected' | 'review.none';
}

export const approvedFlagStyle: FlagStyle = {
  color: 'green',
  icon: <ApproveIcon />,
  value: FileFlag.Approved,
  labelKey: 'review.approved',
};
export const rejectedFlagStyle: FlagStyle = {
  color: 'red',
  icon: <RejectIcon />,
  value: FileFlag.Rejected,
  labelKey: 'review.rejected',
};
export const noneFlagStyle: FlagStyle = {
  color: 'gray',
  icon: <NoFlagIcon />,
  value: FileFlag.None,
  labelKey: 'review.none',
};

export const fileFlagStyles: { [key in FileFlag]: FlagStyle } = {
  [FileFlag.Approved]: approvedFlagStyle,
  [FileFlag.Rejected]: rejectedFlagStyle,
  [FileFlag.None]: noneFlagStyle,
};

export const fileFlags = [approvedFlagStyle, rejectedFlagStyle, noneFlagStyle];
