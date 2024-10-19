import { ReactNode } from 'react';
import { FileFlag } from '../../../../../graphql-types';
import { ApproveIcon, NoFlagIcon, RejectIcon } from '../../../PicrIcons';

interface FlagStyle {
  color: string;
  icon: ReactNode;
  value: FileFlag;
  label: string;
}

export const approvedFlagStyle: FlagStyle = {
  color: 'green',
  icon: <ApproveIcon />,
  value: FileFlag.Approved,
  label: 'Approved',
};
export const rejectedFlagStyle: FlagStyle = {
  color: 'red',
  icon: <RejectIcon />,
  value: FileFlag.Rejected,
  label: 'Rejected',
};
export const noneFlagStyle: FlagStyle = {
  color: 'gray',
  icon: <NoFlagIcon />,
  value: FileFlag.None,
  label: 'None',
};

export const fileFlagStyles: { [key in FileFlag]: FlagStyle } = {
  [FileFlag.Approved]: approvedFlagStyle,
  [FileFlag.Rejected]: rejectedFlagStyle,
  [FileFlag.None]: noneFlagStyle,
};

export const fileFlags = [approvedFlagStyle, rejectedFlagStyle, noneFlagStyle];
