import { ReactNode } from 'react';
import { Anchor, AnchorProps } from '@mantine/core';
import { NavLink, NavLinkProps } from 'react-router';

export const PicrLink = ({
  children,
  ...props
}: { children: ReactNode } & AnchorProps & NavLinkProps) => {
  return (
    <Anchor component={NavLink} {...props}>
      {children}
    </Anchor>
  );
};
