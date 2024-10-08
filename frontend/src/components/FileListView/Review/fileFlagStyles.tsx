import { ReactNode } from 'react';
import { FileFlag } from '../../../../../graphql-types';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { MdOutlineThumbsUpDown } from 'react-icons/md';

interface FlagStyle {
  color: string;
  icon: ReactNode;
  value: FileFlag;
}

export const approvedFlagStyle: FlagStyle = {
  color: 'green',
  icon: <TbThumbUp />,
  value: FileFlag.Approved,
};
export const rejectedFlagStyle: FlagStyle = {
  color: 'red',
  icon: <TbThumbDown />,
  value: FileFlag.Rejected,
};
export const noneFlagStyle: FlagStyle = {
  color: 'gray',
  icon: <MdOutlineThumbsUpDown />,
  value: FileFlag.None,
};

export const fileFlagStyles: { [key in FileFlag]: FlagStyle } = {
  [FileFlag.Approved]: approvedFlagStyle,
  [FileFlag.Rejected]: rejectedFlagStyle,
  [FileFlag.None]: noneFlagStyle,
};

export const fileFlags = [approvedFlagStyle, rejectedFlagStyle, noneFlagStyle];
